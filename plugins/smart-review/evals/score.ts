// Scorer for the smart-review eval corpus.
// Dependency-free (Node built-ins only). Run via tsx: `npm run score`.
//
//   npm run score                      overall + per-case + per-lens
//   npm run score -- --drop security   ablation: remove one lens, re-score
//   npm run score -- --window 8        line-match tolerance (default 5)
//   npm run score -- --strict-severity  require findings to meet min_severity
//   npm run list                       print the corpus manifest, no scoring

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, basename as pathBasename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type Finding,
  type ExpectedSpec,
  type ExpectedFinding,
  type CaseMeta,
  type Lens,
  SEVERITY_RANK,
} from "./types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

const LENSES: Lens[] = [
  "spec-conformance",
  "correctness",
  "security",
  "performance",
  "design",
  "tests",
];

interface Args {
  drop?: Lens;
  window: number;
  strictSeverity: boolean;
  corpus: string;
  list: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    window: 5,
    strictSeverity: false,
    corpus: join(HERE, "corpus"),
    list: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--drop") a.drop = argv[++i] as Lens;
    else if (t === "--window") a.window = Number(argv[++i]);
    else if (t === "--strict-severity") a.strictSeverity = true;
    else if (t === "--corpus") a.corpus = argv[++i];
    else if (t === "list" || t === "--list") a.list = true;
  }
  return a;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function loadFindings(path: string): Finding[] {
  if (!existsSync(path)) return [];
  const raw = readJson<unknown>(path);
  if (Array.isArray(raw)) return raw as Finding[];
  if (raw && typeof raw === "object" && Array.isArray((raw as any).findings)) {
    return (raw as any).findings as Finding[];
  }
  return [];
}

function base(p: string): string {
  return pathBasename(p);
}

/** Does actual finding `f` match expected defect `e`? Severity gate optional. */
function matches(e: ExpectedFinding, f: Finding, window: number, strict: boolean): boolean {
  if (f.category !== e.category) return false;
  if (base(f.file) !== base(e.file)) return false;
  const inSpan = e.near_line >= f.line_start && e.near_line <= f.line_end;
  const near =
    Math.abs(f.line_start - e.near_line) <= window ||
    Math.abs(f.line_end - e.near_line) <= window;
  if (!inSpan && !near) return false;
  if (strict && SEVERITY_RANK[f.severity] < SEVERITY_RANK[e.min_severity]) return false;
  return true;
}

interface CaseResult {
  id: string;
  primaryLens: Lens;
  mustFind: ExpectedFinding[];
  matched: boolean[]; // parallel to mustFind
  underRated: number; // matched-but-below-min_severity count
  totalActual: number;
  tpActual: number; // actual findings corresponding to a must_find
  fp: number; // actual findings matching nothing (incl. must_not_find hits)
  trapHits: number;
}

function scoreCase(dir: string, args: Args): CaseResult {
  const meta = readJson<CaseMeta>(join(dir, "meta.json"));
  const expected = readJson<ExpectedSpec>(join(dir, "expected.json"));
  let actual = loadFindings(join(dir, "actual.json"));
  if (args.drop) actual = actual.filter((f) => f.lens !== args.drop);

  const mustFind = expected.must_find ?? [];
  const mustNot = expected.must_not_find ?? [];

  const matched = mustFind.map((e) => actual.some((f) => matches(e, f, args.window, args.strictSeverity)));
  const underRated = mustFind.reduce((n, e) => {
    const hitLoose = actual.some((f) => matches(e, f, args.window, false));
    const hitStrict = actual.some((f) => matches(e, f, args.window, true));
    return n + (hitLoose && !hitStrict ? 1 : 0);
  }, 0);

  let tpActual = 0;
  let fp = 0;
  let trapHits = 0;
  for (const f of actual) {
    const isTp = mustFind.some((e) => matches(e, f, args.window, false));
    const isTrap = mustNot.some((e) => matches(e, f, args.window, false));
    if (isTp) tpActual++;
    else fp++;
    if (isTrap) trapHits++;
  }

  return {
    id: meta.id,
    primaryLens: meta.primary_lens,
    mustFind,
    matched,
    underRated,
    totalActual: actual.length,
    tpActual,
    fp,
    trapHits,
  };
}

