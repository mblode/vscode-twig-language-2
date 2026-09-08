const vscode = require("vscode");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
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
  assert(await saving.save());
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
  console.log(
    "VS Code integration: activation, document/range/save formatting, live settings, indentation, ignore, errors, CRLF and hover passed.",
  );
};
