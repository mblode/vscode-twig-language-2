const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
test('shared Twig source matches the pinned canonical distribution', () => {
  const manifest = require('../.twig-core.json');
  assert.equal(manifest.source, 'mblode/vscode-twig-language-2');
  for (const [file, expected] of Object.entries(manifest.files)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', file))).digest('hex');
    assert.equal(actual, expected, `${file} changed: update the canonical source and synchronize the distributions`);
  }
});
