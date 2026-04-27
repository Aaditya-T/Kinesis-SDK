export class XrplGamingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XrplGamingError";
  }
}

export class ManagedNotAvailableError extends XrplGamingError {
  constructor(message?: string) {
    super(
      message ??
        "Managed mode is not yet available. Use the self-hosted configuration, or contact us to set up a managed backend.",
    );
    this.name = "ManagedNotAvailableError";
  }
}

export class XrplTransactionError extends XrplGamingError {
  readonly txResult: string;
  constructor(txType: string, txResult: string) {
    super(`${txType} failed on XRPL: ${txResult}`);
    this.name = "XrplTransactionError";
    this.txResult = txResult;
  }
}
