import React from "react";

interface SectionProps {
  id: string;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}

export function Section({ id, title, eyebrow, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24 mb-20">
      {eyebrow && (
        <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          {eyebrow}
        </div>
      )}
      <h2 className="group flex items-center gap-2 text-2xl sm:text-3xl font-display font-bold mb-6">
        {title}
        <a
          href={`#${id}`}
          aria-label={`Link to ${title}`}
          className="text-muted-foreground/30 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity text-base"
        >
          #
        </a>
      </h2>
      <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:font-display prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-code:bg-secondary/40 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.875em] prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
        {children}
      </div>
    </section>
  );
}

interface CalloutProps {
  variant?: "info" | "warn" | "tip";
  title?: string;
  children: React.ReactNode;
}

export function Callout({ variant = "info", title, children }: CalloutProps) {
  const styles = {
    info: "border-primary/30 bg-primary/5",
    warn: "border-yellow-500/30 bg-yellow-500/5",
    tip: "border-accent/30 bg-accent/5",
  }[variant];

  const labelColor = {
    info: "text-primary",
    warn: "text-yellow-400",
    tip: "text-accent",
  }[variant];

  return (
    <div className={`not-prose my-6 border rounded-lg p-4 ${styles}`}>
      {title && <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${labelColor}`}>{title}</div>}
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}
