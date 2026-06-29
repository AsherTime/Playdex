export function TopSearch() {
  return (
    <form className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-2">
      <input
        placeholder="Search games, streamers, news, updates"
        className="h-12 w-full rounded-2xl bg-transparent px-4 text-sm text-white outline-none placeholder:text-zinc-500"
      />
    </form>
  );
}
