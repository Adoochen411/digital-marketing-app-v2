const ts = require("typescript");
const fs = require("fs");

const p = "src/pages/AdminDashboard.tsx";
const s = fs.readFileSync(p, "utf8");
const f = ts.createSourceFile(
  p,
  s,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

console.log("Total lines:", s.split(/\r?\n/).length);

for (const d of f.parseDiagnostics) {
  const pos = d.start ?? s.length;
  const lc = f.getLineAndCharacterOfPosition(pos);
  const lines = s.split(/\r?\n/);

  console.log("\nERROR:", ts.flattenDiagnosticMessageText(d.messageText, " "));
  console.log("LINE:", lc.line + 1, "COLUMN:", lc.character + 1);

  const start = Math.max(0, lc.line - 15);
  const end = Math.min(lines.length, lc.line + 8);

  for (let i = start; i < end; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
