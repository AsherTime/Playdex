export function SearchBar() {
  return (
    <form action="/trending" className="flex flex-col gap-3 sm:flex-row">
      <input
        name="q"
        placeholder="Search games, genres, or platforms"
        className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-cyan-300/40"
      />
      <button className="h-12 rounded-2xl bg-cyan-300 px-5 text-sm font-medium text-zinc-950 transition hover:bg-cyan-200">
        Search games
      </button>
    </form>
  );
}
