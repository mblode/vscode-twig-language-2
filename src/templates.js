"use strict";
const path = require("node:path");
const { twigStart, twigEnd, expressionParts } = require("./formatter/lexer");
const TAG = /^\{%[-~]?\s*(include|extends|embed|import|from|use)\b/;
// Keep the lexer's interpolation and comment handling, even while a string is being typed.
function templateParts(raw) {
  let end = raw.length;
  while (true) {
    try {
      const parts = expressionParts(raw.slice(0, end));
      if (end < raw.length)
        parts.push({
          kind: "string",
          text: raw.slice(end),
          start: end,
          end: raw.length,
          incomplete: true,
        });
      return parts;
    } catch (error) {
      // An unfinished interpolation may report an inner string first.
      end = error.offset;
    }
  }
}
// Template names are the string literals of a tag's first expression or a call's first argument.
function names(parts, from, call, offset, found) {
  const stack = [];
  for (let i = from; i < parts.length; i++) {
    const part = parts[i];
    if (part.kind === "string") {
      const name = part.text.slice(1, part.incomplete ? undefined : -1);
      // Concatenated and interpolated names are dynamic.
      if (
        !stack.includes("{") &&
        !/[\\\r\n]|#\{|%\}|\}\}/.test(name) &&
        parts[i - 1]?.text !== "~" &&
        parts[i + 1]?.text !== "~"
      )
        found.set(offset + part.start + 1, {
          start: offset + part.start + 1,
          end: offset + part.start + 1 + name.length,
          name,
          incomplete: !!part.incomplete,
        });
    } else if (["[", "(", "{"].includes(part.text)) stack.push(part.text);
    else if (["]", ")", "}"].includes(part.text)) {
      if (!stack.length) return;
      stack.pop();
    } else if (
      !stack.length &&
      (call
        ? part.text === ","
        : /^(with|only|ignore|import|as)$/.test(part.text))
    )
      return;
  }
}
function templateStrings(source, limit = source.length) {
  const found = new Map();
  for (let i = 0; i < limit; i++) {
    if (!twigStart(source, i)) continue;
    let end;
    try {
      end = twigEnd(source, i);
    } catch {
      end = source.indexOf(
        source[i + 1] === "{" ? "}}" : source[i + 1] + "}",
        i + 2,
      );
      end = end < 0 ? source.length : end + 2;
    }
    const raw = source.slice(i, end);
    const literal = /^\{%[-~]?\s*(raw|verbatim)\b/.exec(raw);
    if (literal) {
      const close = new RegExp(
        `\\{%[-~]?\\s*end${literal[1]}\\s*[-~]?%\\}`,
        "g",
      );
      close.lastIndex = end;
      end = close.exec(source) ? close.lastIndex : source.length;
    } else if (raw[1] !== "#") {
      const body = raw.slice(2).replace(/[-~]?[}%]\}$/, "");
      const parts = templateParts(body).filter(
        (part) => part.kind !== "space" && part.kind !== "comment",
      );
      const tag = TAG.exec(raw);
      if (tag) {
        const from = parts.findIndex((part) => part.start >= tag[0].length - 2);
        if (from >= 0 && !(tag[1] === "include" && parts[from].text === "("))
          names(parts, from, false, i + 2, found);
      }
      for (let index = 0; index < parts.length - 1; index++) {
        if (
          parts[index].kind === "word" &&
          /^(include|source)$/.test(parts[index].text) &&
          parts[index + 1].text === "(" &&
          ![".", "?.", "$"].includes(parts[index - 1]?.text)
        )
          names(parts, index + 2, true, i + 2, found);
      }
    }
    i = end - 1;
  }
  return [...found.values()];
}
function templateReferences(source) {
  return templateStrings(source)
    .filter((ref) => !ref.incomplete && ref.name)
    .map(({ start, end, name }) => ({ start, end, name }));
}
// Twig loaders need names relative to a root; Craft also resolves names without an extension.
function templateCandidates(name, roots, namespaces, join) {
  let bases = roots;
  const namespace = /^@([\w-]+)\/(.*)$/.exec(name);
  if (namespace) {
    bases = [].concat(namespaces[namespace[1]] || []);
    name = namespace[2];
  }
  name = name.replace(/^\.?\/+/, "");
  if (!name) return [];
  const suffixes = /\.[^/]+$/.test(name)
    ? [""]
    : ["", ".twig", ".html.twig", ".html", "/index.twig", "/index.html"];
  return bases.flatMap((base) =>
    suffixes.map((suffix) => join(base, name + suffix)),
  );
}
function registerTemplates(vscode, context, language, configFor) {
  async function resolve(document, name, cache) {
    const config = configFor(document);
    const folder = vscode.workspace.getWorkspaceFolder(document.uri)?.uri;
    const root = (value) =>
      /^([a-zA-Z]:)?[\\/]/.test(value)
        ? vscode.Uri.file(value)
        : folder && vscode.Uri.joinPath(folder, value);
    const roots = [
      ...config.get("templatePaths", []).map(root),
      vscode.Uri.joinPath(document.uri, ".."),
    ].filter(Boolean);
    const namespaces = {};
    for (const [key, value] of Object.entries(
      config.get("templateNamespaces", {}) || {},
    ))
      namespaces[key.replace(/^@/, "")] = []
        .concat(value)
        .map(root)
        .filter(Boolean);
    for (const uri of templateCandidates(
      name,
      roots,
      namespaces,
      (base, path) => vscode.Uri.joinPath(base, path),
    )) {
      const key = uri.toString();
      if (key === document.uri.toString()) continue;
      if (!cache.has(key))
        cache.set(
          key,
          Promise.resolve(vscode.workspace.fs.stat(uri)).then(
            (stat) => (stat.type & vscode.FileType.File) !== 0,
            () => false,
          ),
        );
      if (await cache.get(key)) return uri;
    }
  }
  const range = (document, ref) =>
    new vscode.Range(
      document.positionAt(ref.start),
      document.positionAt(ref.end),
    );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(language, {
      async provideDefinition(document, position) {
        const offset = document.offsetAt(position);
        const ref = templateReferences(document.getText()).find(
          (r) => r.start <= offset && offset <= r.end,
        );
        const target = ref && (await resolve(document, ref.name, new Map()));
        if (target)
          return [
            {
              originSelectionRange: range(document, ref),
              targetUri: target,
              targetRange: new vscode.Range(0, 0, 0, 0),
            },
          ];
      },
    }),
  );
}
const DEFAULT_CONFIG_PATH = "ide-twig.json";

