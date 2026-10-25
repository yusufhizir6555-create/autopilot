import type { AnyVertical, ScoreResult } from "@/core/verticals/types";

export type Evaluation = ScoreResult & { isMatch: boolean };

/** Reine Funktion: prüft Kriterien und Anzeige gegen das Vertical und bewertet sie. */
export function evaluate(
  vertical: AnyVertical,
  criteriaJson: unknown,
  listingJson: unknown,
  threshold: number,
): Evaluation {
  const criteria = vertical.criteriaSchema.parse(criteriaJson);
  const listing = vertical.listingDataSchema.parse(listingJson);
  const result = vertical.score(criteria, listing);
  const score = Math.max(0, Math.min(100, Math.round(result.score)));
  return { ...result, score, isMatch: isMatch(score, result.excluded, threshold) };
}

export function isMatch(score: number, excluded: boolean, threshold: number): boolean {
  return !excluded && score >= threshold;
}
