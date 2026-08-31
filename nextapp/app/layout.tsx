import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PartiSimulator 2026 🗳️ – Fråga riksdagspartierna",
  description:
    "Ställ frågor till AI-simulerade svenska partiledare inför valet 2026. Svaren grundas i partiernas valmanifest. En utbildningssimulering – ej verkliga citat.",
  keywords: "riksdag, val 2026, partiledare, AI, simulering, valmanifest, svenska partier",
  openGraph: {
    title: "PartiSimulator 2026 🗳️",
    description: "AI-simulerade svenska partiledare inför valet 2026",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        {children}
      </body>
    </html>
  );
}
