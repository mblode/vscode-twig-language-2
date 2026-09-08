"""Run the pinned upstream parser against the formatter corpus; requires Cargo and Git."""
import json
import pathlib
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
COMMIT = "d845944ae4e327da8f06522b5a60a5bbfc7c0398"
EXAMPLE = r'''
fn main() {
    for path in std::env::args().skip(1) {
        let input = std::fs::read_to_string(&path).unwrap();
        let (root, errors) = ludtwig_parser::parse(&input).split();
        println!("{}\t{}\t{}", path, errors.len(), root.text().to_string() == input);
    }
}
'''
cases = []
for group in ["regressions", "history"]:
    cases += [dict(f, group=group) for f in json.loads((ROOT / f"test/fixtures/{group}.json").read_text())]
cases.append(dict(id="valid-conditional-wrapper", group="curated", source="{% if condition %}<div>{% endif %}content{% if condition %}</div>{% endif %}"))
with tempfile.TemporaryDirectory(prefix="twig-parser-evaluation-") as temp:
    work = pathlib.Path(temp)
    upstream = work / "ludtwig"
    subprocess.run(["git", "clone", "https://github.com/MalteJanz/ludtwig", str(upstream)], check=True)
    subprocess.run(["git", "checkout", "--detach", COMMIT], cwd=upstream, check=True)
    example = upstream / "crates/ludtwig-parser/examples/corpus.rs"
    example.parent.mkdir(exist_ok=True)
    example.write_text(EXAMPLE)
    paths = []
    for i, case in enumerate(cases):
        file = work / f"{i:04}.twig"
        file.write_text(case["source"])
        paths.append(str(file))
    result = subprocess.run(["cargo", "run", "--locked", "-q", "-p", "ludtwig-parser", "--example", "corpus", "--", *paths], cwd=upstream, check=True, text=True, capture_output=True)
    rows = result.stdout.splitlines()
    assert len(rows) == len(cases)
    report = {"upstreamCommit": COMMIT, "cases": []}
    for case, row in zip(cases, rows):
        _, errors, lossless = row.split("\t")
        report["cases"].append({"id": case["id"], "group": case["group"], "diagnostics": int(errors), "lossless": lossless == "true"})
    print(json.dumps(report, indent=2))
