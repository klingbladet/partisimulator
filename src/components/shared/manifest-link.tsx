import { FileText } from "lucide-react";

interface ManifestLinkProps {
  href: string;
  className?: string;
}

/** Link to a party's full manifesto PDF, styled like SourcesList's citation chips — shown as the fallback when no answer could be generated. */
export default function ManifestLink({
  href,
  className = "answer-bubble-source",
}: ManifestLinkProps): React.JSX.Element {
  return (
    <a className={`${className} no-underline hover:underline`} href={href} rel="noopener noreferrer" target="_blank">
      <FileText aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />
      <span>Läs valmanifestet (PDF)</span>
    </a>
  );
}
