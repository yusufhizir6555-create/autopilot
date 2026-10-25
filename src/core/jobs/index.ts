import { runImport } from "./import";
import { runMatching } from "./match";

export const jobs = {
  import: runImport,
  match: runMatching,
  /** Import und anschließend Matching inkl. Bewerbung und Benachrichtigung */
  all: async () => ({ import: await runImport(), match: await runMatching() }),
} as const;

export type JobName = keyof typeof jobs;

export function isJobName(name: string): name is JobName {
  return name in jobs;
}
