import React from "react";
import { Link } from "wouter";
import { Github, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
            <Code2 className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            XRPL Gaming<span className="text-primary">.SDK</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <a href="mailto:hello@xrpl-gaming.dev">Contact Us</a>
          </Button>
        </div>
      </div>
    </nav>
  );
}
