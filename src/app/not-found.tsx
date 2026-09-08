import { Ghost } from "lucide-react";
import Link from "next/link";
import AppNav from "@/components/shared/app-nav";
import PageContainer from "@/components/shared/page-container";
import SiteFooter from "@/components/shared/site-footer";

/** Shown for any unmatched route. */
export default function NotFound(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)" }}>
      <AppNav />

      <PageContainer className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="cartoon-card flex max-w-md flex-col items-center gap-3 p-8 text-center">
          <Ghost aria-hidden="true" className="h-10 w-10 text-[var(--color-ink)]" />
          <h1 className="font-black text-2xl text-[var(--color-ink)]">Sidan finns inte</h1>
          <p className="font-semibold text-gray-600">
            Här spökar det bara. Sidan du sökte finns inte, eller så har den flyttat.
          </p>
          <Link className="cartoon-btn cartoon-btn-primary mt-2" href="/">
            Till startsidan
          </Link>
        </div>
      </PageContainer>

      <SiteFooter />
    </div>
  );
}
