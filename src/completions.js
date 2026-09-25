"use strict";
const snippets = require("./snippets/snippets.json");
const KINDS = {
  customTests: "test",
  customFilters: "filter",
  customFunctions: "function",
};
// Only Twig string quotes change; HTML attribute quotes around Twig output stay double.
const swap = (text) => text.replace(/"([^"']*)"/g, "'$1'");
const singleQuotes = (text) =>
  /\{[{%]/.test(text)
    ? text.replace(/\{[{%][\s\S]*?[%}]\}/g, swap)
    : swap(text);
const cache = new Map();
function snippetList(craft = true, quotes = "double") {
  const key = `${craft}|${quotes}`;
  if (!cache.has(key))
    cache.set(
      key,
      Object.values(snippets)
        .filter((s) => craft || !s.craft)
        .map(({ prefix, body, description }) =>
          quotes === "single"
            ? {
                prefix,
                body: singleQuotes(body),
                description: swap(description),
              }
            : { prefix, body, description },
        ),
    );
  return cache.get(key);
}
function customDefinitions(config) {
  return Object.entries(KINDS).flatMap(([setting, kind]) =>
    Object.entries(config.get(setting, {}) || {}).map(
      ([name, description]) => ({
        name,
        kind,
        description: typeof description === "string" ? description : "",
      }),
    ),
  );
}
function preview(body) {
  let text = body.replace(/\$\d+/g, "");
  while (/\$\{\d+:([^{}]*)\}/.test(text))
    text = text.replace(/\$\{\d+:([^{}]*)\}/g, "$1");
  return text;
}
// Cursor is inside an unclosed {{, {% or {# delimiter on the text before it.
function insideTwig(before) {
  const open = Math.max(
    ...["{{", "{%", "{#"].map((d) => before.lastIndexOf(d)),
  );
  return (
    open >= 0 &&
    Math.max(...["}}", "%}", "#}"].map((d) => before.lastIndexOf(d))) < open
  );
}
function registerCompletions(vscode, context, language, configFor) {
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(language, {
      provideCompletionItems(document, position) {
        const config = configFor(document);
        const items = snippetList(
          config.get("craftSnippets", true),
          config.get("snippetQuotes", "double"),
        ).map(({ prefix, body, description }) => {
          const item = new vscode.CompletionItem(
            { label: prefix, description },
            vscode.CompletionItemKind.Snippet,
          );
          item.insertText = new vscode.SnippetString(body);
          item.documentation = new vscode.MarkdownString().appendCodeblock(
            preview(body),
            "twig",
          );
          return item;
        });
        const before = document.getText(
          new vscode.Range(
            document.positionAt(
              Math.max(0, document.offsetAt(position) - 4000),
            ),
            position,
          ),
        );
        if (insideTwig(before))
          for (const { name, kind, description } of customDefinitions(config)) {
            const item = new vscode.CompletionItem(
              { label: name, description: `custom ${kind}` },
              vscode.CompletionItemKind.Function,
            );
            item.documentation = new vscode.MarkdownString(description);
            items.push(item);
          }
        return items;
      },
    }),
  );
}
module.exports = {
  snippetList,
  customDefinitions,
  insideTwig,
  registerCompletions,
};
