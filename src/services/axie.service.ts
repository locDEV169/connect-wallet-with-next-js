import axios from 'axios';
import { IAxieWithdrawTokenRequest, IAxieWithdrawTokenResponse } from './axie.type';

const SKYMAVIS_GAME_ORIGIN_API = 'https://game-api-origin.skymavis.com';

export const axieWithdrawToken = async (params: IAxieWithdrawTokenRequest) => {
  const response = await axios.post<IAxieWithdrawTokenResponse>(
    SKYMAVIS_GAME_ORIGIN_API + '/v2/rpc/items/withdraw',
    {
      items: params.items,
    },
    {
      headers: { authorization: `Bearer ${params.accessToken}` },
    },
  );

  return response.data;
};
