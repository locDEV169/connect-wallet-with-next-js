import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';

import { get50Accounts } from '../services';
import { web3Actions } from 'stores/web3-slice';

export const useTrezorAccount = () => {
  const { trezorAccounts } = useSelector((state: any) => state.web3);
  const dispatch = useDispatch();

  const getFullAccounts = useCallback(async () => {
    if (trezorAccounts.length) {
      return trezorAccounts;
    }

    const trezorGetAccountResponse = await get50Accounts();

    if (!trezorGetAccountResponse.success) {
      toast.error(trezorGetAccountResponse.payload.error);
      return trezorAccounts;
    }

    dispatch(web3Actions.setTrezorAccounts(trezorGetAccountResponse.payload));

    return trezorGetAccountResponse.payload;
  }, [dispatch, trezorAccounts]);

  return {
    getFullAccounts,
    trezorAccounts,
  };
};
