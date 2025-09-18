// src/app/auth/error/page.tsx  (SIN "use client")
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";

export default function AuthError({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const err = Array.isArray(searchParams?.error)
    ? searchParams.error[0]
    : searchParams?.error;

  const messages: Record<string, { title: string; subtitle: string }> = {
    DomainNotAllowed: {
      title: "Correo no permitido",
      subtitle:
        "Tu correo no pertenece a la UAI. Inicia sesión con un email @alumnos.uai.cl (o @uai.cl).",
    },
    StudentsOnly: {
      title: "Solo alumnos UAI",
      subtitle: "Por ahora, únicamente aceptamos cuentas @alumnos.uai.cl.",
    },
    NoEmailFromProvider: {
      title: "No recibimos tu correo",
      subtitle:
        "Microsoft no envió tu email. Prueba nuevamente o usa una cuenta UAI válida.",
    },
    OAuthSignin: {
      title: "No pudimos iniciar sesión",
      subtitle: "Ocurrió un problema al contactar a Microsoft. Intenta de nuevo.",
    },
    OAuthCallback: {
      title: "Error en el callback",
      subtitle: "Falló el retorno desde Microsoft. Vuelve a intentarlo.",
    },
  };

  const data =
    (err && messages[err]) || {
      title: "Ocurrió un error al iniciar sesión",
      subtitle: "Por favor, vuelve al inicio e inténtalo nuevamente.",
    };

  return (
    <>
      <Navbar />
      <EmptyState
        icon="bi-shield-lock-fill"
        title="Problema al iniciar sesión"
        subtitle={`${data.title}. ${data.subtitle}`}
        action={<a href="/" className="btn btn-primary btn-lg">Volver al inicio</a>}
      />
      <div className="container text-center text-secondary small pb-4">
        Código: <b>{err ?? "desconocido"}</b>
      </div>
      <Footer />
    </>
  );
}
