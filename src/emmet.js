"use strict";
const {
  TokenType: T,
  ScannerState: S,
} = require("vscode-html-languageservice");
const { project, service } = require("./html");
// Script types whose body is markup, as in VS Code's built-in Emmet.
const TEMPLATES = [
  "text/html",
  "text/plain",
  "text/x-template",
  "text/template",
  "text/ng-template",
];
const CLOSERS = { "{": "}}", "%": "%}", "#": "#}" };
// Emmet syntax at an offset: "html" in markup text, "css" in <style> bodies and
// style="" values, undefined inside Twig delimiters, tags, other attributes,
// comments and scripts. The projection blanks Twig so HTML scanning sees markup only.
function emmetSyntax(source, offset, projection = project(source)) {
  for (const [start, end] of projection.ranges) {
    if (start >= offset) break;
    const raw = source.slice(start, end);
    const closed = raw.length >= 4 && raw.endsWith(CLOSERS[raw[1]] || "%}");
    if (offset < end || !closed) return;
  }
  const scanner = service.createScanner(projection.text);
  let tag, attribute, scriptType, previous;
  for (let token = scanner.scan(); token !== T.EOS; token = scanner.scan()) {
    const start = scanner.getTokenOffset();
    if (start >= offset) break;
    const end = scanner.getTokenEnd();
    const text = scanner.getTokenText();
    if (token === T.StartTag) {
      tag = text.toLowerCase();
      attribute = scriptType = undefined;
    } else if (token === T.AttributeName) attribute = text.toLowerCase();
    else if (
      token === T.AttributeValue &&
      tag === "script" &&
      attribute === "type"
    )
      scriptType = text
        .replace(/^["']|["']$/g, "")
        .trim()
        .toLowerCase();
    previous = { token, end, text, state: scanner.getScannerState() };
  }
  if (!previous) return "html";
  const { token, end, text, state } = previous;
  const script = () =>
    scriptType && TEMPLATES.includes(scriptType) ? "html" : undefined;
  switch (token) {
    case T.Content:
      return "html";
    case T.Styles:
      return "css";
    case T.Script:
      return script();
    case T.Comment:
      return;
    case T.AttributeValue: {
      if (attribute !== "style" || !/^["']/.test(text)) return;
      const closed = text.length > 1 && text.endsWith(text[0]);
      return offset < end || !closed ? "css" : undefined;
    }
  }
  if (offset < end) return;
  if (state === S.WithinContent) return "html";
  if (state === S.WithinStyleContent) return "css";
  if (state === S.WithinScriptContent) return script();
}
// VS Code's built-in Emmet only serves "twig" through emmet.includeLanguages, and then treats
// Twig tags as HTML text. Returns the setting levels that still carry a twig mapping.
function twigMappings(vscode) {
  const levels = [];
  const add = (config, key, target) => {
    const value = config.inspect("includeLanguages")?.[key];
    if (value && typeof value === "object" && "twig" in value)
      levels.push({ config, value, target });
  };
  if (vscode.workspace.workspaceFile)
    for (const folder of vscode.workspace.workspaceFolders || [])
      add(
        vscode.workspace.getConfiguration("emmet", folder.uri),
        "workspaceFolderValue",
        vscode.ConfigurationTarget.WorkspaceFolder,
      );
  const config = vscode.workspace.getConfiguration("emmet");
  add(config, "workspaceValue", vscode.ConfigurationTarget.Workspace);
  add(config, "globalValue", vscode.ConfigurationTarget.Global);
  return levels;
}
async function removeTwigMapping(vscode) {
  for (const { config, value, target } of twigMappings(vscode)) {
    const { twig, ...rest } = value;
    await config.update(
      "includeLanguages",
      Object.keys(rest).length ? rest : undefined,
      target,
    );
  }
}
const DISMISSED = "emmetIncludeLanguagesDismissed";
let offering = false;
async function offerMappingRemoval(vscode, context) {
  if (
    offering ||
    context.globalState.get(DISMISSED) ||
    !twigMappings(vscode).length
  )
    return;
  offering = true;
  const remove = "Remove Twig Mapping";
  const never = "Don't Show Again";
  const choice = await vscode.window.showInformationMessage(
    'Twig Language 2 now provides Emmet in Twig files. The "twig" entry in "emmet.includeLanguages" also turns on VS Code\'s Emmet, which expands text inside Twig tags such as {% if event.show_thumb %}. Remove the entry? Emmet commands such as Wrap with Abbreviation need it.',
    remove,
    never,
  );
  offering = false;
  if (choice === remove) await removeTwigMapping(vscode);
  if (choice) await context.globalState.update(DISMISSED, true);
}
function registerEmmet(vscode, context) {
  const helper = require("@vscode/emmet-helper");
  const { TextDocument } = require("vscode-languageserver-textdocument");
  const provider = {
    provideCompletionItems(document, position, token) {
      const emmet = vscode.workspace.getConfiguration("emmet", document);
      if (
        token.isCancellationRequested ||
        emmet.get("showExpandedAbbreviation") === "never" ||
        (emmet.get("excludeLanguages") || []).includes(document.languageId)
      )
        return;
      const source = document.getText();
      const projection = project(source);
      const syntax = emmetSyntax(
        source,
        document.offsetAt(position),
        projection,
      );
      if (!syntax) return;
      // Abbreviations are read from the projection, so they cannot start inside a Twig tag.
      const virtual = TextDocument.create(
        document.uri.toString(),
        "html",
        document.version,
        projection.text,
      );
      const result = helper.doComplete(virtual, position, syntax, {
        showExpandedAbbreviation: emmet.get("showExpandedAbbreviation"),
        showAbbreviationSuggestions: emmet.get("showAbbreviationSuggestions"),
        showSuggestionsAsSnippets: emmet.get("showSuggestionsAsSnippets"),
        syntaxProfiles: { ...(emmet.get("syntaxProfiles") || {}) },
        variables: emmet.get("variables"),
        preferences: { ...(emmet.get("preferences") || {}) },
        excludeLanguages: emmet.get("excludeLanguages"),
      });
      if (!result?.items?.length) return;
      const snippets = emmet.get("showSuggestionsAsSnippets") === true;
      return new vscode.CompletionList(
        result.items
          .filter((item) => item.textEdit)
          .map((item) => {
            const completion = new vscode.CompletionItem(item.label);
            const { range, newText } = item.textEdit;
            completion.insertText = new vscode.SnippetString(newText);
            completion.range = new vscode.Range(
              range.start.line,
              range.start.character,
              range.end.line,
              range.end.character,
            );
            completion.documentation = item.documentation;
            completion.detail = item.detail;
            completion.filterText = item.filterText;
            completion.sortText = item.sortText;
            if (snippets) completion.kind = vscode.CompletionItemKind.Snippet;
            return completion;
          }),
        true,
      );
    },
  };
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      "twig",
      provider,
      ..."!.}:*$]/>0123456789",
    ),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("emmet.includeLanguages"))
        void offerMappingRemoval(vscode, context);
    }),
  );
  void offerMappingRemoval(vscode, context);
}
module.exports = {
  emmetSyntax,
  twigMappings,
  removeTwigMapping,
  registerEmmet,
};
