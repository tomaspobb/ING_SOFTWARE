// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

const DEMO_ALLOW_ANY =
  (process.env.DEMO_ALLOW_ANY ?? "false").toLowerCase().trim() === "true";

const envDomains = (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

const ALLOWED_DOMAINS = envDomains.length
  ? envDomains
  : ["alumnos.uai.cl", "uai.cl"]; // fallback cuando no hay demo

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function extractEmail(profile: any, token?: any, account?: any): string | undefined {
  return (
    profile?.email ??
    profile?.preferred_username ??
    profile?.upn ??
    token?.email ??
    account?.email
  );
}

export const authOptions: NextAuthOptions = {
  debug: false,

  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      // SIN tenantId => multitenant (si quieres forzar uno, agrega tenantId)
      authorization: { params: { prompt: "select_account" } },
    }),
  ],

  session: { strategy: "jwt" },

  // 👉 MUY IMPORTANTE: cuando NextAuth necesite “pantalla de login”, te manda a "/"
  pages: {
    signIn: "/",          // tu GateHero
    error: "/auth/error", // opcional, deja tu página de error si la tienes
  },

  callbacks: {
    async signIn({ profile, account }) {
      const email = extractEmail(profile, undefined, account);
      if (!email) return `${BASE_URL}/auth/error?error=NoEmailFromProvider`;

      const lower = email.toLowerCase();
      const domain = lower.split("@")[1];

      if (!DEMO_ALLOW_ANY) {
        const allowed = !!domain && ALLOWED_DOMAINS.includes(domain);
        if (!allowed) return `${BASE_URL}/auth/error?error=DomainNotAllowed`;
      }
      return true;
    },

    async jwt({ token, account, profile }) {
      if (account) token.provider = account.provider;
      if (profile) {
        const mail = extractEmail(profile, token, account);
        if (mail) token.email = mail.toLowerCase();
        token.name = (profile as any).name ?? token.name;
      }
      (token as any).isAdmin = token?.email
        ? ADMIN_EMAILS.includes((token.email as string).toLowerCase())
        : false;
      return token;
    },

    async session({ session, token }) {
      (session as any).provider = (token as any).provider;
      if (token?.email) session.user!.email = token.email as string;
      (session as any).isAdmin = Boolean((token as any).isAdmin);
      return session;
    },
  },
};
