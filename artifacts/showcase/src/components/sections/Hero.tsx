import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border text-sm text-muted-foreground mb-8">
            <Terminal className="w-4 h-4 text-primary" />
            <span>v1.0.0 is now available</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Game assets that <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">evolve</span> as your players play.
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
            A TypeScript SDK that lets indie game devs mint and mutate NFTs on the XRP Ledger. No blockchain expertise required. Just pure gameplay.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button size="lg" className="h-12 px-8 text-base group" onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}>
              Try Live Demo
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base" onClick={() => document.getElementById("code")?.scrollIntoView({ behavior: "smooth" })}>
              View Code Examples
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
