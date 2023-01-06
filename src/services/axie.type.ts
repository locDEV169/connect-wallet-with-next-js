export interface IAxieWithdrawTokenRequest {
  items: Array<{
    amount: number;
    itemId: string;
  }>;
  accessToken: string;
}

export interface IAxieWithdrawTokenResponse {
  expiredAt: number;
  extraData: string;
  items: Array<{
    itemId: string;
    signedAmount: string;
    tokenAddress: string;
    tokenId: string;
    tokenRarity: number;
    tokenStandard: string;
  }>;
  nonce: number;
  signature: string;
  userAddress: string;
}
