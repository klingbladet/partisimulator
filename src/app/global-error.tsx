"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import "./globals.css";

interface GlobalErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Last-resort boundary for errors in the root layout itself, e.g. a font-loading failure.
 * Replaces layout.tsx entirely, so it renders its own <html>/<body> and re-imports globals.css.
 * Deliberately has no dependency on AppNav or other app components, to stay standing if those
 * are themselves implicated in the crash.
 */
export default function GlobalError({ error, reset }: GlobalErrorPageProps): React.JSX.Element {
  useEffect(() => {
    console.error("Unhandled root error:", error);
  }, [error]);

  return (
    <html lang="sv">
      <body className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <div
            className="cartoon-card flex max-w-md flex-col items-center gap-3 p-8 text-center"
            style={{ backgroundColor: "var(--color-error-bg)", borderColor: "var(--color-error-border)" }}
          >
            <AlertTriangle aria-hidden="true" className="h-10 w-10" style={{ color: "var(--color-error)" }} />
            <h1 className="font-black text-2xl text-[var(--color-ink)]">Något gick riktigt sönder</h1>
            <p className="font-semibold text-gray-600">
              Sidan kunde inte laddas. Ladda om, eller försök igen om en stund.
            </p>
            <button className="cartoon-btn cartoon-btn-primary mt-2" onClick={reset} type="button">
              Försök igen
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
