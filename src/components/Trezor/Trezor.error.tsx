interface TrezorErrorProperty {
  errorKey: string;
  message?: string | null | undefined;
  originError?: any;
}

export class TrezorError extends Error {
  originError: any;
  errorKey: string;

  public static ErrorKeys = {
    CONNECT_TREZOR_DEVICE: 'CONNECT_TREZOR_DEVICE',
    ACCOUNT_NOT_FOUND_IN_TREZOR_DEVICE: 'ACCOUNT_NOT_FOUND_IN_TREZOR_DEVICE',
    ETH_SIGN_MESSAGE: 'ETH_SIGN_MESSAGE',
    SERVER_BUSY: 'SERVER_BUSY',
    EMAIL_OR_PASSWORD_WRONG: 'EMAIL_OR_PASSWORD_WRONG',
    ASSET_AMOUNT_NOT_ENOUGH: 'ASSET_AMOUNT_NOT_ENOUGH',
  };

  constructor(property: TrezorErrorProperty) {
    super(property.message || 'Trezor Default Error Message');
    this.name = 'TrezorError';
    this.originError = property.originError;
    this.errorKey = property.errorKey;
  }
}
