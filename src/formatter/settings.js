"use strict";
function readOptions(config, formatting) {
  const style = config.get("indentStyle", "editor");
  return {
    insertSpaces:
      style === "editor" ? formatting.insertSpaces : style === "space",
    tabSize: config.get("tabSize", 0) || formatting.tabSize,
    wrap: config.get("wrap", 0),
    forceAttribute: config.get("forceAttribute", false),
    spaceClose: config.get("spaceClose", false),
    newLine: config.get("newLine", true),
    embeddedFormatting: config.get("embeddedFormatting", true),
  };
}
function matchesIgnore(patterns, paths) {
  return patterns.some((pattern) => {
    if (typeof pattern !== "string" || !pattern) return false;
    let regex = "";
    const normalized = pattern.replace(/\\/g, "/");
    for (let i = 0; i < normalized.length; i++) {
      const c = normalized[i];
      if (c === "*" && normalized[i + 1] === "*") {
        i++;
        if (normalized[i + 1] === "/") {
          i++;
          regex += "(?:.*/)?";
        } else regex += ".*";
      } else if (c === "*") regex += "[^/]*";
      else if (c === "?") regex += "[^/]";
      else regex += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    const re = new RegExp("^" + regex + "(?:/.*)?$");
    return paths.some((path) => re.test(path.replace(/\\/g, "/")));
  });
}
module.exports = { readOptions, matchesIgnore };
