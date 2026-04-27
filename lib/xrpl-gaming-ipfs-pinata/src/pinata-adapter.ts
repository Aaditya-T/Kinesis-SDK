import type {
  IIPFSAdapter,
  IpfsUploadOptions,
  IpfsUploadResult,
  NftMetadata,
} from "@workspace/xrpl-gaming-core";

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
  private readonly uploadEndpoint: string;
  private readonly network: "public" | "private";

  constructor(config: PinataConfig) {
    if (isJwtCreds(config)) {
      if (!config.jwt) {
        throw new Error("PinataAdapter requires a non-empty `jwt`");
      }
      this.creds = { jwt: config.jwt };
      this.uploadEndpoint =
        config.uploadEndpoint ?? "https://uploads.pinata.cloud/v3/files";
    } else if (isKeyCreds(config)) {
      if (!config.apiKey || !config.secretKey) {
        throw new Error(
          "PinataAdapter requires non-empty `apiKey` and `secretKey`",
        );
      }
      this.creds = { apiKey: config.apiKey, secretKey: config.secretKey };
      this.uploadEndpoint =
        config.uploadEndpoint ??
        "https://api.pinata.cloud/pinning/pinJSONToIPFS";
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
      ? await this.uploadViaV3(data, filename, this.creds.jwt)
      : await this.uploadViaV1(data, filename, this.creds);

    return {
      cid,
      uri: `ipfs://${cid}`,
      gatewayUrl: `https://${this.gatewayDomain}/ipfs/${cid}`,
    };
  }

  private async uploadViaV3(
    data: NftMetadata,
    filename: string,
    jwt: string,
  ): Promise<string> {
    const body = JSON.stringify(data);
    const form = new FormData();
    form.append(
      "file",
      new Blob([body], { type: "application/json" }),
      filename,
    );
    form.append("network", this.network);
    form.append("name", filename);

    const response = await fetch(this.uploadEndpoint, {
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

  private async uploadViaV1(
    data: NftMetadata,
    filename: string,
    creds: PinataKeyCredentials,
  ): Promise<string> {
    const response = await fetch(this.uploadEndpoint, {
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
}
