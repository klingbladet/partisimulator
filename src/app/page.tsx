import { LayoutGrid, Mic, Target } from "lucide-react";
import Link from "next/link";
import AppNav from "@/components/shared/app-nav";
import PageContainer from "@/components/shared/page-container";
import PartyLauncher from "@/components/shared/party-launcher";
import SiteFooter from "@/components/shared/site-footer";

const MODES = [
  {
    description: "Fråga ett enskilt parti hur de ställer sig i en eller flera frågor.",
    href: "/direktfraga",
    Icon: Target,
    title: "Direktfråga",
  },
  {
    description: "Ställ en fråga och se hur alla åtta riksdagspartierna svarar parallellt.",
    href: "/alla-partier",
    Icon: LayoutGrid,
    title: "Alla partier",
  },
  {
    description: "Välj partier och låt dem debattera – styr talarordningen själv eller kör automatiskt.",
    href: "/debatt",
    Icon: Mic,
    title: "Debatt",
  },
];

export default function HomePage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)" }}>
      <AppNav />

      <PageContainer className="px-4 py-8">
        <section className="mb-10 text-center">
          <h1 className="font-black text-4xl text-[var(--color-ink)] leading-tight">
            Fråga riksdagspartierna vad de tycker
          </h1>
          <p className="mt-2 font-semibold text-gray-600">
            Välj hur du vill börja. Svaren bygger på partiernas egna valmanifest inför 2026.
          </p>
        </section>

        <section className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {MODES.map((mode) => (
            <Link className="cartoon-card flex flex-col items-start gap-3 p-6" href={mode.href} key={mode.href}>
              <mode.Icon aria-hidden="true" className="h-8 w-8" />
              <h2 className="font-black text-xl">{mode.title}</h2>
              <p className="font-semibold text-gray-600">{mode.description}</p>
            </Link>
          ))}
        </section>

        <PartyLauncher />
      </PageContainer>

      <SiteFooter />
    </div>
  );
}
