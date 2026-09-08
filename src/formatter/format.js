"use strict";

const { twigStart, twigEnd, twigInfo } = require("./lexer");
const VOID = new Set(
  "area base br col embed hr img input link meta param source track wbr".split(
    " ",
  ),
);
const { parse, isOpaque } = require("./parser");

function optionsFor(input = {}) {
  const integer = (value, fallback, min, max) =>
    Number.isInteger(value) ? Math.min(max, Math.max(min, value)) : fallback;
  return {
    tabSize: integer(input.tabSize, 4, 1, 16),
    insertSpaces: input.insertSpaces !== false,
    wrap: integer(input.wrap, 0, 0, 1000),
    forceAttribute: input.forceAttribute === true,
    spaceClose: input.spaceClose === true,
    newLine: input.newLine !== false,
    embeddedFormatting: input.embeddedFormatting !== false,
    eol: input.eol === "\r\n" || input.eol === "\n" ? input.eol : undefined,
  };
}

function formatTwig(raw) {
  const info = twigInfo(raw);
  // Multiline expressions, line comments, and literal strings keep their exact contents.
  // Only separators between lexical atoms are canonicalized; quote conversion is not formatting.
  if (info.parts.some((x) => x.kind === "comment") || /[\r\n]/.test(info.body))
    return raw;
  const atoms = info.atoms;
  const output = [];
  const tight = new Set([".", "?.", "..", "|"]);
  const keywordBeforeParen = new Set([
    "if",
    "elseif",
    "and",
    "or",
    "not",
    "in",
    "is",
    "matches",
    "starts",
    "ends",
    "with",
    "b-and",
    "b-or",
    "b-xor",
  ]);
  for (let i = 0; i < atoms.length; i++) {
    const atom = atoms[i],
      prev = atoms[i - 1];
    let space = i > 0;
    if (prev) {
      const a = prev.text,
        b = atom.text;
      if (
        tight.has(a) ||
        tight.has(b) ||
        [")", "]", "}", ",", ":"].includes(b) ||
        ["(", "[", "{"].includes(a)
      )
        space = false;
      if (
        b === "(" &&
        !keywordBeforeParen.has(a) &&
        (prev.kind === "word" || [")", "]"].includes(a))
      )
        space = false;
      if (
        b === "[" &&
        (prev.kind === "word" || [")", "]"].includes(a)) &&
        ![
          "in",
          "set",
          "return",
          "with",
          "if",
          "elseif",
          "and",
          "or",
          "not",
        ].includes(a)
      )
        space = false;
      if (b === ":" && atoms.some((x) => x.text === "?")) space = true;
      // Unary signs and spread bind to their operand. Do not join two operators into another token.
      if (
        ["-", "+", "..."].includes(a) &&
        (i === 1 ||
          ["(", "[", "{", ",", ":", "=", "?", "=>"].includes(
            atoms[i - 2]?.text,
          ))
      )
        space = false;
    }
    if (space) output.push(" ");
    output.push(atom.text);
  }
  const formatted = info.left + " " + output.join("") + " " + info.right;
  // Token equality catches accidentally coalesced operators (e.g. - - becoming --).
  const signature = (x) => twigInfo(x).atoms.map((a) => [a.kind, a.text]);
  return JSON.stringify(signature(raw)) === JSON.stringify(signature(formatted))
    ? formatted
    : raw;
}

