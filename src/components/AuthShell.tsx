import Link from "next/link";

export const inputClass =
  "w-full border border-line bg-panel px-3 py-2.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none";

export const buttonClass =
  "w-full bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110 disabled:opacity-60";

export function Notice({ kind, children }: { kind: "error" | "ok"; children: React.ReactNode }) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`border-l-2 bg-panel px-3 py-2.5 text-sm leading-relaxed ${
        kind === "error" ? "border-danger" : "border-accent"
      }`}
    >
      {children}
    </div>
  );
}

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center px-5 py-4">
          <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
            global<span className="text-accent">/</span>macro<span className="text-accent">/</span>quiz
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
