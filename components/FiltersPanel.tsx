import type { FilterDef, FilterState, Respondent } from "@/lib/types";

function uniqNonBlank(values: any[]): string[] {
  const s = new Set<string>();
  for (const v of values) {
    if (v === undefined || v === null) continue;
    const str = String(v).trim();
    if (!str) continue;
    s.add(str);
  }
  return Array.from(s);
}

function norm(s: string) {
  return s
    .trim()
    .replace(/\u2013|\u2014/g, "-") // en dash/em dash -> hyphen
    .replace(/\s+/g, " ");         // collapse whitespace
}

function sortValues(values: string[], def: FilterDef): string[] {
  const mode = def.ui?.order_mode ?? "alpha";

  if (mode === "custom" && def.ui?.order?.length) {
    const order = def.ui.order;

    // Map normalized custom order -> rank
    const rank = new Map(order.map((v, i) => [norm(v), i]));

    return [...values].sort((a, b) => {
      const ra = rank.has(norm(a)) ? (rank.get(norm(a)) as number) : 1e9;
      const rb = rank.has(norm(b)) ? (rank.get(norm(b)) as number) : 1e9;
      if (ra !== rb) return ra - rb;
      return a.localeCompare(b);
    });
  }

  return [...values].sort((a, b) => a.localeCompare(b));
}


export default function FiltersPanel(props: {
  configFilters: FilterDef[];
  respondents: Respondent[];
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  accent: string;
}) {
  const { configFilters, respondents, filters, setFilters, accent } = props;

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 10 }}>Filters</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setFilters({})}
          style={{
            background: "white",
            border: "1px solid #ddd",
            padding: "8px 10px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 800
          }}
        >
          Clear all
        </button>

        <button
          onClick={() => {
            const next: FilterState = {};
            for (const def of configFilters) next[def.id] = { mode: "all" };
            setFilters(next);
          }}
          style={{
            background: accent,
            color: "white",
            border: "none",
            padding: "8px 10px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 800
          }}
        >
          Reset baseline
        </button>
      </div>

      {configFilters.map((def) => {
        const values = sortValues(
          uniqNonBlank(respondents.map((r) => r[def.column])),
          def
        );

        const state = filters[def.id] ?? { mode: "all" as const };

        // We’re making everything “select all that apply”:
        // - mode=all => no filtering
        // - mode=multi => filter to the selected values
        const selected =
          state.mode === "multi" ? new Set(state.values ?? []) : new Set<string>();

        const allSelected = values.length > 0 && selected.size === values.length;

        return (
          <div key={def.id} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
              {def.label}
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    [def.id]: { mode: "multi", values }
                  })
                }
                disabled={values.length === 0}
                style={{
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: allSelected ? accent : "white",
                  color: allSelected ? "white" : "#111",
                  fontWeight: 800,
                  cursor: values.length === 0 ? "not-allowed" : "pointer",
                  opacity: values.length === 0 ? 0.5 : 1
                }}
              >
                Select all
              </button>

              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    [def.id]: { mode: "all" }
                  })
                }
                style={{
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: "white",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Clear
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: 220,
                overflow: "auto",
                padding: 8,
                borderRadius: 10,
                border: "1px solid #eee",
                background: "#fff"
              }}
            >
              {values.map((v) => {
                const checked = selected.has(v);

                return (
                  <label
                    key={v}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = new Set(selected);
                        checked ? next.delete(v) : next.add(v);

                        setFilters({
                          ...filters,
                          [def.id]:
                            next.size === 0
                              ? { mode: "all" }
                              : { mode: "multi", values: Array.from(next) }
                        });
                      }}
                    />
                    {v}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}