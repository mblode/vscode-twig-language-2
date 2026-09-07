"use strict";
const { getLanguageService } = require("vscode-html-languageservice");
const { TextDocument } = require("vscode-languageserver-textdocument");
const { twigStart, twigEnd } = require("./formatter/lexer");
const service = getLanguageService();
// Keep UTF-16 offsets and line endings identical to the source, including while typing.
function project(source) {
  const ranges = [];
  let text = "",
    last = 0;
  for (let i = 0; i < source.length; i++) {
    if (!twigStart(source, i)) continue;
    let end;
    try {
      end = twigEnd(source, i);
    } catch {
      end = source.length;
    }
    const raw = source.slice(i, end);
    const literal = /^\{%[-~]?\s*(verbatim|raw)\b/.exec(raw);
    if (literal) {
      const close = new RegExp(
        "\\{%[-~]?\\s*end" + literal[1] + "\\s*[-~]?%\\}",
        "g",
      );
      close.lastIndex = end;
      end = close.exec(source) ? close.lastIndex : source.length;
    }
    text +=
      source.slice(last, i) + source.slice(i, end).replace(/[^\r\n]/g, " ");
    ranges.push([i, end]);
    last = end;
    i = end - 1;
  }
  return { text: text + source.slice(last), ranges };
}
function htmlDocument(document, position) {
  const source = document.getText();
  const projection = project(source);
  if (
    position &&
    projection.ranges.some(
      ([a, b]) =>
        document.offsetAt(position) >= a && document.offsetAt(position) < b,
    )
  )
    return;
  const virtual = TextDocument.create(
    document.uri.toString(),
    "html",
    document.version,
    projection.text,
  );
  return { virtual, parsed: service.parseHTMLDocument(virtual) };
}
function registerHTML(vscode, context) {
  const range = (r) =>
    new vscode.Range(
      r.start.line,
      r.start.character,
      r.end.line,
      r.end.character,
    );
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      "twig",
      {
        provideCompletionItems(document, position, token) {
          if (token.isCancellationRequested) return;
          const html = htmlDocument(document, position);
          if (!html) return;
          const result = service.doComplete(
            html.virtual,
            position,
            html.parsed,
          );
          return new vscode.CompletionList(
            result.items.map((item) => {
              const completion = new vscode.CompletionItem(
                item.label,
                item.kind === undefined ? undefined : item.kind - 1,
              );
              const text =
                item.textEdit?.newText ?? item.insertText ?? item.label;
              completion.insertText =
                item.insertTextFormat === 2
                  ? new vscode.SnippetString(text)
                  : text;
              if (item.textEdit?.range)
                completion.range = range(item.textEdit.range);
              completion.filterText = item.filterText;
              completion.sortText = item.sortText;
              completion.detail = item.detail;
              if (item.documentation)
                completion.documentation = new vscode.MarkdownString(
                  typeof item.documentation === "string"
                    ? item.documentation
                    : item.documentation.value,
                );
              return completion;
            }),
            result.isIncomplete,
          );
        },
      },
      "<",
      "/",
      " ",
      "=",
      '"',
      "'",
    ),
  );
  context.subscriptions.push(
    vscode.languages.registerHoverProvider("twig", {
      provideHover(document, position) {
        const html = htmlDocument(document, position);
        if (!html) return;
        const hover = service.doHover(html.virtual, position, html.parsed);
        if (hover && !Array.isArray(hover.contents))
          return new vscode.Hover(
            new vscode.MarkdownString(
              typeof hover.contents === "string"
                ? hover.contents
                : hover.contents.value,
            ),
            hover.range && range(hover.range),
          );
      },
    }),
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const document = event.document;
      if (document.languageId !== "twig" || event.contentChanges.length !== 1)
        return;
      const change = event.contentChanges[0];
      if (change.rangeLength || ![">", "/"].includes(change.text)) return;
      const editor = vscode.window.activeTextEditor;
      if (
        !editor ||
        editor.document !== document ||
        editor.selections.length !== 1
      )
        return;
      if (
        !vscode.workspace
          .getConfiguration("html", document)
          .get("autoClosingTags", true)
      )
        return;
      const position = document.positionAt(change.rangeOffset + 1);
      const html = htmlDocument(document, position);
      if (!html) return;
      const completion = service.doTagComplete(
        html.virtual,
        position,
        html.parsed,
      );
      if (!completion) return;
      const version = document.version;
      // Cursor movement follows the document event. Recheck the live editor before inserting.
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (
          document.version === version &&
          !document.isClosed &&
          vscode.window.activeTextEditor === editor &&
          editor.selection.isEmpty &&
          editor.selection.active.isEqual(position)
        ) {
          void editor.insertSnippet(
            new vscode.SnippetString(completion),
            position,
            { undoStopBefore: false, undoStopAfter: false },
          );
        }
      }, 0);
      timers.add(timer);
      timer.unref?.();
    }),
  );
  const timers = new Set();
  context.subscriptions.push({
    dispose() {
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
    },
  });
}
module.exports = { registerHTML, project, htmlDocument, service };
