"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import AppNav from "@/components/shared/app-nav";
import PageContainer from "@/components/shared/page-container";
import SiteFooter from "@/components/shared/site-footer";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Catches render errors anywhere under the root layout - keeps the site's own chrome and footer notice instead of falling through to Next's default error screen. */
export default function ErrorPage({ error, reset }: ErrorPageProps): React.JSX.Element {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)" }}>
      <AppNav />

      <PageContainer className="flex flex-1 items-center justify-center px-4 py-8">
        <div
          className="cartoon-card flex max-w-md flex-col items-center gap-3 p-8 text-center"
          style={{ backgroundColor: "var(--color-error-bg)", borderColor: "var(--color-error-border)" }}
        >
          <AlertTriangle aria-hidden="true" className="h-10 w-10" style={{ color: "var(--color-error)" }} />
          <h1 className="font-black text-2xl text-[var(--color-ink)]">Något gick sönder</h1>
          <p className="font-semibold text-gray-600">
            Ett oväntat fel uppstod. Partierna vet inte riktigt vad som hände heller.
          </p>
          <div className="mt-2 flex gap-2">
            <button className="cartoon-btn cartoon-btn-primary" onClick={reset} type="button">
              Försök igen
            </button>
            <Link className="cartoon-btn cartoon-btn-ghost" href="/">
              Till startsidan
            </Link>
          </div>
        </div>
      </PageContainer>

      <SiteFooter />
    </div>
  );
}
