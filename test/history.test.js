"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { format } = require("../src/formatter/format");
const { preservationKey } = require("../src/formatter/preservation");
const fixtures = require("./fixtures/history.json");
for (const fixture of fixtures)
  test(`history: ${fixture.url} (${fixture.id})`, async () => {
    if (fixture.reject)
      return assert.rejects(format(fixture.source), new RegExp(fixture.reject));
    for (const insertSpaces of [true, false]) {
      const options = { tabSize: 2, insertSpaces, newLine: false };
      const result = await format(fixture.source, options);
      assert.equal(
        await format(result, options),
        result,
        "historical sample must be idempotent",
      );
      assert.deepEqual(
        preservationKey(result, true),
        preservationKey(fixture.source, true),
      );
    }
  });
