import type { NftMetadata, NftRecord } from "./types.js";

export interface IDBAdapter {
  init(): Promise<void>;
  close(): Promise<void>;
  saveNft(record: NftRecord): Promise<void>;
  updateNft(
    tokenId: string,
    partial: Partial<NftRecord>,
  ): Promise<NftRecord | null>;
  getNft(tokenId: string): Promise<NftRecord | null>;
  listNftsByPlayer(playerId: string): Promise<NftRecord[]>;
  listNftsByOwner(ownerAddress: string): Promise<NftRecord[]>;
  listNftsByCollection(collection: string): Promise<NftRecord[]>;
  deleteNft(tokenId: string): Promise<void>;
}

export interface IpfsUploadResult {
  uri: string;
  gatewayUrl: string;
  cid?: string;
}

export interface IpfsUploadOptions {
  name?: string;
}

export interface IpfsFileUploadOptions extends IpfsUploadOptions {
  /**
   * MIME type of the file (e.g. `"image/png"`, `"image/jpeg"`,
   * `"image/webp"`). Defaults to `"application/octet-stream"`.
   * Pass it explicitly for images so gateways serve the correct
   * `Content-Type`.
   */
  contentType?: string;
}

export interface IIPFSAdapter {
  /**
   * Pin a JSON metadata document. Used by the SDK on every mint and update
   * to back the NFT's on-ledger URI.
   */
  uploadJson(
    data: NftMetadata,
    opts?: IpfsUploadOptions,
  ): Promise<IpfsUploadResult>;

  /**
   * Pin an arbitrary binary file (typically an image referenced from inside
   * an NFT's metadata document — e.g. the `image` field of an XLS-24 record).
   * Returns the same `{ uri, gatewayUrl, cid }` shape as `uploadJson`; the
   * caller is responsible for embedding the resulting `ipfs://` URI into
   * the metadata they later pass to `uploadJson` / `nft.mint` / `nft.update`.
   */
  uploadFile(
    data: Uint8Array | ArrayBuffer | Blob,
    opts?: IpfsFileUploadOptions,
  ): Promise<IpfsUploadResult>;
}
