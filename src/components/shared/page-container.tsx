interface PageContainerProps {
  children: React.ReactNode;
  /** Padding classes are each page's own choice - only the width is shared, so pass e.g. "px-4 py-8" here. */
  className?: string;
}

/** Shared content width for every page's <main>, matching AppNav's own max-w-6xl so the nav bar and page content align. */
export default function PageContainer({ children, className = "" }: PageContainerProps): React.JSX.Element {
  return <main className={`mx-auto w-full max-w-6xl flex-1 ${className}`.trim()}>{children}</main>;
}
