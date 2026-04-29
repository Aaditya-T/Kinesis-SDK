import type {
  IDBAdapter,
  NftMetadata,
  NftRecord,
} from "xrpl-gaming-core";
import pg from "pg";

const { Pool } = pg;

export interface PostgresConfig {
  /** PostgreSQL connection string (postgres://user:pass@host:port/db). */
  connectionString: string;
  /**
   * Table name for storing NFT records. Defaults to "xrpl_gaming_nfts".
   * The table is created automatically on `init()` if it does not exist.
   */
  tableName?: string;
  /** SSL configuration passed through to `pg.Pool`. */
  ssl?: boolean | object;
  /** Optional pre-built pool. If provided, `connectionString` is ignored. */
  pool?: pg.Pool;
}

interface NftRow {
  token_id: string;
  owner_address: string;
  issuer_address: string;
  metadata_uri: string;
  metadata: NftMetadata | string;
  player_id: string | null;
  collection: string | null;
  pending_offer_id: string | null;
  pending_destination: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function rowToRecord(row: NftRow): NftRecord {
  const metadata =
    typeof row.metadata === "string"
      ? (JSON.parse(row.metadata) as NftMetadata)
      : row.metadata;
  return {
    tokenId: row.token_id,
    ownerAddress: row.owner_address,
    issuerAddress: row.issuer_address,
    metadataUri: row.metadata_uri,
    metadata,
    playerId: row.player_id,
    collection: row.collection,
    pendingOfferId: row.pending_offer_id,
    pendingDestination: row.pending_destination,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * PostgreSQL-backed `IDBAdapter`. Auto-creates its table on `init()`.
 */
export class PostgresAdapter implements IDBAdapter {
  private readonly pool: pg.Pool;
  private readonly tableName: string;
  private readonly ownsPool: boolean;
  private initialized = false;

  constructor(config: PostgresConfig) {
    if (config.pool) {
      this.pool = config.pool;
      this.ownsPool = false;
    } else {
      this.pool = new Pool({
        connectionString: config.connectionString,
        ssl: config.ssl,
      });
      this.ownsPool = true;
    }
    this.tableName = config.tableName ?? "xrpl_gaming_nfts";
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this.tableName)) {
      throw new Error(
        `Invalid tableName "${this.tableName}" — must match /^[a-zA-Z_][a-zA-Z0-9_]*$/`,
      );
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    const t = this.tableName;
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${t} (
        token_id            TEXT PRIMARY KEY,
        owner_address       TEXT NOT NULL,
        issuer_address      TEXT NOT NULL,
        metadata_uri        TEXT NOT NULL,
        metadata            JSONB NOT NULL,
        player_id           TEXT,
        collection          TEXT,
        pending_offer_id    TEXT,
        pending_destination TEXT,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    // Lightweight migration for installations that pre-date the
    // pending_offer_id / pending_destination columns.
    await this.pool.query(
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS pending_offer_id TEXT;`,
    );
    await this.pool.query(
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS pending_destination TEXT;`,
    );
    await this.pool.query(
      `CREATE INDEX IF NOT EXISTS ${t}_player_idx ON ${t} (player_id);`,
    );
    await this.pool.query(
      `CREATE INDEX IF NOT EXISTS ${t}_owner_idx ON ${t} (owner_address);`,
    );
    await this.pool.query(
      `CREATE INDEX IF NOT EXISTS ${t}_collection_idx ON ${t} (collection);`,
    );
    this.initialized = true;
  }

  async close(): Promise<void> {
    if (this.ownsPool) {
      await this.pool.end();
    }
    this.initialized = false;
  }

  async saveNft(record: NftRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO ${this.tableName}
        (token_id, owner_address, issuer_address, metadata_uri, metadata, player_id, collection, pending_offer_id, pending_destination, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11)`,
      [
        record.tokenId,
        record.ownerAddress,
        record.issuerAddress,
        record.metadataUri,
        JSON.stringify(record.metadata),
        record.playerId,
        record.collection,
        record.pendingOfferId,
        record.pendingDestination,
        record.createdAt,
        record.updatedAt,
      ],
    );
  }

  async updateNft(
    tokenId: string,
    partial: Partial<NftRecord>,
  ): Promise<NftRecord | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (partial.ownerAddress !== undefined) {
      sets.push(`owner_address = $${i++}`);
      values.push(partial.ownerAddress);
    }
    if (partial.issuerAddress !== undefined) {
      sets.push(`issuer_address = $${i++}`);
      values.push(partial.issuerAddress);
    }
    if (partial.metadataUri !== undefined) {
      sets.push(`metadata_uri = $${i++}`);
      values.push(partial.metadataUri);
    }
    if (partial.metadata !== undefined) {
      sets.push(`metadata = $${i++}::jsonb`);
      values.push(JSON.stringify(partial.metadata));
    }
    if (partial.playerId !== undefined) {
      sets.push(`player_id = $${i++}`);
      values.push(partial.playerId);
    }
    if (partial.collection !== undefined) {
      sets.push(`collection = $${i++}`);
      values.push(partial.collection);
    }
    if (partial.pendingOfferId !== undefined) {
      sets.push(`pending_offer_id = $${i++}`);
      values.push(partial.pendingOfferId);
    }
    if (partial.pendingDestination !== undefined) {
      sets.push(`pending_destination = $${i++}`);
      values.push(partial.pendingDestination);
    }

    sets.push(`updated_at = $${i++}`);
    values.push(partial.updatedAt ?? new Date());
    values.push(tokenId);

    const result = await this.pool.query<NftRow>(
      `UPDATE ${this.tableName} SET ${sets.join(", ")} WHERE token_id = $${i} RETURNING *`,
      values,
    );
    if (result.rows.length === 0) return null;
    return rowToRecord(result.rows[0]);
  }

  async getNft(tokenId: string): Promise<NftRecord | null> {
    const result = await this.pool.query<NftRow>(
      `SELECT * FROM ${this.tableName} WHERE token_id = $1`,
      [tokenId],
    );
    if (result.rows.length === 0) return null;
    return rowToRecord(result.rows[0]);
  }

  async listNftsByPlayer(playerId: string): Promise<NftRecord[]> {
    const result = await this.pool.query<NftRow>(
      `SELECT * FROM ${this.tableName} WHERE player_id = $1 ORDER BY created_at DESC`,
      [playerId],
    );
    return result.rows.map(rowToRecord);
  }

  async listNftsByOwner(ownerAddress: string): Promise<NftRecord[]> {
    const result = await this.pool.query<NftRow>(
      `SELECT * FROM ${this.tableName} WHERE owner_address = $1 ORDER BY created_at DESC`,
      [ownerAddress],
    );
    return result.rows.map(rowToRecord);
  }

  async listNftsByCollection(collection: string): Promise<NftRecord[]> {
    const result = await this.pool.query<NftRow>(
      `SELECT * FROM ${this.tableName} WHERE collection = $1 ORDER BY created_at DESC`,
      [collection],
    );
    return result.rows.map(rowToRecord);
  }

  async deleteNft(tokenId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE token_id = $1`,
      [tokenId],
    );
  }
}
