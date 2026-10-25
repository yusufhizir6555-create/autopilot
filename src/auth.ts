import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import NextAuth from "next-auth";
import { redirect } from "next/navigation";
import { sendEmail } from "@/core/notifications/channels/email";
import { prisma } from "@/lib/db";
import { adminEmails } from "@/lib/env";

declare module "next-auth" {
  interface Session {
    user: { id: string; email: string; name?: string | null; role: Role };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  pages: { signIn: "/login", verifyRequest: "/login/pruefen" },
  providers: [
    {
      id: "email",
      type: "email",
      name: "E-Mail",
      from: process.env.EMAIL_FROM ?? "no-reply@example.com",
      maxAge: 24 * 60 * 60,
      options: {},
      async sendVerificationRequest({ identifier, url }) {
        await sendEmail(identifier, {
          subject: "Dein Anmeldelink",
          text: `Hallo,\n\nmit diesem Link meldest du dich an (24 Stunden gültig):\n\n${url}\n\nWenn du das nicht angefordert hast, ignoriere diese E-Mail.`,
        });
      },
    },
  ],
  events: {
    async createUser({ user }) {
      if (!user.id || !user.email) return;
      const isAdmin = adminEmails().includes(user.email.toLowerCase());
      await prisma.user.update({ where: { id: user.id }, data: { role: isAdmin ? "ADMIN" : "USER" } });
      // E-Mail ist vorausgefüllt, aber erst nach ausdrücklichem Opt-in aktiv.
      await prisma.notificationPreference.create({
        data: { userId: user.id, channel: "EMAIL", destination: user.email, enabled: false },
      });
    },
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = (user as { role?: Role }).role ?? "USER";
      return session;
    },
  },
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
