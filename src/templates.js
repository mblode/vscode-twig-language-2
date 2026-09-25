"use strict";
const { twigStart, twigEnd } = require("./formatter/lexer");
const TAG = /^\{%[-~]?\s*(include|extends|embed|import|from|use)\b/;
const CALL = /(?<![\w.$])(?:include|source)\s*\(/g;
const TOKEN =
  /(["'])((?:\\[\s\S]|(?!\1)[^\\])*)\1|([[({])|([\])}])|(,)|\b(with|only|ignore|import|as)\b/g;
// Template names are the string literals of a tag's first expression or a call's first argument.
function names(raw, from, call, offset, found) {
  const stack = [];
  TOKEN.lastIndex = from;
  for (let m; (m = TOKEN.exec(raw));) {
    if (m[1]) {
      // Concatenated and interpolated names are dynamic.
      if (
        !stack.includes("{") &&
        m[2] &&
        !/[\\\n]|#\{/.test(m[2]) &&
        !/~\s*$/.test(raw.slice(0, m.index)) &&
        !/^\s*~/.test(raw.slice(TOKEN.lastIndex))
      )
        found.set(offset + m.index + 1, {
          start: offset + m.index + 1,
          end: offset + m.index + 1 + m[2].length,
          name: m[2],
        });
    } else if (m[3]) stack.push(m[3]);
    else if (m[4]) {
      if (!stack.length) return;
      stack.pop();
    } else if (!stack.length && (m[5] ? call : !call)) return;
  }
}
function templateReferences(source) {
  const found = new Map();
  for (let i = 0; i < source.length; i++) {
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
    if (/^\{%[-~]?\s*verbatim\b/.test(raw)) {
      const close = /\{%[-~]?\s*endverbatim\s*[-~]?%\}/g;
      close.lastIndex = end;
      end = close.exec(source) ? close.lastIndex : source.length;
    } else if (raw[1] !== "#") {
      const tag = TAG.exec(raw);
      if (tag) names(raw, tag[0].length, false, i, found);
      for (const call of raw.matchAll(CALL))
        names(raw, call.index + call[0].length, true, i, found);
    }
    i = end - 1;
  }
  return [...found.values()];
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
module.exports = { templateReferences, templateCandidates, registerTemplates };
