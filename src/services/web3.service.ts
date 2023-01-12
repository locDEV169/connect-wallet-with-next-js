import ERC20ABI_2 from './axiewithdraw.json';
import axios from 'axios';
import { web3Read } from '../utils';

export const AXIE_WITHDRAW_CONTRACT_ADDRESS = '0x36b628e771b0ca12a135e0a7b8e0394f99dce95b';

export const WITHDRAW_CONTRACT = new web3Read.eth.Contract(ERC20ABI_2 as any, AXIE_WITHDRAW_CONTRACT_ADDRESS);

export const getRawAddressFromRoninAddress = (address: string): string => {
  if (!address) return '';
  if (address.includes('ronin:')) {
    address = address.replace('ronin:', '0x');
  }
  return address.toLocaleLowerCase();
};

export const getRawSignature = (signature: string): string => {
  if (signature && !signature.startsWith('0x')) {
    signature = `0x${signature}`;
  }
  return signature;
};

export const readNativeTokenBalance = async (address: string, chain = 'ronin') => {
  let rawWallet = address;
  let balanceRes = null;

  const nativeTokenBychain: any = {
    ronin: 'RON',
  };
  const results = {
    chain,
    token: nativeTokenBychain[chain],
    amount: '0',
  };

  if (chain === 'ronin') {
    rawWallet = rawWallet.replace('ronin:', '0x');
    balanceRes = await axios.post('https://api.roninchain.com/rpc', {
      params: [rawWallet, 'latest'],
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      id: 1,
    });

    results.amount = web3Read.utils.fromWei(web3Read.utils.hexToNumberString(balanceRes?.data?.result), 'ether');
  }

  return results;
};
