"use client";

import { useRouter } from "next/navigation";
import PartyChip from "@/components/shared/party-chip";
import { PARTIES } from "@/lib/parties";

export default function PartyLauncher(): React.JSX.Element {
  const router = useRouter();

  return (
    <section>
      <h2 className="mb-1 font-black text-xl">Eller hoppa rakt in hos ett parti</h2>
      <p className="mb-4 font-semibold text-gray-600">Klicka på ett parti och börja chatta direkt.</p>

      <div className="party-grid">
        {PARTIES.map((party) => (
          <PartyChip
            key={party.id}
            onClick={() => router.push(`/direktfraga?party=${party.id}`)}
            party={party}
            selected={false}
          />
        ))}
      </div>
    </section>
  );
}
