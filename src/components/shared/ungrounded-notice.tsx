"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import InfoDialog from "@/components/shared/info-dialog";

interface UngroundedNoticeProps {
  className?: string;
}

/**
 * Shown in place of a source list when retrieveContext found nothing to cite - the warning itself
 * stays inline so it's seen without a click; "Läs varför" opens the RAG explanation for anyone who
 * wants the full picture.
 */
export default function UngroundedNotice({
  className = "answer-bubble-source",
}: UngroundedNoticeProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={className}>
        <FileText aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          Ingen källa finns - svaret är gissat.{" "}
          <button className="underline" onClick={() => setOpen(true)} type="button">
            Läs varför
          </button>
        </span>
      </div>
      <InfoDialog onClose={() => setOpen(false)} open={open} title="Varför saknas en källa?">
        <p>
          Vi har vektoriserat varje partis valmanifest. Modellerna använder RAG (Retrieval Augmented Generation) för att
          hämta rätt utdrag ur manifestet och grunda sina svar i det.
        </p>
        <p className="mt-2">Ibland hittar sökningen ingen träff i manifestet. Då svarar modellen istället utifrån:</p>
        <ul className="mt-2 list-disc space-y-1 ps-5">
          <li>En personlighet och riktlinjer som vi (appens skapare) har gett den</li>
          <li>Sitt eget bias</li>
        </ul>
        <p className="mt-2 font-bold text-black">Du ska därför inte lita på svaret. Läs partiets manifest själv.</p>
      </InfoDialog>
    </>
  );
}
