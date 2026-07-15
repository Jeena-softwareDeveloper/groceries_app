import { api, unwrap } from './client';
import { ENDPOINTS } from './endpoints';

export const walletApi = {
  fetchWallet: () =>
    unwrap<{ balance: number; transactions: Array<{ id: string; amount: number; type: string; createdAt: string }> }>(
      api.get(ENDPOINTS.CUSTOMER.WALLET),
    ),
};
