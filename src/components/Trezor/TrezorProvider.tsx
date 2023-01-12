import { utils } from 'ethers';
import React, { FC, useState, useRef, ReactNode, ReactElement } from 'react';
import {
  AXIE_WITHDRAW_CONTRACT_ADDRESS,
  getRawAddressFromRoninAddress,
  getRawSignature,
  readNativeTokenBalance,
  WITHDRAW_CONTRACT,
} from '../../services';
import { axieWithdrawToken } from '../../services/axie.service';
import TrezorConnect, {
  EthereumAddress,
  EthereumTransaction,
  // DEVICE_EVENT,
  // DEVICE
} from 'trezor-connect';
import Web3 from 'web3';

import { compareAddress, web3Read, web3Write } from '../../utils';
import { ITransferSlpRequest, IConsolidateSlpRequest, TrezorContext, TrezorError } from '../Trezor';

const baseEthereumPath = "m/44'/60'/0'/0/";
// const TARGET_WALLET = 'ronin:800645c2e37e2d513fbef4a411ac8a65d3a14040';
const TARGET_WALLET = 'ronin:69b4497e55389226e21326f201c11be694b53e18';

const RON_FEE = 0.0000368;

export const TrezorProvider: FC<any> = ({ children }: ReactNode | any): ReactElement => {
  const [accounts, setAccount] = useState<EthereumAddress[]>([]);
  const accountsRef = useRef<Array<EthereumAddress>>([]);

  // const defineErrKeyAndTroubleShoot = (error: Error | null) => {
  //   let errorKey = 'test_err_key',
  //     errorTroubleShoot = 'test_err_trs';
  //   if (!error) return { errorKey, errorTroubleShoot };

  //   if (error instanceof TrezorError) {
  //     // console.log('return TrezorErr', error?.errorKey);
  //     errorKey = error?.errorKey;
  //     switch (error?.errorKey) {
  //       case TrezorError.ErrorKeys.ACCOUNT_NOT_FOUND_IN_TREZOR_DEVICE:
  //         errorTroubleShoot =
  //           'Reconnect trezor device with another passphrase - refresh page or plug device cab again.';
  //         break;
  //       case TrezorError.ErrorKeys.ETH_SIGN_MESSAGE:
  //         errorTroubleShoot = 'Reconnect trezor device to sign message or try at another time.';
  //         break;
  //       case TrezorError.ErrorKeys.EMAIL_OR_PASSWORD_WRONG:
  //         errorTroubleShoot =
  //           'Account email/password is wrong, please cross check it in your game marketplace/workplace platform.';
  //         break;
  //       case TrezorError.ErrorKeys.SERVER_BUSY:
  //         errorTroubleShoot = `The game-server is under maintenance or your game-account has nothing to claim, please try at another time`;
  //         break;
  //       case TrezorError.ErrorKeys.ASSET_AMOUNT_NOT_ENOUGH:
  //         errorTroubleShoot = 'Not enough amount of assets, please cross check your wallet balance';
  //         break;
  //       default:
  //         errorTroubleShoot = 'Something wrong, please try at another time or contact admin';
  //         break;
  //     }
  //   } else {
  //     const errMsg = error?.message?.toLowerCase();
  //     if (errMsg?.includes('has no in-game slp')) {
  //       errorKey = 'HAS_NO_ITEMS';
  //       errorTroubleShoot = 'Your game account has no in-game SLP to claim, please ignore it and try at another time.';
  //     } else if (errMsg?.includes('claim nothing')) {
  //       errorKey = 'NOTHING_CHANGE';
  //       errorTroubleShoot = 'Claim nothing, please cross check with your game account.';
  //     } else if (errMsg?.includes('transaction receipt')) {
  //       errorKey = 'MISSING_TRANSACTION_RECEIPT';
  //       errorTroubleShoot =
  //         'Missing transaction receipt. Please cross check with your game account, if claim nothing, wait for awhile then reset connect trezor device - refresh page or plug device cab again.';
  //     } else if (errMsg?.includes('free gas request')) {
  //       errorKey = 'FREE_GAS_EXCEEDED';
  //       errorTroubleShoot =
  //         'Transaction stuck by free gas, please deposit RON on your account wallet - minimum 0.005 RON';
  //     } else if (errMsg?.includes('missing scholar or slp')) {
  //       errorKey = 'DATA_MISGUIDED';
  //       errorTroubleShoot = 'Data misguided, please contact admin platform';
  //     } else if (errMsg?.includes('network error')) {
  //       errorKey = 'NETWORK_ERROR';
  //       errorTroubleShoot = 'Game network error or under maintenance, please try at another time';
  //     } else {
  //       errorKey = 'INTERNAL_ERROR';
  //       errorTroubleShoot = 'Something wrong, please try at another time or contact admin';
  //     }
  //   }

  //   return { errorKey, errorTroubleShoot, errorMessage: error?.message };
  // };

  const getAccounts = async (options?: { disableCached?: boolean }): Promise<EthereumAddress[]> => {
    // if (accounts.length > 0) return accounts;
    if (accountsRef.current.length > 0 && !options?.disableCached) return accountsRef.current;

    TrezorConnect.manifest({
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? '',
      email: 'my_email@example.com',
    });
    // TrezorConnect.removeAllListeners();
    // TrezorConnect.init({
    //   connectSrc: process.env.NEXT_PUBLIC_APP_URL ?? '',
    //   lazyLoad: true, // this param will prevent iframe injection until TrezorConnect.method will be called
    //   manifest: {
    //     email: 'developer@xyz.com',
    //     appUrl: process.env.NEXT_PUBLIC_APP_URL ?? '',
    //   }
    // })
    console.log('getAccounts');
    // TODO: hard code 50 accounts. should update later
    const bundle: any = [];

    for (let i = 0; i < 50; i++) {
      bundle.push({
        path: `${baseEthereumPath}${i}`,
        showOnTrezor: false,
      });
    }

    const response = await TrezorConnect.ethereumGetAddress({ bundle });

    if (!response.success) {
      // throw new Error(response.payload.error);
      throw new TrezorError({
        errorKey: TrezorError.ErrorKeys.CONNECT_TREZOR_DEVICE,
        message: 'Please connect trezor device',
        originError: response.payload.error,
      });
    }
    console.log(response.payload);
    // setAccount(response.payload);
    accountsRef.current = [...response.payload];
    return response.payload;
  };

  const getAccountFromAddress = async (walletAddress: string): Promise<EthereumAddress> => {
    const trezorAccounts = await getAccounts();
    const account = trezorAccounts.find((item) => compareAddress(item.address, walletAddress));

    if (!account) {
      // throw new Error(`Your trezor doesn't contains this account`);
      throw new TrezorError({
        errorKey: TrezorError.ErrorKeys.ACCOUNT_NOT_FOUND_IN_TREZOR_DEVICE,
        message: `Your trezor doesn't contains this account`,
      });
    }

    return account;
  };

  // Sign Trezor
  const signWallet = async (
    walletAddress: string,
    serializedPath: string,
    options?: { email: string; password: string; last_claim_error?: number; total?: number },
  ) => {
    interface dataResultsType {
      success: boolean;
      address: string;
      signTxnSuccess: boolean;
      signTxn?: any;
      slpStartBalance: number;
      slpEndBalance: number;
      error?: Error | null | undefined;
      errorData?: any;
    }
    console.log('walletAddress', walletAddress, serializedPath);

    const rawAddress = getRawAddressFromRoninAddress(walletAddress);
    let accessToken = '';
    // const axieWithdrawTokenRes = await axieWithdrawToken({
    //   items: [
    //     { amount: options?.total || 0, itemId: 'slp' }
    //   ],
    //   accessToken
    // })
    // const { expiredAt, items, nonce, extraData, signature, userAddress }: any = axieWithdrawTokenRes;
    const ethnonce = await web3Read.eth.getTransactionCount(rawAddress);
    const balance = await readNativeTokenBalance(rawAddress);
    const RON = Number(balance.amount || 0);

    const fee = RON >= RON_FEE;

    const txParams = {
      to: AXIE_WITHDRAW_CONTRACT_ADDRESS,
      // data: WITHDRAW_CONTRACT.methods
      //   .withdraw(
      //     [
      //       rawAddress,
      //       // String(nonce),
      //       String(web3Read.utils.toHex(ethnonce)),
      //       expiredAt,
      //       [
      //         [0, slpTokenObj.tokenAddress, slpTokenObj.tokenId, String(options?.total), slpTokenObj.tokenRarity.toString()]
      //       ],
      //       extraData
      //     ],
      //     getRawSignature(signature),
      //     ["0x97a9107c1793bc407d6f527b77e7fff4d812bece","0xc99a6a985ed2cac1ef41640596c5a5f9f4e19ef5","0x0b7007c13325c48911f73a2dad5fa5dcbf808adc"]
      //   )
      //   .encodeABI(),
      gasLimit: web3Read.utils.toHex(500000),
      gasPrice: web3Read.utils.toHex(fee ? Number(1000000000 * 20).toString() : '0'),
      nonce: web3Read.utils.toHex(ethnonce),
      value: web3Read.utils.toHex(0),
      chainId: 2020,
    };

    const res = await sendSignTx(serializedPath, txParams, ethnonce);
    console.log('claimSlp -> finish, sendSignTx res', res);

    return walletAddress;
  };

  const sendSignTx = async (path: string, txParams: EthereumTransaction, nonce: number) => {
    console.log('txParams', txParams);
    // const signTx = await TrezorConnect.ethereumSignTransaction({
    //   path,
    //   transaction: txParams ,
    // });
    const signTx = await TrezorConnect.ethereumSignMessage({
      message: 'example message',
      path: path,
    });
    console.log('signTx', signTx);

    if (!signTx.success) {
      // throw new Error(signTx.payload.error);
      console.error(signTx.payload.error);
    }

    // const sig = {
    //   v: parseInt(signTx.payload.address.substring(2), 16),
    //   r: signTx.payload.address,
    //   s: signTx.payload.signature,
    // };

    // const serializedTransaction = utils.serializeTransaction({ ...txParams, nonce }, sig);
    // const res: any = await web3Write.eth.sendSignedTransaction(serializedTransaction);
    // console.log(res);
    
    return signTx;
  };

  return (
    <TrezorContext.Provider
      value={{
        getAccounts,
        signWallet,
      }}
    >
      {children}
    </TrezorContext.Provider>
  );
};
