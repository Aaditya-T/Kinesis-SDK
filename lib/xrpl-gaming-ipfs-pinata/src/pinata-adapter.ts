import type {
  IIPFSAdapter,
  IpfsFileUploadOptions,
  IpfsUploadOptions,
  IpfsUploadResult,
  NftMetadata,
} from "xrpl-gaming-core";

/**
 * Bearer JWT credentials. Recommended — used with Pinata's v3 Files API.
 *
 * @see https://ai-docs.pinata.cloud/
 */
export interface PinataJwtCredentials {
  jwt: string;
}

/**
 * Legacy API key + secret key pair. Used with Pinata's v1 pinning endpoints
 * (`pinJSONToIPFS`). Both credential modes pin the data to public IPFS the
 * same way.
 */
export interface PinataKeyCredentials {
  apiKey: string;
  secretKey: string;
}

export type PinataCredentials = PinataJwtCredentials | PinataKeyCredentials;

export type PinataConfig = PinataCredentials & {
  /**
   * Public gateway domain used to construct the gateway URL. Defaults to
   * `gateway.pinata.cloud` — replace with your dedicated gateway in
   * production for predictable performance.
   */
  gatewayDomain?: string;
  /** Override the upload endpoint (mostly useful for testing). */
  uploadEndpoint?: string;
  /**
   * For JWT mode only — `"public"` (default) pins to the public IPFS
   * network, `"private"` keeps the file inside Pinata's private network.
   */
  network?: "public" | "private";
};

interface V3FileResponse {
  data: { id: string; name: string; cid: string };
}

interface V1PinResponse {
  IpfsHash: string;
  PinSize?: number;
  Timestamp?: string;
}

function isJwtCreds(c: PinataCredentials): c is PinataJwtCredentials {
  return typeof (c as PinataJwtCredentials).jwt === "string";
}

function isKeyCreds(c: PinataCredentials): c is PinataKeyCredentials {
  return (
    typeof (c as PinataKeyCredentials).apiKey === "string" &&
    typeof (c as PinataKeyCredentials).secretKey === "string"
  );
}

/**
 * IPFS adapter backed by Pinata. Accepts either a JWT (preferred, uses
 * Pinata's v3 Files API) or a legacy `apiKey` + `secretKey` pair (uses
 * Pinata's v1 `pinJSONToIPFS` endpoint). Both produce a public IPFS CID
 * and a gateway URL.
 *
 * @see https://ai-docs.pinata.cloud/
 */
export class PinataAdapter implements IIPFSAdapter {
  private readonly creds: PinataCredentials;
  private readonly gatewayDomain: string;
  private readonly jsonUploadEndpoint: string;
  private readonly fileUploadEndpoint: string;
  private readonly network: "public" | "private";

  constructor(config: PinataConfig) {
    if (isJwtCreds(config)) {
      if (!config.jwt) {
        throw new Error("PinataAdapter requires a non-empty `jwt`");
      }
      this.creds = { jwt: config.jwt };
      // v3 uses the same `/v3/files` endpoint for both JSON and binary
      // uploads — the only difference is the Blob's content-type.
      const v3Endpoint =
        config.uploadEndpoint ?? "https://uploads.pinata.cloud/v3/files";
      this.jsonUploadEndpoint = v3Endpoint;
      this.fileUploadEndpoint = v3Endpoint;
    } else if (isKeyCreds(config)) {
      if (!config.apiKey || !config.secretKey) {
        throw new Error(
          "PinataAdapter requires non-empty `apiKey` and `secretKey`",
        );
      }
      this.creds = { apiKey: config.apiKey, secretKey: config.secretKey };
      // v1 uses two distinct endpoints — pinJSONToIPFS vs pinFileToIPFS.
      // Honour `uploadEndpoint` as the JSON override (legacy behaviour) and
      // derive the file endpoint from it by swapping the verb, so a custom
      // / test host stays consistent across both upload kinds.
      this.jsonUploadEndpoint =
        config.uploadEndpoint ??
        "https://api.pinata.cloud/pinning/pinJSONToIPFS";
      this.fileUploadEndpoint = this.jsonUploadEndpoint.includes(
        "pinJSONToIPFS",
      )
        ? this.jsonUploadEndpoint.replace("pinJSONToIPFS", "pinFileToIPFS")
        : "https://api.pinata.cloud/pinning/pinFileToIPFS";
    } else {
      throw new Error(
        "PinataAdapter requires either `{ jwt }` or `{ apiKey, secretKey }` credentials",
      );
    }
    this.gatewayDomain = config.gatewayDomain ?? "gateway.pinata.cloud";
    this.network = config.network ?? "public";
  }

  async uploadJson(
    data: NftMetadata,
    opts?: IpfsUploadOptions,
  ): Promise<IpfsUploadResult> {
    const filename = opts?.name ?? `metadata-${Date.now()}.json`;
    const cid = isJwtCreds(this.creds)
      ? await this.uploadJsonViaV3(data, filename, this.creds.jwt)
      : await this.uploadJsonViaV1(data, filename, this.creds);

    return this.buildResult(cid);
  }

