import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function getOptionalSession() {
  try {
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}

export function isAdminSession(session: any) {
  return Boolean(session?.isAdmin);
}
