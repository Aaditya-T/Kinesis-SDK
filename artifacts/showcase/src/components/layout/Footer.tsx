import React from "react";
import { Github, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-12 mt-24">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="font-display font-bold text-lg tracking-tight">
            XRPL Gaming<span className="text-primary">.SDK</span>
          </span>
          <p className="text-sm text-muted-foreground text-center md:text-left max-w-sm">
            Empowering indie developers to build on-chain experiences without the blockchain learning curve.
          </p>
        </div>
        <div className="flex gap-6">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Github className="w-4 h-4" />
            GitHub
          </a>
          <a href="mailto:hello@xrpl-gaming.dev" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Mail className="w-4 h-4" />
            hello@xrpl-gaming.dev
          </a>
        </div>
      </div>
    </footer>
  );
}
