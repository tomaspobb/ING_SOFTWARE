// src/app/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import GateHero from "@/components/GateHero";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/apuntes"); // autenticado → a /apuntes
  return <GateHero />;               // sin sesión → landing (no /api/auth/signin)
}
