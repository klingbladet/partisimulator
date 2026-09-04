import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
});

export const metadata: Metadata = {
  description:
    "Ställ frågor till AI-simulerade svenska partiledare inför valet 2026. Svaren grundas i partiernas valmanifest. En utbildningssimulering - ej verkliga citat.",
  keywords: "riksdag, val 2026, partiledare, AI, simulering, valmanifest, svenska partier",
  openGraph: {
    description: "AI-simulerade svenska partiledare inför valet 2026",
    title: "PartiSimulator 2026",
    type: "website",
  },
  robots: {
    follow: false,
    index: false,
    noarchive: true,
    nocache: true,
    noimageindex: true,
    nosnippet: true,
  },
  title: "PartiSimulator 2026 - Fråga riksdagspartierna",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="sv">
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect" />
      </head>
      <body className={`min-h-screen ${instrumentSerif.variable}`} style={{ backgroundColor: "var(--background)" }}>
        {children}
      </body>
    </html>
  );
}
