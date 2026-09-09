export function MissingAssetIcon({ label }: { label: string }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-white/15 bg-black/35 px-2 text-center text-[10px] font-medium uppercase tracking-wide text-zinc-500"
      aria-label={`${label} icon missing`}
    >
      No icon
    </div>
  );
}
