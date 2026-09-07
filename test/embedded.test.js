const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const { format } = require("../src/formatter/format");
test("formatted embedded JavaScript preserves executable string and function values", async () => {
  const body =
    'function double(x){return x*2;}globalThis.result = [double(3), `one\n  two\nthree`, "first\\\nsecond", "a    b"];';
  const formatted = await format(
    "<div>\n<script>" + body + "</script>\n</div>",
    { tabSize: 2 },
  );
  const output = formatted.slice(
    formatted.indexOf("<script>") + 8,
    formatted.indexOf("</script>"),
  );
  const before = {},
    after = {};
  vm.runInNewContext(body, before);
  vm.runInNewContext(output, after);
  assert.equal(JSON.stringify(after.result), JSON.stringify(before.result));
});
test("CSS escaped line continuations do not acquire literal indentation", async () => {
  const literal = '"first\\\nsecond"';
  const result = await format(
    "<div>\n<style>.a{content:" + literal + ";}</style>\n</div>",
    { tabSize: 2 },
  );
  assert(result.includes(literal));
  assert.equal(await format(result, { tabSize: 2 }), result);
});
