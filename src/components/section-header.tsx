export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      {eyebrow ? <p className="text-xs uppercase tracking-[0.28em] text-indigo-300/80">{eyebrow}</p> : null}
      <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
      {description ? <p className="max-w-2xl text-sm leading-6 text-zinc-400">{description}</p> : null}
    </div>
  );
}
