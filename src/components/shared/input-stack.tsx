import clsx from "clsx";
import type { ReactNode } from "react";

interface InputStackProps {
  className?: string;
  children: ReactNode;
}

/** The vertical spacing between an input and the button(s) directly under it — one place to define it, so it can't drift between input areas. */
export default function InputStack({ className, children }: InputStackProps): React.JSX.Element {
  return <div className={clsx("flex flex-col gap-2", className)}>{children}</div>;
}