function pct(n: number, d: number): string {
  if (d === 0) return "  n/a";
  return `${((100 * n) / d).toFixed(0).padStart(3)}%`;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function listCorpus(args: Args) {
  const dirs = corpusDirs(args.corpus);
  console.log(`\nsmart-review eval corpus (${dirs.length} cases)\n`);
  for (const d of dirs) {
    const meta = readJson<CaseMeta>(join(d, "meta.json"));
    const exp = readJson<ExpectedSpec>(join(d, "expected.json"));
    const traps = exp.must_not_find?.length ?? 0;
    console.log(pad(meta.id, 30) + pad(meta.primary_lens, 18) + `${exp.must_find.length} planted${traps ? `, ${traps} trap(s)` : ""}`);
    if (meta.spec) console.log(pad("", 30) + `spec: ${meta.spec}`);
  }
  console.log("");
}

function corpusDirs(corpus: string): string[] {
  if (!existsSync(corpus)) return [];
  return readdirSync(corpus)
    .map((n) => join(corpus, n))
    .filter((p) => statSync(p).isDirectory() && existsSync(join(p, "meta.json")))
    .sort();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.list) return listCorpus(args);

  const dirs = corpusDirs(args.corpus);
  if (dirs.length === 0) {
    console.error(`No cases found in ${args.corpus}`);
    process.exit(1);
  }

  const results = dirs.map((d) => scoreCase(d, args));
  const anyActual = results.some((r) => r.totalActual > 0);

  console.log(`\nsmart-review eval — ${results.length} cases` + (args.drop ? `  [ablation: dropped ${args.drop}]` : ""));
  if (!anyActual) {
    console.log(
      "\n⚠  No actual.json found in any case. Run the reviewer on each case and save its\n" +
        "   findings array to corpus/<case>/actual.json, then re-run. See README.md.\n",
    );
  }
  console.log("\n" + pad("case", 30) + pad("lens", 18) + pad("recall", 9) + pad("found/planted", 16) + "false-pos");
  console.log("-".repeat(80));

  let totMust = 0, totFound = 0, totActual = 0, totTp = 0, totTrap = 0, totUnder = 0;
  const perLens: Record<string, { must: number; found: number }> = {};

  for (const r of results) {
    const found = r.matched.filter(Boolean).length;
    totMust += r.mustFind.length;
    totFound += found;
    totActual += r.totalActual;
    totTp += r.tpActual;
    totTrap += r.trapHits;
    totUnder += r.underRated;

    // per-lens bucket by each planted defect's expected lens, falling back to primary
    r.mustFind.forEach((e, i) => {
      const lens = e.lens ?? r.primaryLens;
      (perLens[lens] ??= { must: 0, found: 0 }).must++;
      if (r.matched[i]) perLens[lens].found++;
    });

    console.log(
      pad(r.id, 30) +
        pad(r.primaryLens, 18) +
        pad(pct(found, r.mustFind.length), 9) +
        pad(`${found}/${r.mustFind.length}`, 16) +
        `${r.fp}${r.trapHits ? ` (${r.trapHits} trap)` : ""}`,
    );
  }

  console.log("-".repeat(80));
  console.log(
    pad("OVERALL", 30) + pad("", 18) + pad(pct(totFound, totMust), 9) + pad(`${totFound}/${totMust}`, 16) + `${totActual - totTp} of ${totActual}`,
  );

  console.log("\nper-lens recall (by planted defect's owning lens):");
  for (const lens of LENSES) {
    const b = perLens[lens];
    if (!b) continue;
    console.log("  " + pad(lens, 18) + pad(pct(b.found, b.must), 9) + `${b.found}/${b.must}`);
  }

  const precision = totActual === 0 ? "n/a" : pct(totTp, totActual).trim();
  console.log(
    `\nrecall    ${pct(totFound, totMust).trim()}   (${totFound}/${totMust} planted defects caught)` +
      (totUnder ? `  [${totUnder} caught but under-rated]` : ""),
  );
  console.log(`precision ${precision}   (${totTp}/${totActual} findings correspond to a planted defect)`);
  if (totTrap) console.log(`traps     ${totTrap} finding(s) fired on a must-not-find trap`);
  console.log("");
}

main();
