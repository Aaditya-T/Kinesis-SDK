import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#0ea5e9",
    primaryTextColor: "#e2e8f0",
    primaryBorderColor: "#334155",
    lineColor: "#64748b",
    secondaryColor: "#1e293b",
    tertiaryColor: "#0f172a",
    background: "#0f172a",
    nodeBorder: "#334155",
    clusterBkg: "#1e293b",
    titleColor: "#e2e8f0",
    edgeLabelBackground: "#1e293b",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "14px",
  },
  flowchart: {
    curve: "basis",
    padding: 20,
    htmlLabels: true,
  },
  securityLevel: "loose",
});

interface MermaidChartProps {
  chart: string;
  className?: string;
}

export function MermaidChart({ chart, className = "" }: MermaidChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!containerRef.current) return;
    setError(null);

    mermaid
      .render(idRef.current, chart)
      .then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          const svgEl = containerRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
          }
        }
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 font-mono whitespace-pre-wrap">
        Mermaid error: {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex justify-center rounded-xl border border-border/60 bg-[#0f172a] p-6 overflow-x-auto my-6 ${className}`}
    />
  );
}
