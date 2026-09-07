"use strict";
const { scan, twigStart, twigEnd, twigInfo } = require("./lexer");

function twigKey(raw) {
  if (raw.startsWith("{#")) return raw;
  const { left, right, parts } = twigInfo(raw);
  return [
    left,
    parts.filter((p) => p.kind !== "space").map((p) => [p.kind, p.text]),
    right,
  ];
}

function htmlKey(raw) {
  const result = [];
  let text = "",
    quote = null;
  for (let i = 0; i < raw.length;) {
    if (twigStart(raw, i)) {
      const end = twigEnd(raw, i);
      result.push(text, twigKey(raw.slice(i, end)));
      text = "";
      i = end;
      continue;
    }
    const c = raw[i++];
    if (quote) {
      text += c;
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
      text += c;
    } else if (!/\s/.test(c)) text += c;
  }
  result.push(text);
  return result;
}

// Independent comparison of every source-bearing span. Embedded formatting is checked
// separately by its real language parser and exact Twig-island comparison.
function preservationKey(source, embedded = false) {
  return scan(source).flatMap((token) => {
    if (token.type === "text") {
      if (!token.raw.trim()) return [];
      const atLineStart = /^[\t ]*$/.test(
        source.slice(
          source.lastIndexOf("\n", token.start - 1) + 1,
          token.start,
        ),
      );
      const text = token.raw.replace(
        /(^|\n)[\t ]+/g,
        (match, boundary, offset) =>
          boundary || (offset === 0 && !atLineStart ? match : ""),
      );
      return [["text", text]];
    }
    if (token.type === "tag" || token.type === "output")
      return [[token.type, twigKey(token.raw)]];
    if (token.type === "html") return [["html", htmlKey(token.raw)]];
    if (embedded && ["script", "style"].includes(token.kind)) {
      return [
        [
          "embedded",
          source.slice(token.start, token.openingEnd),
          source.slice(token.closingStart, token.end),
        ],
      ];
    }
    return [[token.type, token.raw]];
  });
}
module.exports = { preservationKey };
