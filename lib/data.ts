import type { Respondent } from "./types";

export async function loadRespondents(path: string): Promise<Respondent[]> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load respondents: ${path}`);
  return (await res.json()) as Respondent[];
}
