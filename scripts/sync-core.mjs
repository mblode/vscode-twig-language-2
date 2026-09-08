import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.resolve(process.argv[2] || source);
const manifest = JSON.parse(fs.readFileSync(path.join(destination, 'package.json')));
if (manifest.publisher !== 'mblode' || !['twig-language', 'twig-language-2', 'pretty-formatter'].includes(manifest.name)) throw new Error('Expected a matching extension checkout');
const shared = fs.readdirSync(path.join(source, 'src/formatter')).filter(f => f.endsWith('.js')).map(f => 'src/formatter/' + f);
if (manifest.name !== 'pretty-formatter') shared.push('src/extension.js', 'src/html.js', 'src/syntaxes/twig.tmLanguage', 'src/languages/twig.configuration.json', 'src/snippets/snippets.json');
const hashes = {};
for (const relative of shared) {
  const bytes = fs.readFileSync(path.join(source, relative));
  hashes[relative] = crypto.createHash('sha256').update(bytes).digest('hex');
  if (destination !== source) {
    fs.mkdirSync(path.dirname(path.join(destination, relative)), { recursive: true });
    fs.writeFileSync(path.join(destination, relative), bytes);
  }
}
const version = JSON.parse(fs.readFileSync(path.join(source, 'package.json'))).version;
fs.writeFileSync(path.join(destination, '.twig-core.json'), JSON.stringify({ source: 'mblode/vscode-twig-language-2', version, files: hashes }, null, 2) + '\n');
for (const test of ['core-provenance.test.js', 'parser.test.js'])
  if (destination !== source) fs.copyFileSync(path.join(source, 'test', test), path.join(destination, 'test', test));
console.log(`Synchronized ${shared.length} files from Twig Language 2 ${version} to ${manifest.name}`);
