import { utils } from 'ethers';
import React, { FC, useState, useRef, ReactNode, ReactElement } from 'react';
import TrezorConnect, {
  EthereumAddress,
  EthereumTransaction,
  // DEVICE_EVENT,
  // DEVICE
} from 'trezor-connect';
import Web3 from 'web3';

// import { compareAddress, web3Read, web3Write } from '../../utils';
import { compareAddress } from '../../utils';
import {
  ITransferSlpRequest,
  IConsolidateSlpRequest,
  TrezorContext,
  TrezorError,
} from '../Trezor';
// import {
//   axieClaimSlp,
//   axieSLP,
//   SLP_CONTRACT,
//   getRawSignature,
//   axieRandomMessage,
//   SLP_CONTRACT_ADDRESS,
//   axieCreateAccessToken,
//   axieCreateAccessTokenByEmailPassword,
//   getRawAddressFromRoninAddress,
//   readSLPBalance,
//   readRoninWalletBalance,
//   consolidateSingle,
//   claim,
//   distributeSingle,
//   distributeToManagerSingle,
//   // sendScholarsBonus,
//   sendBonusToScholar,
//   addHistoricalTxn,
//   AXIE_WITHDRAW_CONTRACT_ADDRESS,
//   WITHDRAW_CONTRACT,
//   readBalance,
//   axieWithdrawToken,
//   axieOriginAccountTokenWithAuth,
//   readNativeTokenBalance
// } from '@services';

const baseEthereumPath = "m/44'/60'/0'/0/";
// const TARGET_WALLET = 'ronin:800645c2e37e2d513fbef4a411ac8a65d3a14040';
const TARGET_WALLET = 'ronin:69b4497e55389226e21326f201c11be694b53e18';

const RON_FEE = 0.0000368;

