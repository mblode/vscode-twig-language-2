const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const tm = require("vscode-textmate");
const onig = require("vscode-oniguruma");
const { project, htmlDocument, service } = require("../src/html");
const { TextDocument } = require("vscode-languageserver-textdocument");
const root = path.resolve(__dirname, "..");
let grammar;
test.before(async () => {
  const wasm = fs.readFileSync(
    require.resolve("vscode-oniguruma/release/onig.wasm"),
  );
  await onig.loadWASM(
    wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength),
  );
  const files = {
    "text.html.twig": "src/syntaxes/twig.tmLanguage",
    "source.css": "test/grammars/css.tmLanguage.json",
    "source.js": "test/grammars/JavaScript.tmLanguage.json",
    "source.css.scss": "test/grammars/scss.tmLanguage.json",
  };
  const registry = new tm.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (p) => new onig.OnigScanner(p),
      createOnigString: (s) => new onig.OnigString(s),
    }),
    loadGrammar: async (scope) =>
      files[scope]
        ? tm.parseRawGrammar(
            fs.readFileSync(path.join(root, files[scope]), "utf8"),
            files[scope],
          )
        : null,
  });
  grammar = await registry.loadGrammar("text.html.twig");
});
function tokens(source) {
  let state = tm.INITIAL;
  return source.split("\n").flatMap((line) => {
    const result = grammar.tokenizeLine(line, state);
    state = result.ruleStack;
    return result.tokens.map((token) => ({
      text: line.slice(token.startIndex, token.endIndex),
      scopes: token.scopes,
    }));
  });
}
for (const [name, source, word, scope] of [
  [
    "Twig 2 #116 CSS expressions do not corrupt following JavaScript",
    "<style>\na { color: {{ color }}; }\n</style>\n<script>\nfunction example() { return 1; }\n</script>\n<p>AFTER</p>",
    "return",
    "keyword.control.flow.js",
  ],
  [
    "Twig 2 #44 inline endjs closes embedded scope",
    "{% js %} let x=1; {% endjs %}\n<p>AFTER</p>",
    "let",
    "storage.type.js",
  ],
  [
    "Twig 1 #56 compact endcss closes embedded scope",
    "{%css%}a{color:red}{%endcss%}\n<p>AFTER</p>",
    "color",
    "support.type.property-name.css",
  ],
  [
    "SCSS trim controls close embedded scope",
    "{%~ scss ~%}\na { color: red; }\n{%~ endscss ~%}\n<p>AFTER</p>",
    "color",
    "support.type.property-name.css",
  ],
  [
    "Twig 1 #26 custom elements retain full name",
    "<m-load path=true>AFTER</m-load>",
    "m-load",
    "entity.name.tag.other.html",
  ],
  [
    "Twig 1 #24 elvis operator without spaces",
    "{{ x?:y }}\n<p>AFTER</p>",
    "?:",
    "keyword.operator.twig",
  ],
  [
    "Twig 2 #19 default filter without arguments",
    "{{ x|default }}\n<p>AFTER</p>",
    "default",
    "support.function.twig",
  ],
  [
    "Twig 2 #45 include function",
    '{{ include("file.twig") }}\n<p>AFTER</p>',
    "include",
    "support.function.twig",
  ],
  [
    "Twig 2 #53 escaped quotes stay within string",
    String.raw`{{ __( 'doesn\'t exist', 'domain' ) }}\n<p>AFTER</p>`,
    "t exist",
    "string.quoted.single.twig",
  ],
  [
    "verbatim protects template-like literals",
    "{% verbatim %}{{ fake }}{% endverbatim %}\n<p>AFTER</p>",
    "{{ fake }}",
    "string.unquoted.verbatim.twig",
  ],
])
  test(name, () => {
    const result = tokens(source);
    assert(
      result.some((t) => t.text === word && t.scopes.includes(scope)),
      JSON.stringify(result),
    );
    const after = result.find((t) => t.text.includes("AFTER"));
    assert(
      after &&
        !after.scopes.some((s) => /source\.(css|js)|string\.|template/.test(s)),
      JSON.stringify(after),
    );
  });
test("HTML projection preserves UTF-16 offsets, CRLF, strings and incomplete expressions", () => {
  for (const source of [
    '😀{{ "}}" }}\r\n<div cl',
    "{% verbatim %}<not-html>{{x}}{% endverbatim %}<div cl",
    "<div {{ unfinished",
  ]) {
    const result = project(source);
    assert.equal(result.text.length, source.length);
    assert.deepEqual(
      [...result.text.matchAll(/\r?\n/g)].map((m) => m.index),
      [...source.matchAll(/\r?\n/g)].map((m) => m.index),
    );
    for (const [a, b] of result.ranges)
      assert(!/\S/.test(result.text.slice(a, b)));
  }
});
test("HTML completions retain source ranges after Twig expressions", () => {
  const source = '{{ "<fake>" }}\n<div cl';
  const d = TextDocument.create("test:///file.twig", "twig", 1, source);
  const document = {
    uri: { toString: () => d.uri },
    version: 1,
    getText: () => source,
    offsetAt: (p) => d.offsetAt(p),
  };
  const position = d.positionAt(source.length);
  const html = htmlDocument(document, position);
  const item = service
    .doComplete(html.virtual, position, html.parsed)
    .items.find((i) => i.label === "class");
  assert(item);
  assert.equal(item.textEdit.range.start.line, 1);
  assert.equal(item.textEdit.range.start.character, 5);
  assert.equal(htmlDocument(document, { line: 0, character: 5 }), undefined);
});

test("closing tags wait for the cursor event and reject superseded changes", () => {
  const { registerHTML } = require("../src/html");
  let change,
    selection,
    inserted = [];
  const d = TextDocument.create("file:///test.twig", "twig", 1, "<section>");
  const document = {
    uri: { toString: () => d.uri },
    languageId: "twig",
    version: 1,
    getText: () => d.getText(),
    offsetAt: (p) => d.offsetAt(p),
    positionAt: (o) => d.positionAt(o),
  };
  const editor = {
    document,
    selections: [{}],
    selection: { isEmpty: true, active: { isEqual: () => false } },
    insertSnippet: (s) => inserted.push(s.value),
  };
  const disposable = { dispose() {} };
  const vscode = {
    languages: {
      registerCompletionItemProvider: () => disposable,
      registerHoverProvider: () => disposable,
    },
    window: {
      activeTextEditor: editor,
      onDidChangeTextEditorSelection: (fn) => {
        selection = fn;
        return disposable;
      },
    },
    workspace: {
      getConfiguration: () => ({ get: () => true }),
      onDidChangeTextDocument: (fn) => {
        change = fn;
        return disposable;
      },
    },
    SnippetString: class {
      constructor(value) {
        this.value = value;
      }
    },
  };
  const context = { subscriptions: [] };
  registerHTML(vscode, context);
  change({
    document,
    contentChanges: [{ rangeLength: 0, rangeOffset: 8, text: ">" }],
  });
  assert.deepEqual(inserted, []);
  change({ document, contentChanges: [] });
  editor.selection.active.isEqual = (p) => p.character === 9;
  selection({ textEditor: editor });
  assert.equal(inserted.length, 1);
  assert(inserted[0].includes("</section>"));
  editor.selection.active.isEqual = () => false;
  change({
    document,
    contentChanges: [{ rangeLength: 0, rangeOffset: 8, text: ">" }],
  });
  document.version++;
  editor.selection.active.isEqual = () => true;
  selection({ textEditor: editor });
  assert.equal(inserted.length, 1);
  context.subscriptions.forEach((s) => s.dispose());
});
