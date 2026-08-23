
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#07080a] text-white p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-neutral-400 mb-6">The requested lecture or resource does not exist.</p>
      <a
        href="/"
        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold tracking-tight transition-colors text-white"
      >
        Return to Home
      </a>
    </main>
  );
}

