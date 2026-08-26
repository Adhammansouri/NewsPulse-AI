import type { ReactNode } from "react";

type ToolShellProps = {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function ToolShell({ badge, title, description, children }: ToolShellProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-2xl">
        <span className="nd-tag">{badge}</span>
        <h1 className="nd-headline mt-6">{title}</h1>
        <p className="nd-body mt-4">{description}</p>
      </header>
      {children}
    </div>
  );
}

export function ToolStatus({ tone = "idle", children }: { tone?: "idle" | "busy" | "error" | "ready"; children: ReactNode }) {
  const color =
    tone === "error"
      ? "text-[var(--nd-accent)]"
      : tone === "ready"
        ? "text-[var(--nd-success)]"
        : "text-[var(--nd-text-secondary)]";

  return <p className={`nd-status-inline ${color}`}>{children}</p>;
}
