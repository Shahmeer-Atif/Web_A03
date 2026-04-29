// Landing page placeholder. Once auth lands in Phase 2, this route will
// redirect signed-in users to /admin or /agent based on role, and send
// guests to /login. For now it just confirms the scaffold is alive.

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-full bg-emerald-500/10 px-4 py-1 text-xs font-medium uppercase tracking-wider text-emerald-700">
          Phase 1 — Scaffold ready
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Property Dealer CRM
        </h1>
        <p className="max-w-md text-sm text-zinc-600">
          A Level&nbsp;3 lead-management system for property dealers in Pakistan —
          built on Next.js, MongoDB, and Socket.io.
        </p>
      </div>

      <div className="flex flex-col items-center gap-1 text-xs text-zinc-500">
        <span>Auth, leads, scoring, real-time, analytics — wired up next.</span>
        <span className="font-mono">{`npm run dev → http://localhost:3000`}</span>
      </div>
    </main>
  );
}
