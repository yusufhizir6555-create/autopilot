"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import { runImport } from "@/core/jobs/import";
import { runMatching } from "@/core/jobs/match";

export async function adminRunJobs(): Promise<void> {
  await requireAdmin();
  await runImport();
  await runMatching();
  revalidatePath("/admin");
}
