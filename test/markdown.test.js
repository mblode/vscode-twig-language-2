const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const tm = require("vscode-textmate");
const onig = require("vscode-oniguruma");
const manifest = require("../package.json");
let grammar;
test.before(async () => {
  const wasm = fs.readFileSync(
    require.resolve("vscode-oniguruma/release/onig.wasm"),
  );
  await onig.loadWASM(
    wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength),
  );
  const files = {
    "text.html.markdown": "test/grammars/markdown.tmLanguage.json",
    "source.js": "test/grammars/JavaScript.tmLanguage.json",
    ...Object.fromEntries(
      manifest.contributes.grammars.map((g) => [g.scopeName, g.path]),
    ),
  };
  const registry = new tm.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (p) => new onig.OnigScanner(p),
      createOnigString: (s) => new onig.OnigString(s),
    }),
    getInjections: (scope) =>
      manifest.contributes.grammars
        .filter((g) => g.injectTo?.includes(scope))
        .map((g) => g.scopeName),
    loadGrammar: async (scope) =>
      files[scope]
        ? tm.parseRawGrammar(
            fs.readFileSync(
              path.resolve(__dirname, "..", files[scope]),
              "utf8",
            ),
            files[scope],
          )
        : null,
  });
  grammar = await registry.loadGrammar("text.html.markdown");
});
function tokens(source) {
  let state = tm.INITIAL;
  return source.split("\n").map((line) => {
    const result = grammar.tokenizeLine(line, state);
    state = result.ruleStack;
    return result.tokens.map((t) => ({
      text: line.slice(t.startIndex, t.endIndex),
      scopes: t.scopes,
    }));
  });
}
function has(line, text, scope) {
  assert(
    line.some((t) => t.text === text && t.scopes.includes(scope)),
    JSON.stringify(line),
  );
}
function noTwig(line) {
  assert(
    !line.some((t) => t.scopes.some((s) => s.endsWith(".twig"))),
    JSON.stringify(line),
  );
}
for (const fence of ["```", "~~~~", "  ```"]) {
  test(`Twig expressions, tags, comments and HTML in Markdown ${fence}`, () => {
    const result = tokens(
      [
        fence + "twig",
        "{% if user %}",
        "<p>{{ user|default('Guest') }}</p>",
        "{# comment #}",
        "{% endif %}",
        fence,
        "# After",
      ].join("\n"),
    );
    has(result[1], "if", "keyword.control.twig");
    has(result[2], "default", "support.function.twig");
    has(result[2], "p", "entity.name.tag.block.any.html");
    assert(result[3].some((t) => t.scopes.includes("comment.block.twig")));
    noTwig(result[0]);
    noTwig(result[5]);
    noTwig(result[6]);
    assert(result[6].some((t) => t.scopes.includes("markup.heading.markdown")));
  });
}
for (const body of [
  '{{ "unfinished',
  "{# unfinished",
  "<script>/* unfinished",
]) {
  test(`closing fence exits incomplete embedded syntax: ${body}`, () => {
    const result = tokens(["```twig", body, "```", "# After"].join("\n"));
    noTwig(result[2]);
    noTwig(result[3]);
    assert(result[3].some((t) => t.scopes.includes("markup.heading.markdown")));
  });
}
test("shorter and mismatched fences stay inside Twig; a longer fence closes it", () => {
  const result = tokens(
    ["````twig", "```", "~~~", "{{ user|default }}", "`````", "# After"].join(
      "\n",
    ),
  );
  has(result[3], "default", "support.function.twig");
  noTwig(result[4]);
  noTwig(result[5]);
  assert(result[5].some((t) => t.scopes.includes("markup.heading.markdown")));
});
for (const language of ["", "text", "javascript", "twiggy"]) {
  test(`does not inject into ${language || "unlabelled"} fences`, () => {
    tokens(
      [
        "```" + language,
        "{{ user|default }}",
        "```twig",
        "{% if user %}",
        "```",
        "plain {{ user }}",
      ].join("\n"),
    )
      .flat()
      .forEach((t) => noTwig([t]));
  });
}
test("preserves JavaScript highlighting in adjacent fences", () => {
  const result = tokens(
    "```twig\n{{ user|default }}\n```\n\n```javascript\nconst value = 1;\n```\n",
  );
  has(result[1], "default", "support.function.twig");
  has(result[5], "const", "storage.type.js");
  noTwig(result[5]);
});
test("shorter and mismatched fences preserve multiline Twig comments", () => {
  const result = tokens(
    "````twig\n{# comment\n```\n~~~\nstill comment\n#}\n````\n# After",
  );
  assert(
    result[4].every((t) => t.scopes.includes("comment.block.twig")),
    JSON.stringify(result[4]),
  );
  noTwig(result[6]);
  noTwig(result[7]);
});
for (const info of ["TWIG", "twig title=example", "twig{.example}"]) {
  test(`Markdown info string ${info}`, () => {
    const result = tokens("```" + info + "\n{{ name|default }}\n```");
    has(result[1], "default", "support.function.twig");
  });
}
test("plain Markdown and inline code remain Markdown", () => {
  tokens("plain {{ name }}\n`{{ name }}`\n``twig {{ name }}``").forEach(noTwig);
});
for (const prefix of ["> ", "  "]) {
  test(`Twig fences inside Markdown containers ${JSON.stringify(prefix)}`, () => {
    const result = tokens(
      (prefix === "  " ? "- Example\n\n" : "") +
        ["```twig", "{{ name|default }}", "```", "", "# After"]
          .map((line) => prefix + line)
          .join("\n"),
    );
    const body = result.find((line) => line.some((t) => t.text === "default"));
    assert(body, JSON.stringify(result));
    has(body, "default", "support.function.twig");
    noTwig(result.at(-1));
  });
}
test("indented Markdown code does not become a Twig fence", () => {
  tokens("    ```twig\n    {{ name|default }}\n    ```\n\n# After").forEach(
    noTwig,
  );
});
