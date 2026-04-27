import React from "react";
import { motion } from "framer-motion";
import { Zap, Shield, Key, Server } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "DynamicNFTs out of the box",
    description: "Unlike static JPEGs, DynamicNFTs (XLS-46) can be updated on-chain. Level up characters, change stats, or evolve items over time."
  },
  {
    icon: Shield,
    title: "No smart contracts to write",
    description: "The XRPL has native NFT primitives. We handle the transaction construction, fees, and network state. You just call update()."
  },
  {
    icon: Key,
    title: "Bring your own keys",
    description: "Non-custodial by default. Your studio controls the issuer wallet. No vendor lock-in, no shared smart contract risks."
  },
  {
    icon: Server,
    title: "Self-hostable",
    description: "Run our open-source REST server in Docker alongside your game backend, or use it directly in a Node.js project."
  }
];

export function Features() {
  return (
    <section className="py-24 bg-secondary/20 border-y border-border/40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <motion.div 
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col gap-4 p-6 rounded-2xl bg-card border border-border/50"
            >
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
