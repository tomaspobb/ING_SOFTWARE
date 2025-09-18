"use client";
import { signIn } from "next-auth/react";

export default function SignInButton({
  label = "Ingresar con Microsoft",
  size = "sm",
  block = false,
}: {
  label?: string;
  size?: "sm" | "lg";
  block?: boolean;
}) {
  const cls = [
    "btn btn-primary",
    size === "lg" ? "btn-lg" : "btn-sm",
    block ? "w-100" : "",
  ].join(" ");

  return (
    <button
      className={cls}
      onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
    >
      {label}
    </button>
  );
}
