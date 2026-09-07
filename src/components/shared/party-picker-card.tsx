"use client";

import clsx from "clsx";
import { Users } from "lucide-react";
import type { ReactNode } from "react";
import PartyChip from "@/components/shared/party-chip";
import { PARTIES } from "@/lib/parties";
import type { PartyPersona } from "@/types/party";

interface PartyPickerCardProps {
  heading: string;
  isSelected: (party: PartyPersona) => boolean;
  onSelectParty: (party: PartyPersona) => void;
  className?: string;
  children?: ReactNode;
}

export default function PartyPickerCard({
  heading,
  isSelected,
  onSelectParty,
  className,
  children,
}: PartyPickerCardProps): React.JSX.Element {
  return (
    <section className={clsx("cartoon-card p-6", className)}>
      <h2 className="mb-4 flex items-center gap-2 font-black text-lg">
        <Users aria-hidden="true" className="h-5 w-5" />
        <span>{heading}</span>
      </h2>

      <div className="party-grid">
        {PARTIES.map((party) => (
          <PartyChip
            key={party.id}
            onClick={() => onSelectParty(party)}
            party={party}
            selected={isSelected(party)}
            size="md"
          />
        ))}
      </div>

      {children}
    </section>
  );
}
