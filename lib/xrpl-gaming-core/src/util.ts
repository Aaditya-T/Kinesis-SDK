export function uriToHex(uri: string): string {
  const bytes = new TextEncoder().encode(uri);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out.toUpperCase();
}

export function hexToUri(hex: string): string {
  const clean = hex.length % 2 === 0 ? hex : "0" + hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

interface RawAffectedNode {
  CreatedNode?: {
    LedgerEntryType?: string;
    LedgerIndex?: string;
    NewFields?: { NFTokens?: Array<{ NFToken: { NFTokenID: string } }> };
  };
  ModifiedNode?: {
    LedgerEntryType?: string;
    FinalFields?: { NFTokens?: Array<{ NFToken: { NFTokenID: string } }> };
    PreviousFields?: { NFTokens?: Array<{ NFToken: { NFTokenID: string } }> };
  };
}

interface RawTxMeta {
  AffectedNodes?: RawAffectedNode[];
  nftoken_id?: string;
  offer_id?: string;
}

export function extractTokenIdFromMeta(meta: unknown): string | null {
  const m = meta as RawTxMeta | null;
  if (!m) return null;
  if (m.nftoken_id) return m.nftoken_id;

  const affected = m.AffectedNodes ?? [];
  const previousIds = new Set<string>();
  const finalIds: string[] = [];

  for (const node of affected) {
    const created = node.CreatedNode;
    if (created && created.LedgerEntryType === "NFTokenPage") {
      const tokens = created.NewFields?.NFTokens ?? [];
      for (const t of tokens) finalIds.push(t.NFToken.NFTokenID);
    }
    const modified = node.ModifiedNode;
    if (modified && modified.LedgerEntryType === "NFTokenPage") {
      const finals = modified.FinalFields?.NFTokens ?? [];
      const prevs = modified.PreviousFields?.NFTokens ?? [];
      for (const t of prevs) previousIds.add(t.NFToken.NFTokenID);
      for (const t of finals) finalIds.push(t.NFToken.NFTokenID);
    }
  }

  for (const id of finalIds) {
    if (!previousIds.has(id)) return id;
  }
  return null;
}

export function extractOfferIdFromMeta(meta: unknown): string | null {
  const m = meta as RawTxMeta | null;
  if (!m) return null;
  if (m.offer_id) return m.offer_id;

  const affected = m.AffectedNodes ?? [];
  for (const node of affected) {
    const created = node.CreatedNode;
    if (
      created &&
      created.LedgerEntryType === "NFTokenOffer" &&
      created.LedgerIndex
    ) {
      return created.LedgerIndex;
    }
  }
  return null;
}
