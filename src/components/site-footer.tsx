/** The single, global AI-simulation notice. Same design on every page, pinned to the bottom — never duplicated per answer. */
export default function SiteFooter(): React.JSX.Element {
  return (
    <footer
      className="relative z-10 w-full py-4 text-center"
      style={{ backgroundColor: "var(--color-cream)", borderTop: "3px solid var(--color-ink)" }}
    >
      <p className="font-semibold text-gray-500 text-sm">
        PartiSimulator 2026 – AI-simulering baserad på valmanifest. Ej officiell.
      </p>
    </footer>
  );
}
