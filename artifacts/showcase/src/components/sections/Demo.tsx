import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ExternalLink,
  Play,
  RefreshCw,
  Terminal,
  Wallet,
  Zap,
} from "lucide-react";
import { useXrplDemo } from "@/hooks/useXrplDemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function Demo() {
  const { state, fundWallet, mintNft, levelUp, reset, txExplorerUrl, nftExplorerUrl, accountExplorerUrl } = useXrplDemo();
  const [form, setForm] = useState({ name: "Mira", characterClass: "Mage" });

  const isWorking = state.status === "funding" || state.status === "minting" || state.status === "updating";

  return (
    <section id="demo" className="py-24 border-y border-border/40 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <h2 className="text-3xl font-display font-bold">Live Testnet Demo</h2>
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">XRPL Testnet</Badge>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experience the flow. We'll fund a temporary wallet, mint an NFT, and then mutate its metadata on-chain.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Controls & UI */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-card border border-border flex flex-col gap-6">
              
              {/* Step 1: Wallet */}
              <div className={`p-4 rounded-xl border ${state.walletAddress ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-secondary/30'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold mb-1">1. Testnet Wallet</h3>
                    <p className="text-sm text-muted-foreground">Fund a temporary wallet to pay gas fees.</p>
                  </div>
                  {state.walletAddress ? (
                    <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/20">
                      {state.walletBalanceXrp} XRP
                    </Badge>
                  ) : (
                    <Wallet className="text-muted-foreground w-5 h-5" />
                  )}
                </div>
                
                {!state.walletAddress && (
                  <Button 
                    onClick={fundWallet} 
                    disabled={isWorking} 
                    className="w-full"
                  >
                    {state.status === "funding" ? "Funding..." : "Fund Wallet from Faucet"}
                  </Button>
                )}
                
                {state.walletAddress && (
                  <div className="text-xs font-mono text-muted-foreground truncate">
                    Address: <a href={accountExplorerUrl(state.walletAddress)} target="_blank" rel="noreferrer" className="text-primary hover:underline">{state.walletAddress}</a>
                  </div>
                )}
              </div>

              {/* Step 2: Mint */}
              <div className={`p-4 rounded-xl border ${state.nft ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-secondary/30'} ${!state.walletAddress && 'opacity-50 pointer-events-none'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold mb-1">2. Mint Character</h3>
                    <p className="text-sm text-muted-foreground">Create the initial DynamicNFT.</p>
                  </div>
                </div>
                
                {!state.nft && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs">Name</Label>
                        <Input 
                          id="name" 
                          value={form.name} 
                          onChange={e => setForm({...form, name: e.target.value})} 
                          className="bg-background h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="class" className="text-xs">Class</Label>
                        <Input 
                          id="class" 
                          value={form.characterClass} 
                          onChange={e => setForm({...form, characterClass: e.target.value})} 
                          className="bg-background h-8 text-sm"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={() => mintNft({ name: form.name, characterClass: form.characterClass, level: 1, power: 10 })} 
                      disabled={isWorking || !state.walletAddress} 
                      className="w-full"
                    >
                      {state.status === "minting" ? "Minting..." : "Mint NFT"}
                    </Button>
                  </div>
                )}

                {state.nft && (
                  <div className="bg-background/50 rounded-lg p-3 border border-border/50 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-display font-bold text-lg">{state.nft.metadata.name}</div>
                        <div className="text-sm text-muted-foreground">{state.nft.metadata.characterClass}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Level</div>
                        <div className="font-mono text-lg text-primary">{state.nft.metadata.level}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-border/50 pt-2">
                      <span className="text-muted-foreground">Power: {state.nft.metadata.power}</span>
                      <a href={nftExplorerUrl(state.nft.tokenId)} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                        View NFT <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="border-t border-border/50 pt-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">On-chain URI</span>
                        {state.nft.updateCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] bg-primary/15 text-primary hover:bg-primary/15">
                            mutated x{state.nft.updateCount}
                          </Badge>
                        )}
                      </div>
                      {state.nft.previousUri && (
                        <div className="text-[10px] font-mono text-muted-foreground/70 break-all line-through decoration-destructive/60">
                          {state.nft.previousUri.length > 96
                            ? `${state.nft.previousUri.slice(0, 96)}…`
                            : state.nft.previousUri}
                        </div>
                      )}
                      <motion.div
                        key={state.nft.uri}
                        initial={{ opacity: 0, backgroundColor: "rgba(34,211,238,0.18)" }}
                        animate={{ opacity: 1, backgroundColor: "rgba(34,211,238,0)" }}
                        transition={{ duration: 1.4 }}
                        className="text-[11px] font-mono text-foreground/90 break-all rounded px-1 py-0.5"
                      >
                        {state.nft.uri.length > 120
                          ? `${state.nft.uri.slice(0, 120)}…`
                          : state.nft.uri}
                      </motion.div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Level Up */}
              <div className={`p-4 rounded-xl border ${state.status === 'updating' ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-secondary/30'} ${!state.nft && 'opacity-50 pointer-events-none'}`}>
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">3. Mutate On-Chain</h3>
                    <p className="text-sm text-muted-foreground">Update the NFT's URI via NFTokenModify.</p>
                  </div>
                  <Button 
                    onClick={levelUp} 
                    disabled={isWorking || !state.nft}
                    variant="secondary"
                    className="shrink-0 gap-2"
                  >
                    {state.status === "updating" ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 text-primary" />
                    )}
                    Level Up
                  </Button>
                </div>
              </div>

              {state.error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{state.error}</p>
                </div>
              )}

              {state.walletAddress && (
                <Button variant="ghost" size="sm" onClick={reset} disabled={isWorking} className="w-full text-muted-foreground">
                  <RefreshCw className="w-4 h-4 mr-2" /> Reset Demo
                </Button>
              )}

            </div>
          </div>

          {/* Activity Log */}
          <div className="rounded-2xl border border-border bg-black/40 flex flex-col h-[500px] overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-card/50 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-sm font-semibold">Live Transaction Log</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
              {state.log.length === 0 ? (
                <div className="text-muted-foreground italic h-full flex items-center justify-center">
                  Waiting for activity...
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {state.log.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-2 rounded border ${
                        entry.kind === 'error' ? 'bg-destructive/10 border-destructive/30 text-red-400' :
                        entry.kind === 'tx' ? 'bg-primary/5 border-primary/20 text-blue-300' :
                        'bg-secondary/30 border-border/30 text-gray-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="break-all">{entry.message}</span>
                        <span className="text-[10px] opacity-50 shrink-0">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false })}
                        </span>
                      </div>
                      {entry.txHash && (
                        <a 
                          href={txExplorerUrl(entry.txHash)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="mt-1 flex items-center gap-1 text-[10px] text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {entry.txHash}
                        </a>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
            {isWorking && (
              <div className="p-2 bg-primary/10 border-t border-primary/20 text-primary text-xs font-mono flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Awaiting network confirmation...
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
