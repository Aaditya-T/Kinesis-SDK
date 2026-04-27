import type {
  IIPFSAdapter,
  IpfsUploadOptions,
  IpfsUploadResult,
  NftMetadata,
} from "@workspace/xrpl-gaming-core";

export interface PinataConfig {
  /** Pinata JWT (from https://app.pinata.cloud/developers/api-keys). */
  jwt: string;
  /**
   * Public gateway domain to use when constructing the gateway URL.
   * Defaults to "gateway.pinata.cloud" — replace with your dedicated gateway
   * for production usage.
   */
  gatewayDomain?: string;
  /**
   * Override the upload endpoint. Defaults to Pinata's v3 Files API.
   * See https://ai-docs.pinata.cloud/.
   */
  uploadEndpoint?: string;
  /**
   * Whether to upload to Pinata's "public" or "private" network. Defaults to
   * "public" so the metadata is pinned to the public IPFS network and
   * accessible via any IPFS gateway.
   */
  network?: "public" | "private";
}

interface PinataV3FileResponse {
  data: {
    id: string;
    name: string;
    cid: string;
    size?: number;
    mime_type?: string;
    network?: string;
  };
}

/**
 * IPFS adapter backed by Pinata's v3 Files API.
 *
 * @see https://ai-docs.pinata.cloud/
 */
export class PinataAdapter implements IIPFSAdapter {
  private readonly jwt: string;
  private readonly gatewayDomain: string;
  private readonly uploadEndpoint: string;
  private readonly network: "public" | "private";

  constructor(config: PinataConfig) {
    if (!config.jwt) {
      throw new Error("PinataAdapter requires a `jwt` credential");
    }
    this.jwt = config.jwt;
    this.gatewayDomain = config.gatewayDomain ?? "gateway.pinata.cloud";
    this.uploadEndpoint =
      config.uploadEndpoint ?? "https://uploads.pinata.cloud/v3/files";
    this.network = config.network ?? "public";
  }

  async uploadJson(
    data: NftMetadata,
    opts?: IpfsUploadOptions,
  ): Promise<IpfsUploadResult> {
    const filename = opts?.name ?? `metadata-${Date.now()}.json`;
    const body = JSON.stringify(data);

    const form = new FormData();
    form.append("file", new Blob([body], { type: "application/json" }), filename);
    form.append("network", this.network);
    form.append("name", filename);

    const response = await fetch(this.uploadEndpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.jwt}` },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Pinata upload failed (${response.status} ${response.statusText}): ${text}`,
      );
    }

    const json = (await response.json()) as PinataV3FileResponse;
    const cid = json.data?.cid;
    if (!cid) {
      throw new Error(
        `Pinata response did not include a CID: ${JSON.stringify(json)}`,
      );
    }

    return {
      cid,
      uri: `ipfs://${cid}`,
      gatewayUrl: `https://${this.gatewayDomain}/ipfs/${cid}`,
    };
  }
}
