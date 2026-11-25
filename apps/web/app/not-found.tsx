import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-8">
      <h1 className="text-h2">Page not found</h1>
      <p className="text-body text-text-muted">The page you are looking for does not exist or has moved.</p>
      <Link href="/" className="text-primary underline">
        Go to home
      </Link>
    </main>
  );
}
