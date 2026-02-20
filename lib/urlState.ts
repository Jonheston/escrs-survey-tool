import type { FilterState } from "./types";

function splitCsv(v: string | null): string[] {
  if (!v) return [];
  return v.split(",").map(s => s.trim()).filter(Boolean);
}

export function parseUrlState(search: string): { topic?: string; filters?: FilterState } {
  const params = new URLSearchParams(search);
  const topic = params.get("topic") ?? undefined;

  const filters: FilterState = {};
  // We encode filters as:
  // f_<id>=all | f_<id>=value | f_<id>=v1,v2,v3 (multi)
  for (const [k, v] of params.entries()) {
    if (!k.startsWith("f_")) continue;
    const id = k.slice(2);
    if (!v || v === "all") {
      filters[id] = { mode: "all" };
    } else if (v.includes(",")) {
      filters[id] = { mode: "multi", values: splitCsv(v) };
    } else {
      filters[id] = { mode: "single", value: v };
    }
  }

  return { topic, filters };
}

export function toQueryString(args: { topic: string; filters: FilterState }): string {
  const params = new URLSearchParams();
  params.set("topic", args.topic);

  for (const [id, s] of Object.entries(args.filters)) {
    const key = `f_${id}`;
    if (!s || s.mode === "all") {
      params.set(key, "all");
    } else if (s.mode === "single") {
      params.set(key, s.value ?? "all");
    } else if (s.mode === "multi") {
      params.set(key, (s.values ?? []).join(","));
    }
  }

  const qs = params.toString();
  return qs;
}