function validNamespaceEntry(entry) {
  return (
    entry &&
    (entry.namespace === undefined || typeof entry.namespace === "string") &&
    typeof entry.path === "string" &&
    entry.path.length > 0
  );
}

function configEntries(value) {
  return Array.isArray(value?.namespaces)
    ? value.namespaces.filter(validNamespaceEntry)
    : [];
}

function templateReference(namespace, root, uri) {
  const relative = path.posix
    .relative(root.path, uri.path)
    .replaceAll("\\", "/");
  return namespace ? `@${namespace}/${relative}` : relative;
}

function templateStringContext(source, offset) {
  const ref = templateStrings(source, offset).find(
    (ref) => ref.start <= offset && offset <= ref.end,
  );
  if (ref) return { start: ref.start, end: ref.incomplete ? offset : ref.end };
}

function registerTemplateCompletions(vscode, context, output, namespace) {
  const folders = new Map();
  const settingPath = (folder) =>
    vscode.workspace
      .getConfiguration(namespace, folder.uri)
      .get("ideTwigConfigPath", DEFAULT_CONFIG_PATH);
  const updateRootWatchers = (state, roots) => {
    const directories = new Map(
      roots.map((entry) => [entry.uri.toString(), entry.uri]),
    );
    for (const [key, watcher] of state.rootWatchers) {
      if (directories.has(key)) continue;
      watcher.dispose();
      state.rootWatchers.delete(key);
    }
    for (const [key, root] of directories) {
      if (state.rootWatchers.has(key)) continue;
      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(root, "**/*.twig"),
      );
      const refresh = () => void load(state, state.configured);
      watcher.onDidCreate(refresh);
      watcher.onDidDelete(refresh);
      state.rootWatchers.set(key, watcher);
    }
  };
  const load = async (state, configured) => {
    const version = ++state.loadVersion;
    const isCurrent = () => version === state.loadVersion && !state.disposed;
    if (!isCurrent()) return;
    if (!configured) {
      updateRootWatchers(state, []);
      state.items = [];
      return;
    }
    const configUri = vscode.Uri.joinPath(state.folder.uri, configured);
    let value;
    try {
      value = JSON.parse(
        Buffer.from(await vscode.workspace.fs.readFile(configUri)).toString(),
      );
    } catch (error) {
      if (!isCurrent()) return;
      if (error?.code !== "FileNotFound")
        output.appendLine(
          `Template completion config skipped: ${error.message}`,
        );
      updateRootWatchers(state, []);
      state.items = [];
      return;
    }
    if (!isCurrent()) return;
    const configDirectory = configUri.with({
      path: path.posix.dirname(configUri.path),
    });
    const entries = configEntries(value);
    const roots = entries.map((entry) => ({
      ...entry,
      uri: vscode.Uri.joinPath(configDirectory, entry.path),
    }));
    updateRootWatchers(state, roots);
    const results = new Map();
    const scans = new Map();
    for (const entry of roots) {
      const key = entry.uri.toString();
      if (!scans.has(key)) {
        let files;
        try {
          files = await vscode.workspace.findFiles(
            new vscode.RelativePattern(entry.uri, "**/*.twig"),
            null,
          );
        } catch (error) {
          if (!isCurrent()) return;
          output.appendLine(`Template directory skipped: ${error.message}`);
          files = [];
        }
        if (!isCurrent()) return;
        scans.set(key, files);
      }
      for (const uri of scans.get(key)) {
        const label = templateReference(entry.namespace, entry.uri, uri);
        if (!results.has(label)) results.set(label, { label, uri });
      }
    }
    if (!isCurrent()) return;
    state.items = [...results.values()];
  };
  const watchConfig = (state, configured) => {
    if (state.configured === configured) return;
    state.configWatcher?.dispose();
    state.configWatcher = undefined;
    state.configured = configured;
    if (!configured || state.disposed) return;
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(state.folder.uri, configured),
    );
    state.configWatcher = watcher;
    watcher.onDidCreate(state.reload);
    watcher.onDidChange(state.reload);
    watcher.onDidDelete(state.reload);
  };
  const refresh = (state) => {
    const configured = settingPath(state.folder);
    watchConfig(state, configured);
    void load(state, configured);
  };
  const createState = (folder) => {
    const state = {
      folder,
      items: [],
      rootWatchers: new Map(),
      loadVersion: 0,
      configured: undefined,
      disposed: false,
      reload: () => refresh(state),
      dispose() {
        state.disposed = true;
        state.loadVersion++;
        updateRootWatchers(state, []);
        state.configWatcher?.dispose();
      },
    };
    folders.set(folder.uri.toString(), state);
    state.reload();
    return state;
  };
  const stateFor = (document) => {
    const folder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!folder) return;
    let state = folders.get(folder.uri.toString());
    if (!state) state = createState(folder);
    return state;
  };
  const provider = vscode.languages.registerCompletionItemProvider(
    "twig",
    {
      provideCompletionItems(document, position, token) {
        if (token.isCancellationRequested) return;
        const context = templateStringContext(
          document.getText(),
          document.offsetAt(position),
        );
        if (!context) return;
        const state = stateFor(document);
        if (!state) return;
        const range = new vscode.Range(
          document.positionAt(context.start),
          document.positionAt(context.end),
        );
        return new vscode.CompletionList(
          state.items.map((item) => {
            const completion = new vscode.CompletionItem(
              item.label,
              vscode.CompletionItemKind.File,
            );
            completion.range = range;
            completion.detail = vscode.workspace.asRelativePath(
              item.uri,
              false,
            );
            return completion;
          }),
        );
      },
    },
    '"',
    "'",
  );
  context.subscriptions.push(provider);
  for (const folder of vscode.workspace.workspaceFolders || [])
    createState(folder);
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration(`${namespace}.ideTwigConfigPath`)) return;
      for (const state of folders.values()) state.reload();
    }),
    vscode.workspace.onDidChangeWorkspaceFolders((event) => {
      for (const folder of event.removed) {
        const key = folder.uri.toString();
        folders.get(key)?.dispose();
        folders.delete(key);
      }
      for (const folder of event.added) createState(folder);
    }),
    {
      dispose() {
        for (const state of folders.values()) state.dispose();
        folders.clear();
      },
    },
  );
}

module.exports = {
  templateReferences,
  templateCandidates,
  registerTemplates,
  configEntries,
  templateReference,
  templateStringContext,
  registerTemplateCompletions,
};
