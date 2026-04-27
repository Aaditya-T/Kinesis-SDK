import React, { useEffect, useState } from "react";

interface NavItem {
  id: string;
  label: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const DOCS_TOC: NavGroup[] = [
  {
    title: "Getting started",
    items: [
      { id: "overview", label: "Overview" },
      { id: "architecture", label: "Architecture" },
      { id: "quick-start", label: "Quick start" },
    ],
  },
  {
    title: "Packages",
    items: [{ id: "packages", label: "Package map" }],
  },
  {
    title: "Configuration",
    items: [
      { id: "wallet", label: "The issuer wallet" },
      { id: "db-adapter", label: "Database adapters" },
      { id: "ipfs-adapter", label: "IPFS via Pinata" },
    ],
  },
  {
    title: "Hosting",
    items: [
      { id: "in-process", label: "In-process Node.js" },
      { id: "standalone-server", label: "Standalone REST server" },
      { id: "browser-rest", label: "Browsers & game clients" },
    ],
  },
  {
    title: "Core flows",
    items: [
      { id: "flow-mint", label: "Mint a DynamicNFT" },
      { id: "flow-update", label: "Mutate (update)" },
      { id: "flow-transfer", label: "Transfer to a player" },
      { id: "flow-burn", label: "Burn" },
      { id: "flow-query", label: "Query by player / collection" },
    ],
  },
  {
    title: "Reference",
    items: [
      { id: "errors", label: "Errors" },
      { id: "react-client", label: "React client hooks" },
      { id: "types", label: "Types cheat sheet" },
    ],
  },
];

const ALL_IDS = DOCS_TOC.flatMap((g) => g.items.map((i) => i.id));

function useActiveSection() {
  const [active, setActive] = useState<string | null>(ALL_IDS[0] ?? null);

  useEffect(() => {
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visible.delete(entry.target.id);
          }
        }
        if (visible.size === 0) return;
        // Prefer the topmost section currently in view.
        const [topId] = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];
        setActive(topId);
      },
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 },
    );

    ALL_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return active;
}

export function DocsSidebar() {
  const active = useActiveSection();

  return (
    <nav
      aria-label="Documentation navigation"
      className="hidden lg:block w-60 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-4 py-8"
    >
      <ul className="flex flex-col gap-6 text-sm">
        {DOCS_TOC.map((group) => (
          <li key={group.title}>
            <div className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 mb-2">
              {group.title}
            </div>
            <ul className="flex flex-col gap-1 border-l border-border/40">
              {group.items.map((item) => {
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      aria-current={isActive ? "location" : undefined}
                      className={`block -ml-px pl-4 py-1 border-l transition-colors ${
                        isActive
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DocsMobileToc() {
  return (
    <details className="lg:hidden mb-6 bg-card border border-border/50 rounded-lg">
      <summary className="cursor-pointer px-4 py-3 text-sm font-display font-semibold">
        On this page
      </summary>
      <div className="px-4 pb-4 pt-1 flex flex-col gap-4 text-sm">
        {DOCS_TOC.map((group) => (
          <div key={group.title}>
            <div className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 mb-1">
              {group.title}
            </div>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="text-muted-foreground hover:text-primary py-0.5 block">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
