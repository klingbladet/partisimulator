"use client";

import clsx from "clsx";
import { HelpCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import QuestionInput from "@/components/shared/question-input";

interface QuestionInputCardProps extends Omit<ComponentProps<typeof QuestionInput>, "labelId"> {
  className?: string;
  children?: ReactNode;
}

export default function QuestionInputCard({
  className,
  children,
  id = "question-input",
  ...questionInputProps
}: QuestionInputCardProps): React.JSX.Element {
  const headingId = `${id}-heading`;
  const { accentColor } = questionInputProps;

  return (
    <section
      className={clsx("cartoon-card p-6", className)}
      style={
        accentColor
          ? {
              backgroundColor: `color-mix(in srgb, ${accentColor} 10%, white)`,
              borderTopColor: accentColor,
              borderTopWidth: "6px",
            }
          : undefined
      }
    >
      <h2 className="mb-4 flex items-center gap-2 font-black text-lg" id={headingId}>
        <HelpCircle aria-hidden="true" className="h-5 w-5" />
        <span>Din fråga</span>
      </h2>

      <QuestionInput id={id} labelId={headingId} {...questionInputProps} />
      {children}
    </section>
  );
}
