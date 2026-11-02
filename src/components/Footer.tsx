import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line bg-sand-2/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-sm text-muted grid gap-2 sm:flex sm:items-center sm:justify-between">
        <p className="max-w-3xl">
          <strong className="text-ink">Not medical advice.</strong> Ingredient effects are tendencies, not guarantees. Patch
          test anything new. See a dermatologist for acne that is painful, scarring or does not settle. All products shown
          are fictional.
        </p>
        <p className="shrink-0">
          <Link href="/how#credits" className="underline underline-offset-4">
            Credits and sources
          </Link>
        </p>
      </div>
    </footer>
  );
}
