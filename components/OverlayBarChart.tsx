import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, LabelList } from "recharts";
import type { DistRow } from "@/lib/types";
type WrappedTickProps = {
  x?: number;
  y?: number;
  payload?: { value: string };
};

function WrappedXAxisTick({ x = 0, y = 0, payload }: WrappedTickProps) {
  const text = (payload?.value ?? "").trim();

  // Tunables
  const maxCharsPerLine = 18;   // increase/decrease for tighter wrapping
  const lineHeight = 14;        // px
  const maxLines = 4;           // prevent giant labels taking over the chart

  // Split on spaces AND dashes, but keep the dash as a token so we can re-add it nicely.
  // Example: "Wavefront-optimized" -> ["Wavefront", "-", "optimized"]
  const rawTokens = text.split(/(\s+|-)/).filter(t => t.length > 0);

  // Build "wrap tokens" that include hyphen logic:
  // - collapse whitespace to single spaces
  // - treat "-" as something that should stick to the previous token if possible
  const tokens: string[] = [];
  for (const t of rawTokens) {
    if (/^\s+$/.test(t)) {
      tokens.push(" ");
    } else if (t === "-") {
      tokens.push("-");
    } else {
      tokens.push(t);
    }
  }

  function pushHardSplitToken(out: string[], token: string) {
    // Split a single too-long token into chunks with trailing hyphen where appropriate.
    // e.g. "supercalifragilisticexpialidocious" -> ["supercalifragilis-", "ticexpialidoci-", "ous"]
    let remaining = token;
    while (remaining.length > maxCharsPerLine) {
      out.push(remaining.slice(0, maxCharsPerLine - 1) + "-");
      remaining = remaining.slice(maxCharsPerLine - 1);
    }
    if (remaining.length) out.push(remaining);
  }

  // Convert tokens into "words" where hyphens bind:
  // We’ll build segments that are safe to wrap.
  // Example: ["Wavefront","-","optimized"] -> ["Wavefront-","optimized"]
  const segments: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t === " ") continue;

    if (t === "-") {
      // Attach dash to previous segment if possible
      if (segments.length > 0 && !segments[segments.length - 1].endsWith("-")) {
        segments[segments.length - 1] = segments[segments.length - 1] + "-";
      } else {
        // If no previous, treat as its own segment
        segments.push("-");
      }
      continue;
    }

    // Normal word token
    if (t.length > maxCharsPerLine) {
      pushHardSplitToken(segments, t);
    } else {
      segments.push(t);
    }
  }

  // Wrap segments into lines
  const lines: string[] = [];
  let current = "";

  for (const seg of segments) {
    const candidate = current ? `${current} ${seg}` : seg;

    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    // If current is empty and seg itself is too big, hard split it
    if (!current) {
      const tmp: string[] = [];
      pushHardSplitToken(tmp, seg);
      for (const piece of tmp) {
        if (lines.length < maxLines) lines.push(piece);
      }
      current = "";
      continue;
    }

    // Push current line, start new with seg
    lines.push(current);
    current = seg;

    if (lines.length >= maxLines) {
      current = "";
      break;
    }
  }

  if (current && lines.length < maxLines) lines.push(current);

  // If we truncated, add ellipsis to last line
  if (lines.length === maxLines && current === "") {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = last.length > maxCharsPerLine - 1
      ? last.slice(0, maxCharsPerLine - 1) + "…"
      : last + "…";
  }

  return (
    <g transform={`translate(${x},${y + 10})`}>
      <text
        textAnchor="middle"
        fill="#333"
        fontSize={12}
        fontWeight={600}
      >
        {lines.map((line, i) => (
          <tspan key={i} x={0} dy={i === 0 ? 0 : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}


type ChartRow = {
  label: string;
  baselinePct: number;
  filteredPct: number;
  filteredN: number;
};

export default function OverlayBarChart(props: {
  baseline: DistRow[];
  filtered: DistRow[];
  accent: string;
  showOverlay: boolean;
  showNOnBars: boolean;
}) {
  const { baseline, filtered, accent, showOverlay, showNOnBars } = props;

  const mapFiltered = new Map(filtered.map(r => [r.label, r]));
  const data: ChartRow[] = baseline.map(b => {
    const f = mapFiltered.get(b.label);
    return {
      label: b.label,
      baselinePct: Number(b.pct.toFixed(2)),
      filteredPct: Number((f?.pct ?? 0).toFixed(2)),
      filteredN: f?.count ?? 0
    };
  });
  const maxPct = Math.max(
    ...data.map(d => Math.max(d.baselinePct, d.filteredPct))
  );
  
  // Round up to a “nice” ceiling
  function niceCeiling(v: number) {
    if (v <= 10) return 10;
    if (v <= 20) return 20;
    if (v <= 30) return 30;
    if (v <= 40) return 40;
    if (v <= 50) return 50;
    if (v <= 60) return 60;
    if (v <= 75) return 75;
    return 100;
  }
  
  const yMax = niceCeiling(maxPct);
  
  return (
    <div style={{ width: "100%", height: 420 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
        <XAxis
          dataKey="label"
          interval={0}
          height={70}
          tick={<WrappedXAxisTick />}
        />

          <YAxis
            domain={[0, yMax]}
            ticks={Array.from(
              { length: yMax / 10 + 1 },
              (_, i) => i * 10
            )}
            tickFormatter={(v) => `${v}%`}
          />

          <Tooltip
            formatter={(value: any, name: any, item: any) => {
              if (name === "baselinePct") return [`${value}%`, "Baseline"];
              if (name === "filteredPct") return [`${value}%`, "Filtered"];
              return [value, name];
            }}
          />

          {/* Baseline (gray) */}
          <Bar dataKey="baselinePct" fill="#d1d5db" radius={[8, 8, 0, 0]} />

          {/* Filtered overlay (colored) */}
          {showOverlay && (
            <Bar dataKey="filteredPct" fill={accent} radius={[8, 8, 0, 0]}>
              {showNOnBars && (
                <LabelList
                  dataKey="filteredN"
                  position="top"
                  style={{ fontWeight: 800, fontSize: 12 }}
                />
              )}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
