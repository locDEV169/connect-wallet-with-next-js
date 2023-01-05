import { createContext, useContext } from 'react';
import { EthereumAddress } from 'trezor-connect';

export interface ITransferSlpRequest {
  from: string;
  to: string;
  amount: number;
  fee?: boolean;
}

interface IAccountConsolidate {
  id: string;
  wallet: string;
  scholar_share?: number;
  scholar_id?: string;
}
export interface IConsolidateSlpRequest {
  accounts: Array<IAccountConsolidate>;
}

export interface ITrezorContext {
  getAccounts: () => Promise<EthereumAddress[]>;
  claimSlp: (walletAddress: string) => Promise<Record<string, any>>;
  transferSlp?: (params: ITransferSlpRequest) => Promise<void>;
  getSignedRawTransferTx: (
    params: ITransferSlpRequest,
  ) => Promise<{ signedRawTx: string }>;
  consolidate: (params: IConsolidateSlpRequest) => Promise<Record<string, any>>;
  claimSLPMulti: (params: any) => Promise<Record<string, any>>;
  distributeMulti: (params: any) => Promise<Record<string, any>>;
  sendBonusMulti: (params: any) => Promise<Record<string, any>>;
  testTransferSlp?: () => Promise<void>
}

export const TrezorContext = createContext<ITrezorContext | any>(
  {} as ITrezorContext,
);

export const useTrezor = () => useContext(TrezorContext);
