import type { Prisma } from "@prisma/client";
import { processNewMatch, type MatchOutcome } from "@/core/applications/service";
import { evaluate } from "@/core/matching/engine";
import { notifyUser } from "@/core/notifications/service";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { getVertical } from "@/verticals";

export type MatchStats = {
  profiles: number;
  evaluated: number;
  matches: number;
  sent: number;
  drafts: number;
  failed: number;
  notified: number;
  invalidProfiles: number;
};

/**
 * Bewertet alle noch nicht bewerteten Anzeigen gegen aktive Suchaufträge,
 * legt Bewerbungen an bzw. sendet sie und verschickt pro Suchauftrag eine Zusammenfassung.
 */
export async function runMatching(opts: { searchProfileId?: string } = {}): Promise<MatchStats> {
  const stats: MatchStats = { profiles: 0, evaluated: 0, matches: 0, sent: 0, drafts: 0, failed: 0, notified: 0, invalidProfiles: 0 };
  const profiles = await prisma.searchProfile.findMany({
    where: { active: true, ...(opts.searchProfileId ? { id: opts.searchProfileId } : {}) },
  });

  for (const profile of profiles) {
    stats.profiles++;
    const vertical = getVertical(profile.verticalKey);
    if (!vertical.criteriaSchema.safeParse(profile.criteria).success) {
      stats.invalidProfiles++;
      continue;
    }

    const listings = await prisma.listing.findMany({
      where: { verticalKey: profile.verticalKey, active: true, matches: { none: { searchProfileId: profile.id } } },
    });

    const newMatches: { match: { id: string; score: number }; listing: (typeof listings)[number] }[] = [];
    for (const listing of listings) {
      const parsed = vertical.listingDataSchema.safeParse(listing.data);
      if (!parsed.success) continue;
      const result = evaluate(vertical, profile.criteria, parsed.data, profile.scoreThreshold);
      stats.evaluated++;
      const match = await prisma.match.create({
        data: {
          searchProfileId: profile.id,
          listingId: listing.id,
          score: result.score,
          excluded: result.excluded,
          reasons: result.reasons as Prisma.InputJsonValue,
        },
      });
      if (result.isMatch) newMatches.push({ match, listing });
    }
    if (newMatches.length === 0) continue;

    newMatches.sort((a, b) => b.match.score - a.match.score);
    const outcomes: MatchOutcome[] = [];
    for (const { match, listing } of newMatches) {
      outcomes.push(await processNewMatch(profile, match, listing));
    }
    const sent = outcomes.filter((o) => o.result === "sent").length;
    const drafts = outcomes.filter((o) => o.result === "draft").length;
    const failed = outcomes.filter((o) => o.result === "failed").length;
    stats.matches += newMatches.length;
    stats.sent += sent;
    stats.drafts += drafts;
    stats.failed += failed;

    const lines = newMatches.slice(0, 10).map(
      ({ match, listing }) => `• ${listing.title} – ${match.score} % Übereinstimmung\n  ${appUrl(`/go/${listing.id}?p=notification`)}`,
    );
    const summary = [
      sent ? `${sent} Bewerbung(en) automatisch gesendet` : null,
      drafts ? `${drafts} Bewerbungsentwurf/-entwürfe warten auf dich` : null,
      failed ? `${failed} Bewerbung(en) fehlgeschlagen` : null,
    ].filter(Boolean);

    const delivered = await notifyUser(profile.userId, "new_matches", {
      subject: `${newMatches.length} neue passende ${vertical.itemLabel === "Wohnung" ? "Wohnungen" : "Treffer"} – ${profile.name}`,
      text: [
        `Für deinen Suchauftrag „${profile.name}“ gibt es ${newMatches.length} neue Treffer:`,
        "",
        ...lines,
        newMatches.length > 10 ? `… und ${newMatches.length - 10} weitere.` : "",
        "",
        summary.join("\n"),
        "",
        `Zum Dashboard: ${appUrl("/dashboard")}`,
      ].join("\n"),
    });
    if (delivered > 0) stats.notified++;
    await prisma.match.updateMany({
      where: { id: { in: newMatches.map((m) => m.match.id) } },
      data: { notifiedAt: new Date() },
    });
  }
  return stats;
}