  /**
   * Pin an arbitrary binary file (image, audio, video, …) to Pinata.
   * Use this to upload an NFT's image first, then embed the returned
   * `ipfs://` URI in the metadata you pass to `uploadJson` / `nft.mint`.
   *
   * @example
   * ```ts
   * const fs = await import("node:fs/promises");
   * const bytes = await fs.readFile("./sword.png");
   * const image = await ipfs.uploadFile(bytes, {
   *   name: "sword.png",
   *   contentType: "image/png",
   * });
   * await sdk.nft.mint({
   *   metadata: { name: "Sword", image: image.uri, attributes: {} },
   *   playerId: "p1",
   * });
   * ```
   */
  async uploadFile(
    data: Uint8Array | ArrayBuffer | Blob,
    opts?: IpfsFileUploadOptions,
  ): Promise<IpfsUploadResult> {
    const filename = opts?.name ?? `file-${Date.now()}`;
    const blob = toBlob(data, opts?.contentType);

    const cid = isJwtCreds(this.creds)
      ? await this.uploadFileViaV3(blob, filename, this.creds.jwt)
      : await this.uploadFileViaV1(blob, filename, this.creds);

    return this.buildResult(cid);
  }

  private buildResult(cid: string): IpfsUploadResult {
    return {
      cid,
      uri: `ipfs://${cid}`,
      gatewayUrl: `https://${this.gatewayDomain}/ipfs/${cid}`,
    };
  }

  private async uploadJsonViaV3(
    data: NftMetadata,
    filename: string,
    jwt: string,
  ): Promise<string> {
    const body = JSON.stringify(data);
    return this.postV3(
      new Blob([body], { type: "application/json" }),
      filename,
      jwt,
    );
  }

  private async uploadFileViaV3(
    blob: Blob,
    filename: string,
    jwt: string,
  ): Promise<string> {
    return this.postV3(blob, filename, jwt);
  }

  private async postV3(
    blob: Blob,
    filename: string,
    jwt: string,
  ): Promise<string> {
    const form = new FormData();
    form.append("file", blob, filename);
    form.append("network", this.network);
    form.append("name", filename);

    const response = await fetch(this.fileUploadEndpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Pinata v3 upload failed (${response.status} ${response.statusText}): ${text}`,
      );
    }

    const json = (await response.json()) as V3FileResponse;
    if (!json.data?.cid) {
      throw new Error(
        `Pinata v3 response did not include a CID: ${JSON.stringify(json)}`,
      );
    }
    return json.data.cid;
  }

  private async uploadJsonViaV1(
    data: NftMetadata,
    filename: string,
    creds: PinataKeyCredentials,
  ): Promise<string> {
    const response = await fetch(this.jsonUploadEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: creds.apiKey,
        pinata_secret_api_key: creds.secretKey,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: { name: filename },
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Pinata v1 pinJSONToIPFS failed (${response.status} ${response.statusText}): ${text}`,
      );
    }

    const json = (await response.json()) as V1PinResponse;
    if (!json.IpfsHash) {
      throw new Error(
        `Pinata v1 response did not include an IpfsHash: ${JSON.stringify(json)}`,
      );
    }
    return json.IpfsHash;
  }

  private async uploadFileViaV1(
    blob: Blob,
    filename: string,
    creds: PinataKeyCredentials,
  ): Promise<string> {
    const form = new FormData();
    form.append("file", blob, filename);
    form.append("pinataMetadata", JSON.stringify({ name: filename }));

    const response = await fetch(this.fileUploadEndpoint, {
      method: "POST",
      headers: {
        pinata_api_key: creds.apiKey,
        pinata_secret_api_key: creds.secretKey,
      },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Pinata v1 pinFileToIPFS failed (${response.status} ${response.statusText}): ${text}`,
      );
    }

    const json = (await response.json()) as V1PinResponse;
    if (!json.IpfsHash) {
      throw new Error(
        `Pinata v1 response did not include an IpfsHash: ${JSON.stringify(json)}`,
      );
    }
    return json.IpfsHash;
  }
}

function toBlob(
  data: Uint8Array | ArrayBuffer | Blob,
  contentType: string | undefined,
): Blob {
  if (data instanceof Blob) {
    // An explicit `contentType` from the caller always wins. Otherwise we
    // preserve the Blob's existing type, falling back to a generic binary
    // type only if the Blob has none of its own.
    if (contentType) {
      return new Blob([data], { type: contentType });
    }
    return data.type ? data : new Blob([data], { type: "application/octet-stream" });
  }
  const type = contentType ?? "application/octet-stream";
  if (data instanceof ArrayBuffer) {
    return new Blob([new Uint8Array(data)], { type });
  }
  // Uint8Array (and Node Buffer, which extends it). Copy into a fresh
  // Uint8Array so SharedArrayBuffer-backed views are not passed to Blob.
  return new Blob([new Uint8Array(data)], { type });
}
