import type { Listing, SearchProfile } from "@prisma/client";
import { notifyUser } from "@/core/notifications/service";
import type { AnyVertical } from "@/core/verticals/types";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { getSource, getVertical } from "@/verticals";
import { decideAutoApply, renderTemplate, startOfToday, type DraftReason } from "./rules";

export type MatchOutcome = { result: "sent" | "failed" | "skipped" } | { result: "draft"; reason: DraftReason };

function buildCoverLetter(vertical: AnyVertical, template: string, profileData: unknown, listing: Listing): string {
  const profile = vertical.profileSchema.parse(profileData);
  const data = vertical.listingDataSchema.parse(listing.data);
  return renderTemplate(template || vertical.defaultCoverLetter, {
    titel: listing.title,
    ...vertical.coverLetterContext(profile, data),
  }).replace(/\n{3,}/g, "\n\n");
}

/** Legt für einen neuen Treffer eine Bewerbung an und sendet sie, wenn die Regeln es erlauben. */
export async function processNewMatch(
  profile: SearchProfile,
  match: { id: string },
  listing: Listing,
): Promise<MatchOutcome> {
  const vertical = getVertical(profile.verticalKey);
  const source = getSource(listing.sourceKey);
  const [existing, applicant, sentToday] = await Promise.all([
    prisma.application.findUnique({ where: { userId_listingId: { userId: profile.userId, listingId: listing.id } } }),
    prisma.applicantProfile.findUnique({
      where: { userId_verticalKey: { userId: profile.userId, verticalKey: profile.verticalKey } },
    }),
    prisma.application.count({
      where: { searchProfileId: profile.id, mode: "AUTO", status: "SENT", sentAt: { gte: startOfToday() } },
    }),
  ]);
  const profileComplete = applicant !== null && vertical.profileSchema.safeParse(applicant.data).success;

  const decision = decideAutoApply({
    autoApply: profile.autoApply,
    consentAt: profile.autoApplyConsentAt,
    sourceSupportsApply: typeof source?.submitApplication === "function",
    profileComplete,
    sentToday,
    dailyLimit: profile.dailyApplyLimit,
    alreadyApplied: existing !== null,
  });
  if (decision.action === "skip") return { result: "skipped" };

  const coverLetter = profileComplete
    ? buildCoverLetter(vertical, applicant!.coverLetterTemplate, applicant!.data, listing)
    : "";
  const application = await prisma.application.create({
    data: {
      userId: profile.userId,
      listingId: listing.id,
      searchProfileId: profile.id,
      matchId: match.id,
      mode: decision.action === "send" ? "AUTO" : "MANUAL",
      coverLetter,
    },
  });

  if (decision.action === "draft") return { result: "draft", reason: decision.reason };
  const sent = await sendApplication(application.id, { notifyOnFailure: false });
  return { result: sent ? "sent" : "failed" };
}

/** Sendet eine Bewerbung über den Quellen-Adapter. Liefert false bei Fehler (Status FAILED). */
export async function sendApplication(applicationId: string, opts: { notifyOnFailure?: boolean } = {}): Promise<boolean> {
  const app = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { listing: true, user: { include: { documents: true } } },
  });
  const vertical = getVertical(app.listing.verticalKey);
  const source = getSource(app.listing.sourceKey);
  const applicant = await prisma.applicantProfile.findUnique({
    where: { userId_verticalKey: { userId: app.userId, verticalKey: vertical.key } },
  });

  try {
    if (!source?.submitApplication) throw new Error("Dieser Anbieter nimmt keine direkten Bewerbungen an.");
    if (!applicant) throw new Error("Bewerbungsprofil fehlt.");
    const profile = vertical.profileSchema.parse(applicant.data) as { firstName?: string; lastName?: string; phone?: string };
    const coverLetter = app.coverLetter || buildCoverLetter(vertical, applicant.coverLetterTemplate, applicant.data, app.listing);

    const { externalRef } = await source.submitApplication({
      externalListingId: app.listing.externalId,
      applicant: {
        name: [profile.firstName, profile.lastName].filter(Boolean).join(" ") || app.user.email,
        email: app.user.email,
        phone: profile.phone,
      },
      coverLetter,
      profile: applicant.data,
      documents: app.user.documents.map((d) => ({ kind: d.kind, filename: d.filename, mimeType: d.mimeType })),
    });
    await prisma.application.update({
      where: { id: app.id },
      data: { status: "SENT", sentAt: new Date(), externalRef, error: null, coverLetter },
    });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.application.update({ where: { id: app.id }, data: { status: "FAILED", error: message } });
    if (opts.notifyOnFailure ?? true) {
      await notifyUser(app.userId, "application_failed", {
        subject: `Bewerbung fehlgeschlagen: ${app.listing.title}`,
        text: `Deine Bewerbung für „${app.listing.title}“ konnte nicht gesendet werden.\nGrund: ${message}\n\nDetails: ${appUrl("/dashboard")}`,
      });
    }
    return false;
  }
}
