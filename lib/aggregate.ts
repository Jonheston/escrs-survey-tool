import type { DistRow, FilterDef, FilterState, Respondent } from "./types";

function isBlank(v: any): boolean {
  return v === undefined || v === null || String(v).trim() === "";
}

export function applyFilters(
  rows: Respondent[],
  filterDefs: FilterDef[],
  state: FilterState
): Respondent[] {
  return rows.filter(r => {
    for (const def of filterDefs) {
      const s = state[def.id];
      if (!s || s.mode === "all") continue;

      const cell = r[def.column];

      // Per your rule: auto-exclude blanks (treat as non-answers)
      if (isBlank(cell)) return false;

      if (s.mode === "single") {
        if (!s.value) continue;
        if (String(cell) !== s.value) return false;
      }

      if (s.mode === "multi") {
        const values = s.values ?? [];
        if (values.length === 0) continue;
        if (!values.includes(String(cell))) return false;
      }
    }
    return true;
  });
}

function pct(count: number, denom: number): number {
  if (denom <= 0) return 0;
  return (count / denom) * 100;
}

export function buildDistributions(args: {
  baselineRows: Respondent[];
  filteredRows: Respondent[];
  questionColumn: string;
  optionOrder: string[];
  labelOverrides?: Record<string, string>;
}): { baseline: DistRow[]; filtered: DistRow[] } {
  const { baselineRows, filteredRows, questionColumn, optionOrder, labelOverrides = {} } = args;

  const baselineCounts = new Map<string, number>();
  const filteredCounts = new Map<string, number>();

  const inc = (m: Map<string, number>, key: string) => {
    m.set(key, (m.get(key) ?? 0) + 1);
  };

  // Count
  for (const r of baselineRows) {
    const v = r[questionColumn];
    if (isBlank(v)) continue;
    inc(baselineCounts, String(v));
  }
  for (const r of filteredRows) {
    const v = r[questionColumn];
    if (isBlank(v)) continue;
    inc(filteredCounts, String(v));
  }

  const baselineDen = baselineRows.filter(r => !isBlank(r[questionColumn])).length;
  const filteredDen = filteredRows.filter(r => !isBlank(r[questionColumn])).length;

  const keys =
    optionOrder.length > 0
      ? optionOrder
      : Array.from(new Set([...baselineCounts.keys(), ...filteredCounts.keys()])).sort((a, b) =>
          a.localeCompare(b)
        );

  const baseline: DistRow[] = keys.map(k => {
    const c = baselineCounts.get(k) ?? 0;
    return {
      key: k,
      label: labelOverrides[k] ?? k,
      count: c,
      pct: pct(c, baselineDen),
    };
  });

  const filtered: DistRow[] = keys.map(k => {
    const c = filteredCounts.get(k) ?? 0;
    return {
      key: k,
      label: labelOverrides[k] ?? k,
      count: c,
      pct: pct(c, filteredDen),
    };
  });

  return { baseline, filtered };
}