function formatHtml(raw, depth, options) {
  // Split on HTML whitespace only outside quotes and Twig islands.
  const chunks = [];
  let chunk = "",
    quote = null,
    i = 0;
  while (i < raw.length) {
    if (twigStart(raw, i)) {
      const end = twigEnd(raw, i);
      const island = raw.slice(i, end);
      chunk += island.startsWith("{#") ? island : formatTwig(island);
      i = end;
      continue;
    }
    const c = raw[i++];
    if (quote) {
      chunk += c;
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
      chunk += c;
    } else if (/\s/.test(c)) {
      if (chunk) {
        chunks.push(chunk);
        chunk = "";
      }
      while (/\s/.test(raw[i] || "") && i < raw.length) i++;
    } else chunk += c;
  }
  if (chunk) chunks.push(chunk);
  if (!chunks.length) return raw;
  const last = chunks.length - 1;
  const closing = /\/?\s*>$/.exec(chunks[last]);
  if (!closing) return raw;
  const end = closing[0].replace(/\s/g, "");
  chunks[last] = chunks[last].slice(0, -closing[0].length);
  if (!chunks[last]) chunks.pop();
  // A whitespace token around '=' belongs to the same attribute, not its own line.
  for (let j = 1; j < chunks.length; j++) {
    if (
      chunks[j] === "=" ||
      chunks[j].startsWith("=") ||
      chunks[j - 1].endsWith("=")
    ) {
      chunks[j - 1] += chunks[j];
      chunks.splice(j--, 1);
    }
  }
  const inline =
    chunks.join(" ") + (end === "/>" && options.spaceClose ? " " : "") + end;
  const indent = indentation(depth, options),
    inner = indentation(depth + 1, options);
  const multiline =
    chunks.length > 1 &&
    (options.forceAttribute ||
      /\r?\n/.test(raw) ||
      (options.wrap > 0 &&
        depth * options.tabSize + inline.length > options.wrap));
  if (!multiline) return inline;
  return (
    chunks[0] +
    options.eol +
    chunks
      .slice(1)
      .map((x) => inner + x)
      .join(options.eol) +
    options.eol +
    indent +
    end
  );
}

const indentation = (depth, options) =>
  (options.insertSpaces ? " ".repeat(options.tabSize) : "\t").repeat(
    Math.max(0, Math.min(256, depth)),
  );

function mergeBranches(branches) {
  const result = [];
  const length = Math.min(...branches.map((b) => b.length));
  for (let i = 0; i < length; i++)
    result.push(new Set(branches.flatMap((b) => [...b[i]])));
  return result;
}

function layout(tokens, opaque = []) {
  let html = [];
  const twig = [];
  const depth = () =>
    html.length + twig.length + twig.filter((x) => x.inCase).length;
  return tokens.map((token) => {
    let indent = depth();
    if (isOpaque(opaque, token.start)) return { ...token, depth: indent };
    if (token.type === "tag") {
      const info = token.info;
      if (token.role === "close") {
        const name = info.name.slice(3);
        const index = twig.findLastIndex((x) => x.name === name);
        if (index >= 0) {
          const frame = twig[index];
          if (frame.branches.length)
            html = mergeBranches([...frame.branches, html]);
          twig.length = index;
          indent =
            Math.min(frame.html.length, html.length) +
            twig.length +
            twig.filter((x) => x.inCase).length;
        }
      } else if (token.role === "branch" && twig.length) {
        const frame = twig[twig.length - 1];
        frame.branches.push(html);
        html = frame.html.slice();
        frame.inCase = false;
        indent = depth() - (["case", "default"].includes(info.name) ? 0 : 1);
        frame.inCase = ["case", "default"].includes(info.name);
      } else if (token.role === "open") {
        if (twig.length >= 256)
          throw new Error("Twig nesting exceeds 256 levels");
        twig.push({
          name: info.name,
          html: html.slice(),
          branches: [],
          inCase: false,
        });
      }
    } else if (token.type === "html" && token.name) {
      if (token.closing) {
        const index = html.findLastIndex((names) => names.has(token.name));
        if (index >= 0) html.length = index;
        indent = depth();
      } else if (!token.selfClosing && !VOID.has(token.name)) {
        if (html.length >= 256)
          throw new Error("HTML nesting exceeds 256 levels");
        html.push(new Set([token.name]));
      }
    }
    return { ...token, depth: Math.max(0, indent) };
  });
}

function minimalEdit(source, start, end, text) {
  const original = source.slice(start, end);
  if (original === text) return null;
  let a = 0,
    b = 0;
  while (a < original.length && a < text.length && original[a] === text[a]) a++;
  while (
    b < original.length - a &&
    b < text.length - a &&
    original[original.length - b - 1] === text[text.length - b - 1]
  )
    b++;
  // Never bisect a surrogate pair or a CRLF pair in a VS Code edit.
  if (
    a &&
    (/[\uDC00-\uDFFF]/.test(original[a] || "") ||
      (original[a] === "\n" && original[a - 1] === "\r"))
  )
    a--;
  if (
    b &&
    (/[\uDC00-\uDFFF]/.test(original[original.length - b] || "") ||
      (original[original.length - b] === "\n" &&
        original[original.length - b - 1] === "\r"))
  )
    b--;
  return {
    start: start + a,
    end: end - b,
    text: text.slice(a, text.length - b),
  };
}

