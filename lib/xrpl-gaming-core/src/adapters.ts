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

export interface IIPFSAdapter {
  uploadJson(
    data: NftMetadata,
    opts?: IpfsUploadOptions,
  ): Promise<IpfsUploadResult>;
}
