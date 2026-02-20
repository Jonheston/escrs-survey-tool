type TopicTab = { id: string; label: string };

export default function TopicTabs(props: {
  topics: TopicTab[];
  activeTopicId: string;
  onChange: (id: string) => void;
  accent: string;
}) {
  const { topics, activeTopicId, onChange, accent } = props;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {topics.map(t => {
        const active = t.id === activeTopicId;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              border: active ? `2px solid ${accent}` : "1px solid #ddd",
              background: active ? "rgba(0,0,0,0.02)" : "white",
              color: "#111",
              padding: "10px 12px",
              borderRadius: 999,
              cursor: "pointer",
              fontWeight: 800
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
