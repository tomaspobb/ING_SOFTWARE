// middleware.ts (en la raíz del proyecto)
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/apuntes/:path*",   // listado + detalle
    "/ranking/:path*",
    "/api/admin/:path*",
  ],
};
