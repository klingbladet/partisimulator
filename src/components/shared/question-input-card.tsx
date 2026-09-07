"use client";

import clsx from "clsx";
import { HelpCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import QuestionInput from "@/components/shared/question-input";

interface QuestionInputCardProps extends ComponentProps<typeof QuestionInput> {
  className?: string;
  children?: ReactNode;
}

export default function QuestionInputCard({
  className,
  children,
  ...questionInputProps
}: QuestionInputCardProps): React.JSX.Element {
  return (
    <section className={clsx("cartoon-card p-6", className)}>
      <h2 className="mb-4 flex items-center gap-2 font-black text-lg">
        <HelpCircle className="h-5 w-5" />
        <span>Din fråga</span>
      </h2>

      <QuestionInput {...questionInputProps} />
      {children}
    </section>
  );
}
