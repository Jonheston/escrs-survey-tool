import type { TopicConfig } from "./types";

export async function loadConfig(path: string): Promise<TopicConfig> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load config: ${path}`);
  return (await res.json()) as TopicConfig;
}
