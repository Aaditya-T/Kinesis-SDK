import type {
  IDBAdapter,
  NftMetadata,
  NftRecord,
} from "@workspace/xrpl-gaming-core";
import { MongoClient, type Collection, type MongoClientOptions } from "mongodb";

export interface MongoConfig {
  /** MongoDB connection string. */
  connectionString: string;
  /** Database name to use. */
  databaseName: string;
  /** Collection name for NFT records. Defaults to "xrpl_gaming_nfts". */
  collectionName?: string;
  /** Options forwarded to `MongoClient`. */
  clientOptions?: MongoClientOptions;
  /** Pre-built `MongoClient`. When provided, `connectionString` is ignored. */
  client?: MongoClient;
}

interface NftDocument {
  _id: string;
  ownerAddress: string;
  issuerAddress: string;
  metadataUri: string;
  metadata: NftMetadata;
  playerId: string | null;
  collection: string | null;
  pendingOfferId: string | null;
  pendingDestination: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function recordToDoc(record: NftRecord): NftDocument {
  return {
    _id: record.tokenId,
    ownerAddress: record.ownerAddress,
    issuerAddress: record.issuerAddress,
    metadataUri: record.metadataUri,
    metadata: record.metadata,
    playerId: record.playerId,
    collection: record.collection,
    pendingOfferId: record.pendingOfferId,
    pendingDestination: record.pendingDestination,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function docToRecord(doc: NftDocument): NftRecord {
  return {
    tokenId: doc._id,
    ownerAddress: doc.ownerAddress,
    issuerAddress: doc.issuerAddress,
    metadataUri: doc.metadataUri,
    metadata: doc.metadata,
    playerId: doc.playerId,
    collection: doc.collection,
    pendingOfferId: doc.pendingOfferId ?? null,
    pendingDestination: doc.pendingDestination ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * MongoDB-backed `IDBAdapter`. Auto-creates its indexes on `init()`.
 */
export class MongoAdapter implements IDBAdapter {
  private readonly client: MongoClient;
  private readonly databaseName: string;
  private readonly collectionName: string;
  private readonly ownsClient: boolean;
  private collection: Collection<NftDocument> | null = null;

  constructor(config: MongoConfig) {
    if (config.client) {
      this.client = config.client;
      this.ownsClient = false;
    } else {
      this.client = new MongoClient(
        config.connectionString,
        config.clientOptions,
      );
      this.ownsClient = true;
    }
    this.databaseName = config.databaseName;
    this.collectionName = config.collectionName ?? "xrpl_gaming_nfts";
  }

  private requireCollection(): Collection<NftDocument> {
    if (!this.collection) {
      throw new Error("MongoAdapter not initialized — call sdk.init() first");
    }
    return this.collection;
  }

  async init(): Promise<void> {
    if (this.collection) return;
    await this.client.connect();
    const col = this.client
      .db(this.databaseName)
      .collection<NftDocument>(this.collectionName);
    await col.createIndex({ playerId: 1 });
    await col.createIndex({ ownerAddress: 1 });
    await col.createIndex({ collection: 1 });
    this.collection = col;
  }

  async close(): Promise<void> {
    if (this.ownsClient) {
      await this.client.close();
    }
    this.collection = null;
  }

  async saveNft(record: NftRecord): Promise<void> {
    await this.requireCollection().insertOne(recordToDoc(record));
  }

  async updateNft(
    tokenId: string,
    partial: Partial<NftRecord>,
  ): Promise<NftRecord | null> {
    const set: Partial<NftDocument> = {};
    if (partial.ownerAddress !== undefined) set.ownerAddress = partial.ownerAddress;
    if (partial.issuerAddress !== undefined) set.issuerAddress = partial.issuerAddress;
    if (partial.metadataUri !== undefined) set.metadataUri = partial.metadataUri;
    if (partial.metadata !== undefined) set.metadata = partial.metadata;
    if (partial.playerId !== undefined) set.playerId = partial.playerId;
    if (partial.collection !== undefined) set.collection = partial.collection;
    if (partial.pendingOfferId !== undefined) set.pendingOfferId = partial.pendingOfferId;
    if (partial.pendingDestination !== undefined) set.pendingDestination = partial.pendingDestination;
    set.updatedAt = partial.updatedAt ?? new Date();

    const result = await this.requireCollection().findOneAndUpdate(
      { _id: tokenId },
      { $set: set },
      { returnDocument: "after" },
    );
    if (!result) return null;
    return docToRecord(result);
  }

  async getNft(tokenId: string): Promise<NftRecord | null> {
    const doc = await this.requireCollection().findOne({ _id: tokenId });
    return doc ? docToRecord(doc) : null;
  }

  async listNftsByPlayer(playerId: string): Promise<NftRecord[]> {
    const docs = await this.requireCollection()
      .find({ playerId })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(docToRecord);
  }

  async listNftsByOwner(ownerAddress: string): Promise<NftRecord[]> {
    const docs = await this.requireCollection()
      .find({ ownerAddress })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(docToRecord);
  }

  async listNftsByCollection(collection: string): Promise<NftRecord[]> {
    const docs = await this.requireCollection()
      .find({ collection })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(docToRecord);
  }

  async deleteNft(tokenId: string): Promise<void> {
    await this.requireCollection().deleteOne({ _id: tokenId });
  }
}
