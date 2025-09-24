import type { Metadata } from "next";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Script from "next/script";

import Providers from "@/components/Providers";
import { EditorModeProvider } from "@/components/EditorModeProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Notivium",
  description: "Plataforma de apuntes colaborativos UAI",
  themeColor: "#3b82f6",
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Fuentes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* Bootstrap Icons */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
        />

        {/* Tipografía global */}
        <style>{`
          body {
            font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
        `}</style>
      </head>

      {/* Usa variables de tu tema (globals.css) */}
      <body className="bg-light text-dark" data-bs-theme="light">
        <Providers>
          <EditorModeProvider>
            {/* La Navbar se oculta sola en el home sin sesión (lógica dentro del componente) */}
            <Navbar />
            <main>{children}</main>
            <Footer />
          </EditorModeProvider>
        </Providers>

        {/* Bootstrap JS (solo una vez) */}
        <Script
          id="bootstrap-bundle"
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
  
}
