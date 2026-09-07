interface PageHeaderProps {
  title: string;
  description: string;
}

export default function PageHeader({ title, description }: PageHeaderProps): React.JSX.Element {
  return (
    <div className="mb-8">
      <h1 className="font-black text-3xl text-[var(--color-ink)] leading-tight">{title}</h1>
      <p className="mt-1 font-semibold text-gray-600">{description}</p>
    </div>
  );
}
