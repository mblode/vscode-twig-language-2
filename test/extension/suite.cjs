const vscode = require("vscode");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const manifest = require("../../package.json");
exports.run = async () => {
  const extension = vscode.extensions.getExtension("mblode.twig-language-2");
  assert(extension, "extension must be installed");
  await extension.activate();
  assert(extension.isActive);
  const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
  async function open(name, source) {
    const file = path.join(root, name);
    await fs.writeFile(file, source);
    const doc = await vscode.workspace.openTextDocument(file);
    await vscode.window.showTextDocument(doc);
    assert.equal(doc.languageId, "twig");
    return doc;
  }
  const config = vscode.workspace.getConfiguration("twig-language-2");
  const update = (key, value) =>
    config.update(key, value, vscode.ConfigurationTarget.Workspace);
  const options = { tabSize: 2, insertSpaces: true };
  const edits = async (doc, opts = options) =>
    (await vscode.commands.executeCommand(
      "vscode.executeFormatDocumentProvider",
      doc.uri,
      opts,
    )) || [];
  const apply = async (doc, changes) => {
    const edit = new vscode.WorkspaceEdit();
    edit.set(doc.uri, changes);
    assert(await vscode.workspace.applyEdit(edit));
  };
  const source = "<div>\n{% if x %}\n<span>{{x}}</span>\n{% endif %}\n</div>\n";
  const doc = await open("document.twig", source);
  await apply(doc, await edits(doc));
  assert.equal(
    doc.getText(),
    "<div>\n  {% if x %}\n    <span>{{ x }}</span>\n  {% endif %}\n</div>\n",
  );
  assert.deepEqual(
    await edits(doc),
    [],
    "unchanged document must not receive replacements",
  );
  await update("indentStyle", "tab");
  await apply(doc, await edits(doc));
  assert(
    doc.getText().includes("\n\t\t<span>"),
    "settings changes must work without reload",
  );
  await update("formatting", false);
  assert.deepEqual(await edits(doc), []);
  await update("formatting", true);
  await update("indentStyle", "editor");
  await apply(doc, await edits(doc, { tabSize: 3, insertSpaces: true }));
  assert(
    doc.getText().includes("\n      <span>"),
    "current document options must win",
  );
  await vscode.workspace
    .getConfiguration()
    .update(
      "[twig]",
      { "twig-language-2.tabSize": 4 },
      vscode.ConfigurationTarget.Workspace,
    );
  await apply(doc, await edits(doc));
  assert(
    doc.getText().includes("\n        <span>"),
    "language-scoped overrides must apply to the document",
  );
  await vscode.workspace
    .getConfiguration()
    .update("[twig]", undefined, vscode.ConfigurationTarget.Workspace);
  await update("ignore", ["**/document.twig"]);
  assert.deepEqual(await edits(doc), []);
  await update("ignore", []);
  const selected = await open("selection.twig", source);
  const range = new vscode.Range(2, 0, 3, 0);
  const selection = await vscode.commands.executeCommand(
    "vscode.executeFormatRangeProvider",
    selected.uri,
    range,
    options,
  );
  assert(selection.length);
  assert(
    selection.every((e) => e.range.start.line === 2 && e.range.end.line === 2),
  );
  await apply(selected, selection);
  assert.equal(
    selected.getText(),
    "<div>\n{% if x %}\n    <span>{{ x }}</span>\n{% endif %}\n</div>\n",
  );
  const broken = await open("broken.twig", '<p title="{{ unfinished');
  assert.deepEqual(await edits(broken), []);
  assert.equal(broken.getText(), '<p title="{{ unfinished');
  const malformed = await open(
    "malformed.twig",
    "{% if x %}\n{{a+b}}\n{% endfor %}",
  );
  assert.deepEqual(await edits(malformed), []);
  const customSource = "   {% custom %}\n{{a+b}}\n{% endcustom %}";
  const custom = await open("custom.twig", customSource);
  assert.deepEqual(await edits(custom), []);
  assert.equal(custom.getText(), customSource);
  const crlf = await open("windows.twig", "<script>const x=1;</script>\r\n");
  await apply(crlf, await edits(crlf));
  assert.equal(crlf.eol, vscode.EndOfLine.CRLF);
  assert(!/(?<!\r)\n/.test(crlf.getText()));
  const editorConfig = vscode.workspace.getConfiguration("editor");
  await editorConfig.update(
    "defaultFormatter",
    "mblode.twig-language-2",
    vscode.ConfigurationTarget.Workspace,
  );
  await editorConfig.update(
    "formatOnSave",
    true,
    vscode.ConfigurationTarget.Workspace,
  );
  await editorConfig.update("tabSize", 2, vscode.ConfigurationTarget.Workspace);
  await editorConfig.update(
    "insertSpaces",
    true,
    vscode.ConfigurationTarget.Workspace,
  );
  await editorConfig.update(
    "detectIndentation",
    false,
    vscode.ConfigurationTarget.Workspace,
  );
  const saving = await open("save.twig", "<p>{{value}}</p>");
  await apply(saving, [
    vscode.TextEdit.insert(new vscode.Position(0, 3), "{{other}}"),
  ]);
  // Newer VS Code can apply the formatOnSave update after the first save; re-dirty and retry only that race.
  for (let i = 0; i < 20; i++) {
    if (!saving.isDirty)
      await apply(saving, [
        vscode.TextEdit.insert(saving.positionAt(saving.getText().length), " "),
      ]);
    assert(await saving.save());
    if (
      (await fs.readFile(saving.uri.fsPath, "utf8")) ===
      "<p>{{ other }}{{ value }}</p>\n"
    )
      break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(
    await fs.readFile(saving.uri.fsPath, "utf8"),
    "<p>{{ other }}{{ value }}</p>\n",
    "format on save must write formatted contents",
  );
  const hover = await open("hover.twig", "{{ value|batch(2) }}");
  const hovers = await vscode.commands.executeCommand(
    "vscode.executeHoverProvider",
    hover.uri,
    new vscode.Position(0, 10),
  );
  assert(hovers.length, "hover hints must remain available");
  const htmlCompletion = await open("completion.twig", "{{ value }}\n<div cl");
  const completions = await vscode.commands.executeCommand(
    "vscode.executeCompletionItemProvider",
    htmlCompletion.uri,
    new vscode.Position(1, 7),
  );
  assert(
    completions.items.some((i) => i.label === "class"),
    "HTML attribute completion is available in Twig mode",
  );
  const closing = await open("closing.twig", "<section");
  vscode.window.activeTextEditor.selection = new vscode.Selection(0, 8, 0, 8);
  await vscode.commands.executeCommand("type", { text: ">" });
  const deadline = Date.now() + 2000;
  while (closing.getText() === "<section>" && Date.now() < deadline)
    await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(
    closing.getText(),
    "<section></section>",
    "HTML auto closing works in Twig mode",
  );
  for (const [start, end] of [
    ["{{", "}}"],
    ["{%", "%}"],
    ["{#", "#}"],
  ]) {
    const typed = await open("delimiters.twig", "");
    for (const text of start)
      await vscode.commands.executeCommand("type", { text });
    const expected = `${start}  ${end}`;
    const until = Date.now() + 2000;
    while (typed.getText() !== expected && Date.now() < until)
      await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(
      typed.getText(),
      expected,
      `${start} auto closes padded: ${JSON.stringify(typed.getText())}`,
    );
    await vscode.commands.executeCommand("type", { text: "x" });
    assert.equal(
      typed.getText(),
      `${start} x ${end}`,
      `${start} leaves the cursor inside the padding`,
    );
    await vscode.commands.executeCommand(
      "workbench.action.revertAndCloseActiveEditor",
    );
  }
  const label = (item) =>
    typeof item.label === "string" ? item.label : item.label.label;
  const complete = async (doc, position) =>
    (
      await vscode.commands.executeCommand(
        "vscode.executeCompletionItemProvider",
        doc.uri,
        position,
      )
    ).items;
  const until = async (check) => {
    const deadline = Date.now() + 3000;
    while (!(await check()) && Date.now() < deadline)
      await new Promise((resolve) => setTimeout(resolve, 20));
    return check();
  };
  assert.equal(
    completions.items.find((i) => label(i) === "class").insertText.value,
    'class="$1"',
    "attribute completion inserts quotes",
  );
  const quotes = await open("quotes.twig", "<div class");
  vscode.window.activeTextEditor.selection = new vscode.Selection(0, 10, 0, 10);
  await vscode.commands.executeCommand("type", { text: "=" });
  assert(
    await until(() => quotes.getText() === '<div class=""'),
    `typing = creates attribute quotes: ${quotes.getText()}`,
  );
  await vscode.commands.executeCommand("type", { text: "x" });
  assert.equal(
    quotes.getText(),
    '<div class="x"',
    "cursor is inside the quotes",
  );
  const html = vscode.workspace.getConfiguration("html");
  await html.update(
    "autoCreateQuotes",
    false,
    vscode.ConfigurationTarget.Workspace,
  );
  const unquoted = await open("unquoted.twig", "<div id");
  vscode.window.activeTextEditor.selection = new vscode.Selection(0, 7, 0, 7);
  await vscode.commands.executeCommand("type", { text: "=" });
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(
    unquoted.getText(),
    "<div id=",
    "html.autoCreateQuotes is respected",
  );
  await html.update(
    "autoCreateQuotes",
    undefined,
    vscode.ConfigurationTarget.Workspace,
  );

  const snippetDoc = await open("snippets.twig", "sw");
  const end = new vscode.Position(0, 2);
  const snippet = (items, prefix) =>
    items.find(
      (i) =>
        label(i) === prefix && i.kind === vscode.CompletionItemKind.Snippet,
    );
  assert(
    snippet(await complete(snippetDoc, end), "switch"),
    "Craft snippets are on by default",
  );
  const inc = snippet(await complete(snippetDoc, end), "inc");
  assert.equal(inc.insertText.value, '{% include "${1:template}" %}$0');
  await update("craftSnippets", false);
  const core = await complete(snippetDoc, end);
  assert(!snippet(core, "switch"), "craftSnippets: false hides Craft snippets");
  assert(snippet(core, "if"), "core snippets remain");
  await update("craftSnippets", undefined);
  await update("snippetQuotes", "single");
  assert.equal(
    snippet(await complete(snippetDoc, end), "inc").insertText.value,
    "{% include '${1:template}' %}$0",
  );
  await update("snippetQuotes", undefined);
  await update("customTests", { numeric: "True for numeric values." });
  const customDoc = await open(
    "custom-test.twig",
    "{% if x is numeric %}{% endif %}",
  );
  assert(
    (await complete(customDoc, new vscode.Position(0, 13))).some(
      (i) => label(i) === "numeric",
    ),
    "custom tests complete inside Twig",
  );
  const customHover = await vscode.commands.executeCommand(
    "vscode.executeHoverProvider",
    customDoc.uri,
    new vscode.Position(0, 13),
  );
  assert(
    customHover.some((h) =>
      h.contents.some((c) =>
        (c.value ?? c).includes("True for numeric values."),
      ),
    ),
    "custom tests have hover documentation",
  );
  await update("customTests", undefined);

  await fs.mkdir(path.join(root, "templates/partials"), { recursive: true });
  await fs.writeFile(path.join(root, "templates/base.html.twig"), "");
  await fs.writeFile(path.join(root, "templates/partials/_header.twig"), "");
  await fs.writeFile(path.join(root, "templates/_layout.twig"), "");
  const linked = await open(
    "links.twig",
    '{% extends "base.html.twig" %}\n{% include("partials/_header.twig") %}\n{% include ["missing.twig", "_layout"] %}\n{% embed "@App/_header.twig" %}{% endembed %}\n',
  );
  const definition = async (line, character) =>
    (
      await vscode.commands.executeCommand(
        "vscode.executeDefinitionProvider",
        linked.uri,
        new vscode.Position(line, character),
      )
    ).map((d) => path.relative(root, (d.targetUri ?? d.uri).fsPath));
  assert.deepEqual(
    await definition(0, 14),
    [path.join("templates", "base.html.twig")],
    "go to definition opens extended templates",
  );
  assert.deepEqual(await definition(1, 20), [
    path.join("templates", "partials", "_header.twig"),
  ]);
  assert.deepEqual(
    await definition(2, 30),
    [path.join("templates", "_layout.twig")],
    "array entries resolve individually",
  );
  assert.deepEqual(
    await definition(2, 15),
    [],
    "unresolvable names have no definition",
  );
  assert.deepEqual(
    await definition(0, 3),
    [],
    "tag keywords have no definition",
  );
  assert.deepEqual(await definition(3, 14), []);
  await update("templateNamespaces", { App: "templates/partials" });
  assert.deepEqual(
    await definition(3, 14),
    [path.join("templates", "partials", "_header.twig")],
    "@Namespace names resolve through templateNamespaces",
  );
  await update("templateNamespaces", undefined);
  assert.equal(
    (
      await vscode.commands.executeCommand(
        "vscode.executeLinkProvider",
        linked.uri,
      )
    ).filter((l) => l.target?.scheme === "file").length,
    0,
    "templates open through Go to Definition only, not document links",
  );

  // Without emmet.includeLanguages VS Code's Emmet skips twig; the extension serves it outside Twig tags.
  const text = (item) => item.insertText?.value ?? item.insertText ?? "";
  const prefixes = new Set(
    Object.values(require("../../src/snippets/snippets.json")).map(
      (s) => s.prefix,
    ),
  );
  const emmetItems = async (doc, position) =>
    (await complete(doc, position)).filter((i) => !prefixes.has(label(i)));
  const tag = await open(
    "emmet.twig",
    "<div>{% if event.show_thumb %}{% endif %}</div>",
  );
  const inTag = new vscode.Position(0, 27);
  assert.deepEqual(
    (await emmetItems(tag, inTag)).filter((i) => text(i).startsWith("<")),
    [],
    "no Emmet expansion inside Twig tags",
  );
  const emmetConfig = vscode.workspace.getConfiguration("emmet");
  await emmetConfig.update(
    "includeLanguages",
    { twig: "html", vue: "html" },
    vscode.ConfigurationTarget.Workspace,
  );
  assert(
    await until(async () =>
      (await emmetItems(tag, inTag)).some((i) => text(i).startsWith("<event")),
    ),
    "the includeLanguages mapping makes VS Code's Emmet expand inside Twig tags",
  );
  await require("../../src/emmet").removeTwigMapping(vscode);
  assert.deepEqual(
    emmetConfig.inspect("includeLanguages").workspaceValue,
    { vue: "html" },
    "only the twig mapping is removed",
  );
  await emmetConfig.update(
    "includeLanguages",
    undefined,
    vscode.ConfigurationTarget.Workspace,
  );
  const abbreviation = await open("abbreviation.twig", "{{ x }}\ndiv.foo");
  const expansions = (await emmetItems(abbreviation, new vscode.Position(1, 7)))
    .map(text)
    .filter((t) => t.startsWith("<"));
  assert(
    expansions.some((t) => t.startsWith('<div class="foo">')),
    `Emmet expands HTML text: ${JSON.stringify(expansions)}`,
  );
  assert.equal(expansions.length, 1, "one Emmet provider answers");
  const styled = await open("style.twig", "<style>\n  a { m10 }\n</style>");
  assert(
    (await emmetItems(styled, new vscode.Position(1, 9))).some((i) =>
      text(i).startsWith("margin: 10px"),
    ),
    "Emmet uses CSS abbreviations inside style elements",
  );
  await emmetConfig.update(
    "showExpandedAbbreviation",
    "never",
    vscode.ConfigurationTarget.Workspace,
  );
  assert(
    !(await emmetItems(abbreviation, new vscode.Position(1, 7))).some((i) =>
      text(i).startsWith("<div"),
    ),
    "emmet.showExpandedAbbreviation: never is respected",
  );
  await emmetConfig.update(
    "showExpandedAbbreviation",
    undefined,
    vscode.ConfigurationTarget.Workspace,
  );
  await emmetConfig.update(
    "excludeLanguages",
    ["twig"],
    vscode.ConfigurationTarget.Workspace,
  );
  assert(
    !(await emmetItems(abbreviation, new vscode.Position(1, 7))).some((i) =>
      text(i).startsWith("<div"),
    ),
    "emmet.excludeLanguages is respected",
  );
  await emmetConfig.update(
    "excludeLanguages",
    undefined,
    vscode.ConfigurationTarget.Workspace,
  );
  assert.equal(
    manifest.contributes.keybindings,
    undefined,
    "Tab keeps its default behavior",
  );
  console.log(
    "VS Code integration: activation, document/range/save formatting, live settings, indentation, ignore, errors, CRLF, hover, auto quotes, snippet settings, custom definitions, go to template and Emmet outside Twig tags passed.",
  );
};
