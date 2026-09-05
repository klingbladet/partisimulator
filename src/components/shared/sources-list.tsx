import { FileText } from "lucide-react";

interface SourcesListProps {
  sources: string[];
  /** Shown in place of the list when there are no sources; omit to render nothing in that case. */
  emptyLabel?: string;
  className?: string;
}

/** One row per manifest source, shared by the chat/debate bubbles and the answer card footer. */
export default function SourcesList({
  sources,
  emptyLabel,
  className = "answer-bubble-source",
}: SourcesListProps): React.JSX.Element | null {
  if (sources.length === 0) {
    if (!emptyLabel) return null;
    return (
      <div className={className}>
        <FileText className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{emptyLabel}</span>
      </div>
    );
  }

  return (
    <>
      {sources.map((source) => (
        <div className={className} key={source}>
          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{source}</span>
        </div>
      ))}
    </>
  );
}
