import React, { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Check, Copy, X } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

type CopyState = "idle" | "copied" | "error";

export function CodeBlock({ code, language = "tsx", filename }: CodeBlockProps) {
  const [state, setState] = useState<CopyState>("idle");

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        // Fallback for non-secure contexts (no Clipboard API).
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!ok) throw new Error("execCommand copy failed");
      }
      setState("copied");
    } catch {
      setState("error");
    }
    window.setTimeout(() => setState("idle"), 2000);
  };

  const icon =
    state === "copied" ? (
      <Check className="w-3.5 h-3.5 text-green-500" />
    ) : state === "error" ? (
      <X className="w-3.5 h-3.5 text-red-500" />
    ) : (
      <Copy className="w-3.5 h-3.5" />
    );

  const label =
    state === "copied" ? "Copied" : state === "error" ? "Copy failed" : "Copy code";

  return (
    <div className={`not-prose my-4 bg-card border border-border/50 rounded-lg overflow-hidden ${filename ? "" : "relative"}`}>
      {filename ? (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-secondary/30">
          <span className="text-xs text-muted-foreground font-mono">{filename}</span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={label}
            title={label}
            className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            {icon}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={label}
          title={label}
          className="absolute top-2 right-2 z-10 p-1.5 bg-secondary/40 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
        >
          {icon}
        </button>
      )}
      <div className="p-4 overflow-x-auto text-sm">
        <Highlight code={code} language={language} theme={themes.vsDark}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={`${className} bg-transparent font-mono`} style={{ ...style, backgroundColor: "transparent" }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}
