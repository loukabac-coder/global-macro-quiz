import Link from "next/link";

// Fil d'Ariane : "Cours › Chiffres du jour". Le dernier élément n'est pas un lien.
export default function Crumbs({ items }: { items: [string, string?][] }) {
  return (
    <nav aria-label="Fil d’Ariane" className="mb-4 font-mono text-xs text-muted">
      {items.map(([label, href], i) => (
        <span key={label}>
          {i > 0 && <span className="mx-2">›</span>}
          {href ? (
            <Link href={href} className="hover:text-fg">
              {label}
            </Link>
          ) : (
            <span className="text-fg">{label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
