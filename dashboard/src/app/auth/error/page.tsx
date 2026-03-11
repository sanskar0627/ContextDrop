interface AuthErrorPageProps {
  searchParams: Promise<{ message?: string }>;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const resolved = await searchParams;
  const message = resolved.message || "Authentication failed.";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 max-w-lg">
        <h1 className="text-xl font-bold text-red-800">Sign-in error</h1>
        <p className="text-sm text-red-700 mt-2">{message}</p>
      </section>
    </main>
  );
}