function applyEdits(source, edits) {
  const chunks = [];
  let offset = 0;
  for (const edit of edits) {
    if (
      edit.start < offset ||
      edit.end < edit.start ||
      edit.end > source.length
    )
      throw new Error("Invalid formatter edit");
    chunks.push(source.slice(offset, edit.start), edit.text);
    offset = edit.end;
  }
  chunks.push(source.slice(offset));
  return chunks.join("");
}

async function formatEdits(source, input = {}, range) {
  if (Buffer.byteLength(source, "utf8") > 2 * 1024 * 1024)
    throw new Error("Twig formatting is limited to 2 MiB per document");
  const options = optionsFor(input);
  const tree = parse(source);
  if (tree.lexicalError) throw tree.lexicalError;
  if (tree.diagnostics.length) return [];
  const tokens = layout(tree.tokens, tree.opaque);
  const eol = options.eol || (source.includes("\r\n") ? "\r\n" : "\n");
  options.eol = eol;
  const edits = [];
  const add = (start, end, text) => {
    if (range && (start < range.start || end > range.end)) return;
    if (isOpaque(tree.opaque, start, end)) return;
    const edit = minimalEdit(source, start, end, text);
    if (edit) edits.push(edit);
  };
  for (const token of tokens) {
    if (isOpaque(tree.opaque, token.start)) continue;
    let formatted = token.raw;
    if (token.type === "tag" || token.type === "output")
      formatted = formatTwig(token.raw);
    else if (token.type === "html")
      formatted = formatHtml(token.raw, token.depth, options);
    else if (
      token.type === "raw" &&
      ["script", "style"].includes(token.kind) &&
      options.embeddedFormatting
    ) {
      formatted = await require("./embedded").formatEmbedded(
        token,
        source,
        options,
      );
    }
    // Preserve original newlines within literal/raw spans. Only generated layout uses document EOL.
    if (formatted !== token.raw) add(token.start, token.end, formatted);
  }
  // Indentation is derived from the complete document even for a selection.
  let owner = 0;
  const lines = /(^|\n)([\t ]*)\S/g;
  let line;
  while ((line = lines.exec(source))) {
    const start = line.index + line[1].length;
    const content = start + line[2].length;
    while (owner < tokens.length && tokens[owner].end <= content) owner++;
    const token = tokens[owner];
    if (!token || token.kind === "ignore") continue;
    if (isOpaque(tree.opaque, content)) continue;
    if (token.type !== "text" && token.start !== content) continue;
    add(start, content, indentation(token.depth, options));
  }
  if (!range && options.newLine && source.length && !source.endsWith("\n")) {
    const last = tokens[tokens.length - 1];
    // A newline after a literal text tail is rendered content. Preserve that boundary.
    if (
      last &&
      last.type !== "text" &&
      last.kind !== "ignore" &&
      !isOpaque(tree.opaque, source.length - 1)
    )
      add(source.length, source.length, eol);
  }
  edits.sort((a, b) => a.start - b.start || a.end - b.end);
  const output = applyEdits(source, edits);
  // Retokenizing detects malformed output before an edit can reach the editor.
  const { preservationKey } = require("./preservation");
  if (
    JSON.stringify(preservationKey(source, options.embeddedFormatting)) !==
    JSON.stringify(preservationKey(output, options.embeddedFormatting))
  ) {
    throw new Error(
      "Formatting would change a source token; no edits were applied",
    );
  }
  return edits;
}

async function format(source, options) {
  return applyEdits(source, await formatEdits(source, options));
}
module.exports = {
  format,
  formatEdits,
  applyEdits,
  formatTwig,
  optionsFor,
  minimalEdit,
  layout,
};
