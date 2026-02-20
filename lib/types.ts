export type FilterDef = {
    id: string;
    label: string;
    column: string;
    type: "single_select" | "multi_select";
    ui?: { order_mode?: "alpha" | "custom"; order?: string[] };
    values?: { all_value?: string; yes_value?: string; no_value?: string };
  };
  
  export type QuestionDef = {
    id: string;
    is_default?: boolean;
    type: "single_select" | "multi_select";
    column: string;
    prompt: string;
    response?: {
      exclude_values?: Array<string | null>;
      order_mode?: "alpha" | "custom";
      order?: string[];
      label_overrides?: Record<string, string>;
    };
    chart?: {
      kind: "bar_distribution";
      show_baseline_gray?: boolean;
      overlay_filtered_color?: boolean;
      show_n_on_bars?: boolean;
      show_n_for?: "filtered_only" | "both";
      hide_overlay_if_filtered_n_lt?: number;
      hide_overlay_note?: string;
    };
  };
  
  export type TopicDef = {
    id: string;
    label: string;
    short_label?: string;
    question_set: QuestionDef[];
  };
  
  export type TopicConfig = {
    version: string;
    dataset: { id: string; label: string; notes?: string };
    filters: FilterDef[];
    topics: TopicDef[];
    ui_defaults?: {
      active_topic_id?: string;
      active_question_id_by_topic?: Record<string, string>;
    };
  };
  
  export type Respondent = Record<string, any>;
  
  export type FilterState = Record<
    string,
    { mode: "all" | "single" | "multi"; value?: string; values?: string[] }
  >;
  
  export type DistRow = {
    key: string;       // raw value
    label: string;     // display
    pct: number;       // 0..100
    count: number;     // n in this bar
  };
  