export const TrezorProvider: FC<any> = ({ children }: ReactNode | any): ReactElement => {
  const [accounts, setAccount] = useState<EthereumAddress[]>([]);
  const accountsRef = useRef<Array<EthereumAddress>>([]);

  const defineErrKeyAndTroubleShoot = (error: Error | null) => {
    let errorKey = 'test_err_key', errorTroubleShoot = 'test_err_trs';
    if (!error) return { errorKey, errorTroubleShoot }

    if (error instanceof TrezorError) {
      // console.log('return TrezorErr', error?.errorKey);
      errorKey = error?.errorKey;
      switch (error?.errorKey) {
        case TrezorError.ErrorKeys.ACCOUNT_NOT_FOUND_IN_TREZOR_DEVICE:
          errorTroubleShoot = 'Reconnect trezor device with another passphrase - refresh page or plug device cab again.'
          break;
        case TrezorError.ErrorKeys.ETH_SIGN_MESSAGE:
          errorTroubleShoot = 'Reconnect trezor device to sign message or try at another time.'
          break;
        case TrezorError.ErrorKeys.EMAIL_OR_PASSWORD_WRONG:
          errorTroubleShoot = 'Account email/password is wrong, please cross check it in your game marketplace/workplace platform.'
          break;
        case TrezorError.ErrorKeys.SERVER_BUSY:
          errorTroubleShoot = `The game-server is under maintenance or your game-account has nothing to claim, please try at another time`
          break;
        case TrezorError.ErrorKeys.ASSET_AMOUNT_NOT_ENOUGH:
          errorTroubleShoot = 'Not enough amount of assets, please cross check your wallet balance'
          break;
        default:
          errorTroubleShoot = 'Something wrong, please try at another time or contact admin'
          break;
      }
    } else {
      const errMsg = error?.message?.toLowerCase();
      if (errMsg?.includes('has no in-game slp')) {
        errorKey = 'HAS_NO_ITEMS';
        errorTroubleShoot = 'Your game account has no in-game SLP to claim, please ignore it and try at another time.';
      } else if (errMsg?.includes('claim nothing')) {
        errorKey = 'NOTHING_CHANGE';
        errorTroubleShoot = 'Claim nothing, please cross check with your game account.'
      } else if (errMsg?.includes('transaction receipt')) {
        errorKey = 'MISSING_TRANSACTION_RECEIPT';
        errorTroubleShoot = 'Missing transaction receipt. Please cross check with your game account, if claim nothing, wait for awhile then reset connect trezor device - refresh page or plug device cab again.'
      } else if (errMsg?.includes('free gas request')) {
        errorKey = 'FREE_GAS_EXCEEDED';
        errorTroubleShoot = 'Transaction stuck by free gas, please deposit RON on your account wallet - minimum 0.005 RON'
      } else if (errMsg?.includes('missing scholar or slp')) {
        errorKey = 'DATA_MISGUIDED';
        errorTroubleShoot = 'Data misguided, please contact admin platform'
      } else if (errMsg?.includes('network error')) {
        errorKey = 'NETWORK_ERROR';
        errorTroubleShoot = 'Game network error or under maintenance, please try at another time'
      } else {
        errorKey = 'INTERNAL_ERROR';
        errorTroubleShoot = 'Something wrong, please try at another time or contact admin'
      }
    }

    return { errorKey, errorTroubleShoot, errorMessage: error?.message }
  }

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

  const getAccountFromAddress = async (
    walletAddress: string,
  ): Promise<EthereumAddress> => {
    const trezorAccounts = await getAccounts();
    const account = trezorAccounts.find((item) =>
      compareAddress(item.address, walletAddress),
    );

    if (!account) {
      // throw new Error(`Your trezor doesn't contains this account`);
      throw new TrezorError({
        errorKey: TrezorError.ErrorKeys.ACCOUNT_NOT_FOUND_IN_TREZOR_DEVICE,
        message: `Your trezor doesn't contains this account`,
      });
    }

    return account;
  };

  // const claimSlp = async (walletAddress: string, options?: { email: string, password: string, last_claim_error?: number, total?: number }) => {
  //   interface dataResultsType {
  //     success: boolean,
  //     address: string,
  //     signTxnSuccess: boolean,
  //     signTxn?: any,
  //     slpStartBalance: number,
  //     slpEndBalance: number,
  //     error?: Error | null | undefined,
  //     errorData?: any,
  //   }
  //   const dataResults: dataResultsType = {
  //     success: false,
  //     address: '',
  //     signTxnSuccess: false,
  //     signTxn: null,
  //     slpStartBalance: 0,
  //     slpEndBalance: 0,
  //     error: null,
  //     errorData: null,
  //   };
  //   // let gameAndChainClaimMapping = true;
  //   let gameLastClaimErr = 0;

  //   try {
  //     const trezorAccount = await getAccountFromAddress(walletAddress);
  //     console.log(
  //       'claimSlp - find & compare acc in trezor device',
  //       trezorAccount,
  //     );
  //     const rawAddress = getRawAddressFromRoninAddress(trezorAccount.address);
  //     // return { ...dataResults, success: true }
  //     console.log('claimSlp -> starting...');
  //     dataResults.address = rawAddress;
  //     // dataResults.slpStartBalance = await readSLPBalance(rawAddress);
  //     // const {
  //     //   data: { createRandomMessage: message },
  //     // } = await axieRandomMessage();
  //     // const signMessage = await TrezorConnect.ethereumSignMessage({
  //     //   message,
  //     //   path: trezorAccount.serializedPath,
  //     // });

  //     // if (!signMessage.success) {
  //     //   // throw new Error(signMessage.payload.error);
  //     //   throw new TrezorError({
  //     //     errorKey: TrezorError.ErrorKeys.ETH_SIGN_MESSAGE,
  //     //     message: 'ETH sign message error',
  //     //     originError: signMessage.payload.error,
  //     //   });
  //     // }

  //     // const {
  //     //   data: {
  //     //     createAccessTokenWithSignature: { accessToken },
  //     //   },
  //     // } = await axieCreateAccessToken({
  //     //   message,
  //     //   address: rawAddress,
  //     //   signature: getRawSignature(signMessage.payload.signature),
  //     // });
  //     // //===TEST SIGN===
  //     // const signMessage = await TrezorConnect.ethereumSignMessage({
  //     //   message: 'msg' + String(Date.now()),
  //     //   path: trezorAccount.serializedPath,
  //     // });
  //     // console.log('sign msg result', signMessage)
  //     // if (!signMessage.success) {
  //     //   throw new TrezorError({
  //     //     errorKey: TrezorError.ErrorKeys.ETH_SIGN_MESSAGE,
  //     //     message: 'ETH sign message error',
  //     //     originError: signMessage.payload.error,
  //     //   });
  //     // }
  //     // //===TEST SIGN===
  //     let accessToken = '';
  //     try {
  //       const { data: { accessToken: accessTokenData } } = await axieCreateAccessTokenByEmailPassword({
  //         email: options?.email || '', password: options?.password || ''
  //       });
  //       accessToken = accessTokenData;
  //     } catch (error) {
  //       console.log('create axie accessToken err: ', error);
  //       throw new TrezorError({
  //         errorKey: TrezorError.ErrorKeys.EMAIL_OR_PASSWORD_WRONG,
  //         message:
  //           'Your email or password is wrong',
  //         originError: error,
  //       });
  //     }
  //     // console.log('run here - accesstoken', accessToken)
  //     // return { ...dataResults, success: true, accessTokenRes: accessToken }
  //     //handle when skymavis api down
  //     // let claimAmount, claimTimeStamp, claimSignature = '';
  //     // let ingameSLP = 0;
  //     let axieWithdrawTokenRes = null;
  //     try {
  //       // const getAxieSLP = await axieSLP({ address: rawAddress });
  //       // // ingame slp
  //       // ingameSLP = getAxieSLP.rawTotal - getAxieSLP.rawClaimableTotal || 0;
  //       // if (options?.last_claim_error) ingameSLP = options.total || 0;
  //       // if (ingameSLP <= 0) {
  //       //   console.log(
  //       //     'getAxieSLP res - Account has no in-game SLP',
  //       //     getAxieSLP,
  //       //   );
  //       //   throw new Error('Account has no in-game SLP');
  //       // }

  //       // const {
  //       //   // blockchain_related: {
  //       //   blockchainRelated: {
  //       //     signature: { signature, amount, timestamp },
  //       //   },
  //       //   lastClaimedItemAt
  //       //   // rawTotal,
  //       //   // rawClaimableTotal,
  //       //   // claimableTotal
  //       // } = await axieClaimSlp({
  //       //   address: rawAddress,
  //       //   accessToken,
  //       // });

  //       // claimAmount = amount;
  //       // claimTimeStamp = timestamp;
  //       // claimSignature = signature;

  //       // // gameAndChainClaimMapping = getAxieSLP.lastClaimedItemAt == lastClaimedItemAt;
  //       // gameLastClaimErr = lastClaimedItemAt;
  //       // // return { ...dataResults, success: true, accessTokenRes: accessToken }

  //       // check widthrawable
  //       const tokenStatus = await axieOriginAccountTokenWithAuth({ accessToken, itemId: 'slp' });
  //       if (Number(options?.total || 0) > tokenStatus.withdrawable)
  //         throw new TrezorError({
  //           errorKey: TrezorError.ErrorKeys.ASSET_AMOUNT_NOT_ENOUGH,
  //           message: `Account hasn't enough token`,
  //           originError: new Error(`Account hasn't enough token`),
  //         });

  //       axieWithdrawTokenRes = await axieWithdrawToken({
  //         items: [
  //           { amount: options?.total || 0, itemId: 'slp' }
  //         ],
  //         accessToken
  //       })

  //     } catch (error) {
  //       console.log('axieWithdrawToken - error', error)
  //       throw new TrezorError({
  //         errorKey: TrezorError.ErrorKeys.SERVER_BUSY,
  //         message:
  //           'Server busy or account has no token in-game, please try at another time',
  //         originError: error,
  //       });
  //     }
  //     // console.log('pass1 - axieWithdrawToken api', { axieWithdrawTokenRes })
  //     const { expiredAt, items, nonce, extraData, signature, userAddress }: any = axieWithdrawTokenRes;
  //     const slpTokenObj = items?.find(it => it.itemId === 'slp');
  //     if (!slpTokenObj)
  //       throw new Error('Wrong token - not SLP token')
  //     // //===TEST===
  //     // claimAmount = 10;
  //     // claimTimeStamp = 1661221153;
  //     // claimSignature = signMessage.payload.signature;
  //     // //===END===
  //     // console.log('bl', await readBalance(rawAddress), await readSLPBalance(rawAddress))
  //     // return

  //     const balance = await readNativeTokenBalance(rawAddress);
  //     const RON = Number(balance.amount || 0)
  //     const ethnonce = await web3Read.eth.getTransactionCount(rawAddress);
  //     // const nonce = await WITHDRAW_CONTRACT.methods.nonce(rawAddress).call();
  //     // throw new Error('test nonce error')
  //     // const txParams = {
  //     //   to: SLP_CONTRACT_ADDRESS as string,
  //     //   data: SLP_CONTRACT.methods
  //     //     .checkpoint(
  //     //       rawAddress,
  //     //       claimAmount,
  //     //       claimTimeStamp,
  //     //       getRawSignature(claimSignature),
  //     //     )
  //     //     .encodeABI(),
  //     //   gasLimit: web3Read.utils.toHex('150000'),
  //     //   gasPrice: web3Read.utils.toHex('0'),
  //     //   nonce: web3Read.utils.toHex(nonce),
  //     //   value: web3Read.utils.toHex(0),
  //     //   chainId: 2020,
  //     // };
  //     const fee = RON >= RON_FEE;
  //     // const fee = true;
  //     const txParams = {
  //       to: AXIE_WITHDRAW_CONTRACT_ADDRESS,
  //       data: WITHDRAW_CONTRACT.methods
  //         .withdraw(
  //           // {
  //           //   owner: rawAddress,
  //           //   nonce: String(nonce),
  //           //   expiredAt: String(Math.round(Date.now() / 1000) + 100),
  //           //   assets: [{ erc: 0, addr: SLP_CONTRACT_ADDRESS, id: "0", quantity: String(options?.total) }],
  //           //   extraData
  //           // },
  //           [
  //             rawAddress,
  //             String(nonce),
  //             expiredAt,
  //             [
  //               [0, slpTokenObj.tokenAddress, slpTokenObj.tokenId, String(options?.total), slpTokenObj.tokenRarity.toString()]
  //             ],
  //             extraData
  //           ],
  //           getRawSignature(signature),
  //           ["0x97a9107c1793bc407d6f527b77e7fff4d812bece","0xc99a6a985ed2cac1ef41640596c5a5f9f4e19ef5","0x0b7007c13325c48911f73a2dad5fa5dcbf808adc"]
  //         )
  //         .encodeABI(),
  //       gasLimit: web3Read.utils.toHex(500000),
  //       gasPrice: web3Read.utils.toHex(fee ? Number(1000000000 * 20).toString() : '0'),
  //       nonce: web3Read.utils.toHex(ethnonce),
  //       value: web3Read.utils.toHex(0),
  //       chainId: 2020,
  //     };

  //     const res = await sendSignTx(
  //       trezorAccount.serializedPath,
  //       txParams,
  //       ethnonce,
  //     );
  //     console.log('claimSlp -> finish, sendSignTx res', res);
  //     // gameAndChainClaimMapping = true;
  //     gameLastClaimErr = 0;

  //     dataResults.signTxn = res;
  //     // const slpEndBalance = await readSLPBalance(rawAddress);
  //     // dataResults.slpEndBalance = slpEndBalance;
  //     // web3Read.eth.getTransactionReceipt(res.transactionHash, (data) => { console.log('getTransactionReceipt', data); })
  //     const dataResSuccess = res?.status;
  //     dataResults.signTxnSuccess = dataResSuccess;
  //     // const dataResSuccess = Number(dataResults.slpEndBalance) - Number(dataResults.slpStartBalance) >= ingameSLP && ingameSLP > 0;
  //     dataResults.success = dataResSuccess;
  //     // console.log('end start ingame', Number(dataResults.slpEndBalance), Number(dataResults.slpStartBalance), ingameSLP);
  //     if (!dataResSuccess) throw new Error('Claim nothing');
  //   } catch (error) {
  //     console.log('claim', error);
  //     dataResults.success = false;
  //     const err = error as any;
  //     dataResults.error = err;
  //     if (gameLastClaimErr > 0)
  //       dataResults.errorData = { lastClaimError: gameLastClaimErr }
  //   }
  //   // finally {
  //   //   const resultsProcess = { ...dataResults };
  //   //   return resultsProcess;
  //   // }

  //   const resultsProcess = { ...dataResults };
  //   return resultsProcess;
  // };

  // const transferSlp = async (params: ITransferSlpRequest) => {
  //   const { signedRawTx } = await getSignedRawTransferTx(params);
  //   return await web3Write.eth.sendSignedTransaction(signedRawTx);
  // };
  
  // const testTransferSlp = async () => {
  //   try {
  //     console.log('start')
  //     const nonce = await web3Read.eth.getTransactionCount('0x4e13fe248510d2de8ddb1b34b6a5d03133a43580');
  //     console.log('step nonce', nonce)
  //     const signature = await web3Write.eth.personal.sign('msg sign test', '0xa69ba6d61d20f69b112c02c8577b82abeb5b4570', 'pwd_test')
  //     console.log('===signature', signature)
  //     // const signature = await web3Write.eth.sign(SLP_CONTRACT.methods.transfer('0xa69ba6d61d20f69b112c02c8577b82abeb5b4570', 1).encodeABI(), '0xa69ba6d61d20f69b112c02c8577b82abeb5b4570')
  //     // const signTx = await web3Write.eth.accounts.signTransaction({
  //     //   from: "0x4e13fe248510d2de8ddb1b34b6a5d03133a43580",
  //     //   gasPrice: '0',
  //     //   gas: '150000',
  //     //   to: '0xa69ba6d61d20f69b112c02c8577b82abeb5b4570',
  //     //   value: '1',
  //     //   data: SLP_CONTRACT.methods.transfer('0xa69ba6d61d20f69b112c02c8577b82abeb5b4570', 1).encodeABI()
  //     // }, 'Private key must be 32 bytes long')
  //     // console.log('step signTx')
  //     // const serializedTransaction = utils.serializeTransaction(
  //     //   { 
  //     //     to: SLP_CONTRACT_ADDRESS as string,
  //     //     data: SLP_CONTRACT.methods.transfer('0xa69ba6d61d20f69b112c02c8577b82abeb5b4570', 1).encodeABI(),
  //     //     gasLimit: web3Read.utils.toHex('150000'),
  //     //     gasPrice: web3Read.utils.toHex('0'),
  //     //     // nonce: web3Read.utils.toHex(nonce),
  //     //     nonce,
  //     //     value: web3Read.utils.toHex(0),
  //     //     chainId: 2020,
  //     //   },
  //     //   // signature
  //     //   { 
  //     //     v: parseInt(signTx.v.substring(2), 16),
  //     //     r: signTx.r,
  //     //     s: signTx.s,
  //     //   },
  //     // );
  //     // console.log('step serializedTransaction')
  //     // const receipt = await web3Write.eth.sendSignedTransaction(signature);
  //     // console.log('====receipt====', receipt)
  //   } catch (error) {
  //     console.log('testTransferSlp', error)
  //   }
  // }

  // const consolidate = async (params: IConsolidateSlpRequest) => {
  //   // const target_wallet = 'ronin:800645c2e37e2d513fbef4a411ac8a65d3a14040';
  //   // const fakeParams = {
  //   //   accounts: [
  //   //     { wallet: 'ronin:a69ba6d61d20f69b112c02c8577b82abeb5b4570', scholar_share: 10, scholar_id: 1 },
  //   //     { wallet: 'ronin:894468e0e386736997baf314d40bdc28d6d6a379', scholar_share: 10, scholar_id: 1 },
  //   //   ]
  //   // }
  //   // return await consolidateSingle('1', 10)
  //   const results = {
  //     success: false,
  //     error: null,
  //     success_process: [],
  //   };

  //   try {
  //     await getAccounts();
  //     for (const acc of params.accounts) {
  //       const claimSlpRes = await claimSlp(acc.wallet);
  //       if (claimSlpRes.success) {
  //         // await claim(acc.id);
  //         if (acc?.scholar_id && acc?.scholar_share) {
  //           const tranferRes = await transferSlp({
  //             amount: acc.scholar_share,
  //             from: acc.wallet,
  //             to: TARGET_WALLET,
  //           });
  //           console.log('consolidate - tranferRes', tranferRes);
  //           // update balance
  //           await consolidateSingle(acc.scholar_id, acc.scholar_share);
  //         }

  //         results.success = true;
  //         (results.success_process as Array<Record<string, any>>).push(acc);
  //       } else {
  //         // break;
  //         console.log('consolidate - claim err', claimSlpRes?.error);
  //         // throw new Error('Claim Error')
  //         results.success = false;
  //         results.error = new Error(
  //           (claimSlpRes?.error as any)?.message,
  //         ) as any;
  //       }
  //     }
  //   } catch (error: any) {
  //     console.log('consolidate error: ', error);
  //     // throw new Error(error?.message)
  //     results.success = false;
  //     results.error = new Error(error) as any;
  //   }

  //   return results;
  // };

  // const claimSLPMulti = async (params: any) => {
  //   const results = {
  //     success: false,
  //     error: null,
  //     success_process: [],
  //     claimed_total: 0,
  //   };
  //   const resultLogs: any[] = [];
  //   let claimedTotal = 0;

  //   try {

  //     await getAccounts({ disableCached: true });
  //     for (const acc of params.accounts) {
  //       // console.log('acc ', acc);
  //       const claimSlpRes = await claimSlp(acc.wallet, { email: acc?.account_email, password: acc?.account_password, last_claim_error: acc?.last_claim_error, total: acc?.total });
  //       console.log('claimSLPMulti - claim res', claimSlpRes);
  //       const resultLogsItem = {
  //         email: acc?.account_email,
  //         wallet: acc.wallet,
  //         success: null,
  //         error: null
  //       }
  //       if (claimSlpRes.success) {
  //         // update db
  //         await claim(acc.id, { amount: Number(acc?.total || 0), txnHash: (claimSlpRes?.signTxn as any)?.transactionHash });
  //         (results.success_process as Array<Record<string, any>>).push(acc);
  //         resultLogs.push({
  //           ...resultLogsItem,
  //           success: true
  //         });
  //         claimedTotal += Number(acc?.total || 0)
  //       } else {
  //         // await claim(acc.id, { amount: 0, error: true, lastClaimError: claimSlpRes.errorData?.lastClaimError })
  //         resultLogs.push({
  //           ...resultLogsItem,
  //           success: false,
  //           error: claimSlpRes?.error,
  //           errorMessage: (claimSlpRes?.error as any)?.message,
  //           troubleShoot: defineErrKeyAndTroubleShoot(claimSlpRes?.error || null)
  //         })
  //       }

  //       // if (claimSlpRes.success) {
  //       //   // update db
  //       //   await claim(acc.id);

  //       //   results.success = true;
  //       //   (results.success_process as Array<Record<string, any>>).push(acc);
  //       // } else {
  //       //   console.log('claimSLPMulti - claim err', claimSlpRes?.error);
  //       //   results.success = false;
  //       //   results.error = new Error(
  //       //     (claimSlpRes?.error as any)?.message,
  //       //   ) as any;
  //       //   break;
  //       // }
  //     }

  //     try {
  //       await addHistoricalTxn({
  //         action: 'claim',
  //         gameId: params?.gameId,
  //         transactions: resultLogs?.map(l => ({
  //           accountEmail: l?.email,
  //           wallet: l?.wallet,
  //           status: l?.success ? 'success' : 'failed',
  //           errorKey: l?.troubleShoot?.errorKey,
  //           errorMessage: l?.troubleShoot?.errorMessage?.length > 255 ? l?.troubleShoot?.errorMessage?.splice?.(0, 240) || 'Trouble Shoot - Error' : l?.troubleShoot?.errorMessage,
  //           troubleShooting: l?.troubleShoot?.errorTroubleShoot?.length > 255 ? l?.troubleShoot?.errorTroubleShoot?.splice?.(0, 240) || 'Trouble Shoot - Error' : l?.troubleShoot?.errorTroubleShoot,
  //         }))
  //       })
  //     } catch (error) {
  //       console.log('add history error', error)
  //     }

  //     if (claimedTotal == 0)
  //       throw new Error('Nothing claimed');

  //     results.success = true;
  //     results.claimed_total = claimedTotal;

  //   } catch (error: any) {
  //     console.log('claimSLPMulti error: ', error);
  //     results.success = false;
  //     results.error = new Error(error) as any;
  //   }
  //   console.log('CLAIM RESULT LOGS', resultLogs)

  //   return results;
  // };

  // const distributeMulti = async (params: any) => {
  //   // const target_wallet = 'ronin:800645c2e37e2d513fbef4a411ac8a65d3a14040';
  //   // const rawAddress = getRawAddressFromRoninAddress(trezorAccount.address);

  //   const results = {
  //     success: false,
  //     error: null,
  //     success_process: [],
  //     distributed_total: 0
  //   };
  //   const resultLogs: any[] = [];
  //   let distributedTotal = 0;

  //   try {
  //     const gameId = params.gameId;
  //     const gameGuildWallet = params.guildGameWallet;
  //     if (!gameGuildWallet) throw new Error('Missing main guild wallet');
  //     await getAccounts({ disableCached: true });
  //     for (const acc of params.accounts) {
  //       const resultLogsItem = {
  //         email: acc?.account_email,
  //         wallet: acc.wallet,
  //         success: null,
  //         error: null
  //       }
  //       try {
  //         // if (!acc?.scholar_id || !acc?.scholar_share || acc?.scholar_share <= 0)
  //         //   throw new Error('Missing scholar or SLP amount');

  //         const [trezorAccount, slpStartBalance] = await Promise.all([
  //           getAccountFromAddress(acc.wallet),
  //           readSLPBalance(getRawAddressFromRoninAddress(acc.wallet)),
  //         ]);
  //         const rawAddress = getRawAddressFromRoninAddress(trezorAccount.address);
  //         if (slpStartBalance < Number(acc.scholar_share) + Number(acc.manager_share))
  //           // throw new Error(`Account hasn't enough SLP`);
  //           throw new TrezorError({
  //             errorKey: TrezorError.ErrorKeys.ASSET_AMOUNT_NOT_ENOUGH,
  //             message: `Account hasn't enough SLP`,
  //             originError: new Error(`Account hasn't enough SLP`),
  //           });
  //         // return { ...dataResults, success: true, accessTokenRes: accessToken }
  //         const balance = await readNativeTokenBalance(rawAddress);
  //         const RON = Number(balance.amount || 0)

  //         if (acc?.scholar_id && acc?.scholar_share > 0) {
  //           const tranferRes = await transferSlp({
  //             amount: Number(acc.scholar_share),
  //             from: rawAddress,
  //             to: acc?.scholar_wallet || TARGET_WALLET,
  //             fee: RON >= RON_FEE
  //           });
  //           console.log('consolidate - scholarTranferRes', tranferRes);
  //           // update balance
  //           await distributeSingle(
  //             gameId,
  //             acc.scholar_id,
  //             Number(acc.scholar_share),
  //             tranferRes?.transactionHash,
  //           );
  //         }

  //         const mngTranferRes = await transferSlp({
  //           amount: Number(acc.manager_share),
  //           from: rawAddress,
  //           to: gameGuildWallet,
  //           fee: RON >= RON_FEE
  //         });
  //         console.log('consolidate - mngTranferRes', mngTranferRes);
  //         // update balance
  //         await distributeToManagerSingle(
  //           gameId,
  //           // acc.scholar_id,
  //           acc.id,
  //           Number(acc.manager_share),
  //           mngTranferRes?.transactionHash,
  //         );

  //         (results.success_process as Array<Record<string, any>>).push(acc);
  //         resultLogs.push({
  //           ...resultLogsItem,
  //           success: true
  //         });
  //         distributedTotal += (Number(acc?.scholar_share || 0) + Number(acc?.manager_share || 0));

  //       } catch (error: any) {
  //         resultLogs.push({
  //           ...resultLogsItem,
  //           success: false,
  //           error: error,
  //           errorMessage: (error as any)?.message,
  //           troubleShoot: defineErrKeyAndTroubleShoot(error)
  //         })
  //       }
  //     }

  //     await addHistoricalTxn({
  //       action: 'distribute',
  //       gameId: gameId,
  //       transactions: resultLogs?.map(l => ({
  //         accountEmail: l?.email,
  //         wallet: l?.wallet,
  //         status: l?.success ? 'success' : 'failed',
  //         errorKey: l?.troubleShoot?.errorKey,
  //         errorMessage: l?.troubleShoot?.errorMessage,
  //         troubleShooting: l?.troubleShoot?.errorTroubleShoot,
  //       }))
  //     })

  //     if (distributedTotal == 0)
  //       throw new Error('Nothing distributed');

  //     results.success = true;
  //     results.distributed_total = distributedTotal;
  //     // (results.success_process as Array<Record<string, any>>).push(acc);

  //   } catch (error: any) {
  //     console.log('distributeMulti error: ', error);
  //     // throw new Error(error?.message)
  //     results.success = false;
  //     results.error = new Error(error) as any;
  //   }
  //   console.log('DISTRIBUTE RESULT LOGS', resultLogs)

  //   return results;
  // };

  // const sendBonusMulti = async (params: any) => {
  //   const results = {
  //     success: false,
  //     error: null,
  //     success_process: [],
  //   };

  //   try {
  //     const gameId = params.gameId;
  //     await getAccounts();
  //     for (const acc of params.accounts) {
  //       // api request - id, amount, transactionHash
  //       const [trezorAccount, slpStartBalance] = await Promise.all([
  //         getAccountFromAddress(acc.wallet),
  //         readSLPBalance(getRawAddressFromRoninAddress(acc.wallet)),
  //       ]);

  //       if (slpStartBalance < acc.amount)
  //         throw new Error(`Account ${acc.wallet} hasn't enough SLP`);

  //       const rawAddress = getRawAddressFromRoninAddress(trezorAccount.address);
  //       const tranferRes = await transferSlp({
  //         amount: Number(acc.amount),
  //         from: rawAddress,
  //         to: TARGET_WALLET,
  //       });
  //       console.log('sendBonusMulti - tranferRes', tranferRes);

  //       // update db
  //       await sendBonusToScholar(gameId, [
  //         { ...acc, transactionHash: tranferRes?.transactionHash },
  //       ]);
  //       // await sendScholarsBonus(
  //       //   [{ ...acc, transactionHash: tranferRes?.transactionHash }]
  //       // )
  //       // console.log('updatedb', updatedb)
  //       results.success = true;
  //       (results.success_process as Array<Record<string, any>>).push({
  //         ...acc,
  //         transactionHash: tranferRes?.transactionHash,
  //       });
  //     }
  //   } catch (error: any) {
  //     console.log('sendBonusMulti error: ', error);
  //     // throw new Error(error?.message)
  //     results.success = false;
  //     results.error = new Error(error) as any;
  //   }

  //   return results;
  // };

  // const sendSignTx = async (
  //   path: string,
  //   txParams: EthereumTransaction,
  //   nonce: number,
  // ) => {
  //   const signTx = await TrezorConnect.ethereumSignTransaction({
  //     path,
  //     transaction: txParams,
  //   });

  //   if (!signTx.success) {
  //     throw new Error(signTx.payload.error);
  //   }

  //   const sig = {
  //     v: parseInt(signTx.payload.v.substring(2), 16),
  //     r: signTx.payload.r,
  //     s: signTx.payload.s,
  //   };
  //   const serializedTransaction = utils.serializeTransaction(
  //     { ...txParams, nonce },
  //     sig,
  //   );
  //   const res: any = await web3Write.eth.sendSignedTransaction(
  //     serializedTransaction,
  //   );
  //   return res;
  // };

  // const getSignedRawTransferTx = async (params: ITransferSlpRequest) => {
  //   const { from, to, amount, fee } = params;

  //   if (amount <= 0 || !Number.isInteger(amount)) {
  //     throw new Error('amount should be an integer and greater than 0');
  //   }

  //   const trezorAccount = await getAccountFromAddress(from);
  //   const rawFromAddress = getRawAddressFromRoninAddress(from);
  //   const rawToAddress = getRawAddressFromRoninAddress(to);
  //   const nonce = await web3Read.eth.getTransactionCount(rawFromAddress);
  //   const txParams = {
  //     to: SLP_CONTRACT_ADDRESS as string,
  //     data: SLP_CONTRACT.methods.transfer(rawToAddress, amount).encodeABI(),
  //     gasLimit: web3Read.utils.toHex('200000'),
  //     // gasPrice : GWEI
  //     gasPrice: web3Read.utils.toHex(fee ? Number(1000000000 * 20).toString() : '0'),
  //     nonce: web3Read.utils.toHex(nonce),
  //     value: web3Read.utils.toHex(0),
  //     chainId: 2020,
  //   };
  //   const signTx = await TrezorConnect.ethereumSignTransaction({
  //     path: trezorAccount.serializedPath,
  //     transaction: txParams,
  //   });

  //   if (!signTx.success) {
  //     throw new Error(signTx.payload.error);
  //   }

  //   const sig = {
  //     v: parseInt(signTx.payload.v.substring(2), 16),
  //     r: signTx.payload.r,
  //     s: signTx.payload.s,
  //   };
  //   const serializedTransaction = utils.serializeTransaction(
  //     { ...txParams, nonce },
  //     sig,
  //   );

  //   return { signedRawTx: serializedTransaction };
  // };

  return (
    <TrezorContext.Provider
      value={{
        getAccounts,
        // claimSlp,
        // transferSlp,
        // getSignedRawTransferTx,
        // consolidate,
        // claimSLPMulti,
        // distributeMulti,
        // sendBonusMulti,
        // testTransferSlp
      }}
    >
      {children}
    </TrezorContext.Provider>
  );
};
