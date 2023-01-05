import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EthereumAddress } from 'trezor-connect';

export interface IWeb3State {
  trezorAccounts: EthereumAddress[];
}

const initialState: IWeb3State = {
  trezorAccounts: [],
};

export const web3Slice = createSlice({
  name: 'web3',
  initialState,
  reducers: {
    setTrezorAccounts: (
      state: IWeb3State,
      action: PayloadAction<EthereumAddress[]>,
    ) => {
      state.trezorAccounts = action.payload;
    },
  },
});

export const { actions: web3Actions, reducer: web3Reducer } = web3Slice;
