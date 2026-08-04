import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="Opinny home">
      <span className="brand-mark"><span /></span>
      {!compact ? <span className="brand-word">opinny</span> : null}
    </Link>
  );
}
