import { isJobName, jobs } from "@/core/jobs";
import { prisma } from "@/lib/db";

const name = process.argv[2] ?? "all";

async function main() {
  if (!isJobName(name)) {
    console.error(`Unbekannter Job "${name}". Verfügbar: ${Object.keys(jobs).join(", ")}`);
    process.exit(1);
  }
  const result = await jobs[name]();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
