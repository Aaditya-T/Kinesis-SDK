import { useCallback, useEffect, useRef, useState } from "react";
import {
  Client,
  Wallet,
  convertStringToHex,
  dropsToXrp,
  type NFTokenMint,
  type TransactionMetadata,
} from "xrpl";

import type {
  DemoLogEntry,
  DemoState,
  MintedNft,
  NftMetadata,
  UseXrplDemo,
} from "@/lib/xrpl-demo-types";

const TESTNET_WS = "wss://s.altnet.rippletest.net:51233";
const TESTNET_EXPLORER = "https://testnet.xrpl.org";

/**
 * `tfMutable` flag (XLS-46). Setting it on `NFTokenMint` allows the issuer
 * to later submit `NFTokenModify` to change the URI in place — that is the
 * core capability behind a "DynamicNFT" and the SDK that wraps it.
 *
 * (Decimal: 16. Source: XRPL XLS-46 spec.)
 */
const TF_MUTABLE = 0x10;

const initialState: DemoState = {
  status: "idle",
  log: [],
};

function makeLogEntry(
  kind: DemoLogEntry["kind"],
  message: string,
  txHash?: string,
): DemoLogEntry {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    kind,
    message,
    txHash,
  };
}

function metadataToUri(metadata: NftMetadata): string {
  // Encode metadata as a tiny JSON data URL. Real production usage would
  // pin this to IPFS via Pinata (see SDK readme), but for a no-backend
  // showcase a data URL keeps the demo self-contained.
  return `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
}

/**
 * React hook that drives the live XRPL testnet demo on the showcase page.
 *
 * Design notes:
 * - Only one shared `Client` instance is held in a ref across the lifetime
 *   of the hook, so we don't reconnect on every action.
 * - All actions append to a structured log so the UI can render a live
 *   "what's happening" feed with explorer links per transaction.
 * - The faucet-funded wallet only lives in memory — never persisted —
 *   because it's testnet-only and contains no real funds. Refreshing the
 *   page intentionally throws everything away.
 */
export function useXrplDemo(): UseXrplDemo {
  const [state, setState] = useState<DemoState>(initialState);
  const clientRef = useRef<Client | null>(null);
  const walletRef = useRef<Wallet | null>(null);
  const isUnmountedRef = useRef(false);

  // Always disconnect the WebSocket on unmount so the page doesn't leak
  // a live XRPL connection if the user navigates away.
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      const client = clientRef.current;
      if (client?.isConnected()) {
        client.disconnect().catch(() => {
          /* swallow — best-effort teardown */
        });
      }
    };
  }, []);

  const ensureClient = useCallback(async (): Promise<Client> => {
    let client = clientRef.current;
    if (!client) {
      client = new Client(TESTNET_WS);
      clientRef.current = client;
    }
    if (!client.isConnected()) {
      await client.connect();
    }
    return client;
  }, []);

  const appendLog = useCallback((entry: DemoLogEntry) => {
    setState((prev) => ({ ...prev, log: [...prev.log, entry] }));
  }, []);

  const setError = useCallback((message: string) => {
    setState((prev) => ({
      ...prev,
      status: "error",
      error: message,
      log: [...prev.log, makeLogEntry("error", message)],
    }));
  }, []);

  const fundWallet = useCallback(async (): Promise<void> => {
    setState((prev) => ({
      ...prev,
      status: "funding",
      error: undefined,
      log: [...prev.log, makeLogEntry("info", "Requesting testnet wallet from faucet…")],
    }));
    try {
      const client = await ensureClient();
      const { wallet, balance } = await client.fundWallet();
      if (isUnmountedRef.current) return;
      walletRef.current = wallet;
      setState((prev) => ({
        ...prev,
        status: "ready-to-mint",
        walletAddress: wallet.classicAddress,
        walletBalanceXrp: balance.toFixed(2),
        log: [
          ...prev.log,
          makeLogEntry(
            "info",
            `Funded wallet ${wallet.classicAddress} with ${balance.toFixed(2)} XRP`,
          ),
        ],
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Faucet request failed: ${message}`);
    }
  }, [ensureClient, setError]);

  const mintNft = useCallback(
    async (metadata: NftMetadata): Promise<void> => {
      const wallet = walletRef.current;
      if (!wallet) {
        setError("No wallet — fund a testnet wallet first.");
        return;
      }
      setState((prev) => ({
        ...prev,
        status: "minting",
        error: undefined,
        log: [
          ...prev.log,
          makeLogEntry("info", `Minting "${metadata.name}" on the XRPL testnet…`),
        ],
      }));
      try {
        const client = await ensureClient();
        const uri = metadataToUri(metadata);
        const mintTx: NFTokenMint = {
          TransactionType: "NFTokenMint",
          Account: wallet.classicAddress,
          // tfMutable is required so we can later run NFTokenModify on this NFT.
          Flags: TF_MUTABLE,
          NFTokenTaxon: 0,
          URI: convertStringToHex(uri),
        };
        const result = await client.submitAndWait(mintTx, { wallet });
        if (isUnmountedRef.current) return;

        const meta = result.result.meta;
        if (!meta || typeof meta === "string") {
          throw new Error("Unexpected: NFTokenMint returned no parsed metadata.");
        }
        const txMeta = meta as TransactionMetadata & { nftoken_id?: string };
        const tokenId = txMeta.nftoken_id;
        if (!tokenId) {
          throw new Error(
            "NFTokenMint succeeded but no NFTokenID was returned by the network.",
          );
        }
        const txResult =
          typeof txMeta.TransactionResult === "string"
            ? txMeta.TransactionResult
            : "tesSUCCESS";
        if (txResult !== "tesSUCCESS") {
          throw new Error(`NFTokenMint failed on-chain: ${txResult}`);
        }

        const nft: MintedNft = {
          tokenId,
          metadata,
          uri,
          mintTxHash: result.result.hash,
          updateCount: 0,
        };
        setState((prev) => ({
          ...prev,
          status: "ready",
          nft,
          log: [
            ...prev.log,
            makeLogEntry(
              "tx",
              `Minted NFT ${tokenId.slice(0, 12)}… (NFTokenMint)`,
              result.result.hash,
            ),
          ],
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Mint failed: ${message}`);
      }
    },
    [ensureClient, setError],
  );

  const levelUp = useCallback(async (): Promise<void> => {
    const wallet = walletRef.current;
    if (!wallet) {
      setError("No wallet — fund a testnet wallet first.");
      return;
    }
    const currentNft = state.nft;
    if (!currentNft) {
      setError("No NFT minted yet.");
      return;
    }
    const next: NftMetadata = {
      ...currentNft.metadata,
      level: currentNft.metadata.level + 1,
      // Power scales with level — gives the demo a satisfying number bump.
      power: currentNft.metadata.power + Math.max(3, Math.round(currentNft.metadata.power * 0.15)),
    };
    setState((prev) => ({
      ...prev,
      status: "updating",
      error: undefined,
      log: [
        ...prev.log,
        makeLogEntry(
          "info",
          `Leveling up "${next.name}" from L${currentNft.metadata.level} → L${next.level}…`,
        ),
      ],
    }));
    try {
      const client = await ensureClient();
      const newUri = metadataToUri(next);
      // NFTokenModify is XLS-46. The xrpl npm package types it loosely
      // (depending on version), so we cast through `unknown` here to keep
      // type-safety elsewhere in the hook.
      const modifyTx = {
        TransactionType: "NFTokenModify",
        Account: wallet.classicAddress,
        NFTokenID: currentNft.tokenId,
        URI: convertStringToHex(newUri),
      } as unknown as Parameters<typeof client.submitAndWait>[0];
      const result = await client.submitAndWait(modifyTx, { wallet });
      if (isUnmountedRef.current) return;

      const meta = result.result.meta;
      if (meta && typeof meta !== "string") {
        const txResult = (meta as TransactionMetadata).TransactionResult;
        if (txResult && txResult !== "tesSUCCESS") {
          throw new Error(`NFTokenModify failed on-chain: ${txResult}`);
        }
      }

      const updated: MintedNft = {
        ...currentNft,
        metadata: next,
        uri: newUri,
        lastUpdateTxHash: result.result.hash,
        updateCount: currentNft.updateCount + 1,
      };
      setState((prev) => ({
        ...prev,
        status: "ready",
        nft: updated,
        log: [
          ...prev.log,
          makeLogEntry(
            "tx",
            `Leveled up to L${next.level} / ${next.power} power (NFTokenModify)`,
            result.result.hash,
          ),
        ],
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // The most common testnet failure here is "this network does not
      // support NFTokenModify" if the amendment isn't enabled. Surface a
      // helpful hint when we see that pattern.
      const hint = /tem|amendment|not supported|invalid/i.test(message)
        ? " (the testnet's DynamicNFT amendment may not be active right now — try again in a moment)"
        : "";
      setError(`Level-up failed: ${message}${hint}`);
    }
  }, [ensureClient, setError, state.nft]);

  const reset = useCallback(async (): Promise<void> => {
    walletRef.current = null;
    const client = clientRef.current;
    if (client?.isConnected()) {
      await client.disconnect().catch(() => {
        /* swallow */
      });
    }
    clientRef.current = null;
    setState(initialState);
  }, []);

  return {
    state,
    fundWallet,
    mintNft,
    levelUp,
    reset,
    explorerBaseUrl: TESTNET_EXPLORER,
    txExplorerUrl: (hash) => `${TESTNET_EXPLORER}/transactions/${hash}`,
    nftExplorerUrl: (tokenId) => `${TESTNET_EXPLORER}/nft/${tokenId}`,
    accountExplorerUrl: (address) => `${TESTNET_EXPLORER}/accounts/${address}`,
  };
}
