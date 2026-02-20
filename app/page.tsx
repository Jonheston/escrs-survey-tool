"use client";

import TopicTabs from "../components/TopicTabs";
import FiltersPanel from "../components/FiltersPanel";
import OverlayBarChart from "../components/OverlayBarChart";
import { useEffect, useMemo, useRef, useState } from "react";


import { loadConfig } from "../lib/config";
import { loadRespondents } from "../lib/data";
import { applyFilters, buildDistributions } from "../lib/aggregate";
import { parseUrlState, toQueryString } from "../lib/urlState";
import { exportChartPng } from "../lib/exportPng";


import type { TopicConfig, Respondent, FilterState } from "@/lib/types";

export default function Page() {
  const [config, setConfig] = useState<TopicConfig | null>(null);
  const [respondents, setRespondents] = useState<Respondent[] | null>(null);

  const [activeTopicId, setActiveTopicId] = useState<string>("");
  const [filters, setFilters] = useState<FilterState>({});

  const chartRef = useRef<HTMLDivElement | null>(null);

  // Load config + data
  useEffect(() => {
    (async () => {
      const basePath = process.env.NODE_ENV === 'production' ? '/escrs-survey-tool' : '';
      const cfg = await loadConfig(`${basePath}/data/topic_config.json`);
      const rows = await loadRespondents(`${basePath}/data/respondents.min.json`);

      // URL -> initial state, else config defaults
      const urlState = parseUrlState(window.location.search);
      const initialTopic = urlState.topic ?? cfg.ui_defaults?.active_topic_id ?? cfg.topics[0]?.id ?? "";
      const initialFilters = urlState.filters ?? {};

      setConfig(cfg);
      setRespondents(rows);
      setActiveTopicId(initialTopic);
      setFilters(initialFilters);
    })();
  }, []);

  // Keep URL in sync
  useEffect(() => {
    if (!config) return;
    if (!activeTopicId) return;

    const qs = toQueryString({ topic: activeTopicId, filters });
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    window.history.replaceState({}, "", newUrl);
  }, [activeTopicId, filters, config]);

  const activeTopic = useMemo(() => {
    if (!config) return null;
    return config.topics.find(t => t.id === activeTopicId) ?? config.topics[0] ?? null;
  }, [config, activeTopicId]);

  const activeQuestion = useMemo(() => {
    if (!activeTopic) return null;
    // MVP: first default question
    return activeTopic.question_set.find(q => q.is_default) ?? activeTopic.question_set[0] ?? null;
  }, [activeTopic]);

  const { baseline, filtered, filteredTotalN, overlayHidden } = useMemo(() => {
    if (!config || !respondents || !activeQuestion) {
      return { baseline: [], filtered: [], filteredTotalN: 0, overlayHidden: false };
    }

    // Baseline set: anyone with a non-blank answer for the active question
    const baselineRows = respondents.filter(r => {
      const v = r[activeQuestion.column];
      return v !== undefined && v !== null && String(v).trim() !== "";
    });

    // Filtered set: apply filters, then also require non-blank answer for the active question
    const filteredRows = applyFilters(baselineRows, config.filters, filters).filter(r => {
      const v = r[activeQuestion.column];
      return v !== undefined && v !== null && String(v).trim() !== "";
    });

    const order = activeQuestion.response?.order ?? [];
    const dists = buildDistributions({
      baselineRows,
      filteredRows,
      questionColumn: activeQuestion.column,
      optionOrder: order,
    });

    const hideThreshold = activeQuestion.chart?.hide_overlay_if_filtered_n_lt ?? 10;
    const shouldHide = filteredRows.length < hideThreshold;

    return {
      baseline: dists.baseline,
      filtered: dists.filtered,
      filteredTotalN: filteredRows.length,
      overlayHidden: shouldHide
    };
  }, [config, respondents, activeQuestion, filters]);

  const accent = useMemo(() => {
    // Color later. For now: simple per-topic fallback hues
    // You can replace this with config topics colors when ready.
    const fallback = {
      phaco: "#2563eb",
      presbyopia: "#7c3aed",
      astigmatism: "#0ea5e9",
      refractive_surgery: "#10b981",
      ocular_surface: "#f59e0b",
      glaucoma: "#ef4444",
      retina: "#8b5cf6",
    } as Record<string, string>;
    return fallback[activeTopicId] ?? "#2563eb";
  }, [activeTopicId]);

  if (!config || !respondents || !activeTopic || !activeQuestion) {
    return <div style={{ padding: 24 }}>Loading…</div>;
    }

  const title = activeQuestion.prompt;

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>ESCRS Clinical Trends Survey 2025</div>
          <div style={{ color: "#666", marginTop: 4, fontSize: 13 }}>
            Blank responses excluded. Overlay hidden when filtered n &lt; 10.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={async () => {
              if (!chartRef.current) return;
              await exportChartPng(chartRef.current, `escrs_${activeTopicId}.png`);
            }}
            style={{
              background: accent,
              color: "white",
              border: "none",
              padding: "10px 12px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Download PNG
          </button>

          <button
            onClick={async () => {
              const url = window.location.href;
              await navigator.clipboard.writeText(url);
              alert("Share link copied!");
            }}
            style={{
              background: "white",
              color: "#111",
              border: "1px solid #ddd",
              padding: "10px 12px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Copy share link
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <TopicTabs
          topics={config.topics.map(t => ({ id: t.id, label: t.label }))}
          activeTopicId={activeTopicId}
          onChange={setActiveTopicId}
          accent={accent}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, marginTop: 16 }}>
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 14,
            padding: 14,
            background: "#fff"
          }}
        >
          <FiltersPanel
            configFilters={config.filters}
            respondents={respondents}
            filters={filters}
            setFilters={setFilters}
            accent={accent}
          />
        </div>

        <div
          ref={chartRef}
          style={{
            border: "1px solid #eee",
            borderRadius: 14,
            padding: 14,
            background: "#fff"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              Baseline n={baseline.reduce((a, b) => a + b.count, 0)} • Filtered n={filteredTotalN}
            </div>
          </div>

          {overlayHidden && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", fontWeight: 700 }}>
              {activeQuestion.chart?.hide_overlay_note ?? "Filtered results hidden (n < 10). Baseline shown in gray."}
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <OverlayBarChart
              baseline={baseline}
              filtered={filtered}
              accent={accent}
              showOverlay={!overlayHidden}
              showNOnBars={true}
            />
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
            Gray bars show overall distribution (baseline). Colored overlay shows filtered distribution. Counts shown above colored bars only.
          </div>
        </div>
      </div>
    </div>
  );
}
