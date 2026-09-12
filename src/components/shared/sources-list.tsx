import { FileText } from "lucide-react";
import UngroundedNotice from "@/components/shared/ungrounded-notice";

interface SourcesListProps {
  sources: string[];
  className?: string;
}

/** One row per manifest source, shared by the chat/debate bubbles and the answer card footer. */
export default function SourcesList({
  sources,
  className = "answer-bubble-source",
}: SourcesListProps): React.JSX.Element {
  if (sources.length === 0) {
    return <UngroundedNotice className={className} />;
  }

  return (
    <>
      {sources.map((source) => (
        <div className={className} key={source}>
          <FileText aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{source}</span>
        </div>
      ))}
    </>
  );
}
