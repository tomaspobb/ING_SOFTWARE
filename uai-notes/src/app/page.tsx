// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Root() {
  redirect("/auth"); // nunca se renderiza /, siempre va a /auth
}
