import {
  shortenAddress,
  formatAmount,
  parsePositiveAmount,
  createAxionveraVaultSdk
} from '../contractHelpers';

const ASSET_ID = 'native-xlm';
const ASSET_SYMBOL = 'XLM';

jest.mock('../apiResilience', () => ({
  withApiResilience: (fn: any) => fn,
  withErrorHandling: (fn: any) => fn,
  safeApiCall: async (fn: any) => ({ data: await fn() }),
}));

jest.mock('../networkConfig', () => ({
  NETWORK: 'testnet',
}));

describe('contractHelpers utility', () => {
  describe('shortenAddress', () => {
    it('should shorten address', () => {
      expect(shortenAddress('GABC123456789XYZ', 3)).toBe('GAB...XYZ');
    });

    it('should return empty string for no address', () => {
      expect(shortenAddress('')).toBe('');
    });

    it('should return original if short enough', () => {
      expect(shortenAddress('ABC', 6)).toBe('ABC');
    });
  });

  describe('formatAmount', () => {
    it('should format numbers', () => {
      expect(formatAmount('1000')).toBe('1,000');
    });

    it('should return original if not a number', () => {
      expect(formatAmount('abc')).toBe('abc');
    });
  });

  describe('parsePositiveAmount', () => {
    it('should parse valid positive amounts', () => {
      expect(parsePositiveAmount('10.5')).toBe('10.5');
    });

    it('should return null for invalid amounts', () => {
      expect(parsePositiveAmount('-1')).toBeNull();
      expect(parsePositiveAmount('abc')).toBeNull();
      expect(parsePositiveAmount('0')).toBeNull();
    });
  });

  describe('createAxionveraVaultSdk', () => {
    let sdk: any;

    beforeAll(() => {
      (global as any).crypto = {
        randomUUID: () => 'test-uuid'
      };
    });

    beforeEach(() => {
      localStorage.clear();
      sdk = createAxionveraVaultSdk();
    });

    afterAll(() => {
      localStorage.clear();
    });

    it('should get balances (mocked)', async () => {
      const balances = await sdk.getBalances({ walletAddress: 'G_BAL', network: 'testnet', assetId: ASSET_ID });
      expect(balances).toEqual({ balance: '0', rewards: '0' });
    });

    it('should deposit (mocked)', async () => {
      const tx = await sdk.deposit({
        walletAddress: 'G_DEP',
        network: 'testnet',
        amount: '100',
        assetId: ASSET_ID,
        assetSymbol: ASSET_SYMBOL,
        tokenContractId: null
      });
      expect(tx.status).toBe('success');
      expect(tx.amount).toBe('100');

      const balances = await sdk.getBalances({ walletAddress: 'G_DEP', network: 'testnet', assetId: ASSET_ID });
      expect(balances.balance).toBe('100');
    });

    it('should withdraw (mocked)', async () => {
      await sdk.deposit({
        walletAddress: 'G_WIT',
        network: 'testnet',
        amount: '100',
        assetId: ASSET_ID,
        assetSymbol: ASSET_SYMBOL,
        tokenContractId: null
      });

      const tx = await sdk.withdraw({
        walletAddress: 'G_WIT',
        network: 'testnet',
        amount: '40',
        assetId: ASSET_ID,
        assetSymbol: ASSET_SYMBOL,
        tokenContractId: null
      });
      expect(tx.status).toBe('success');

      const balances = await sdk.getBalances({ walletAddress: 'G_WIT', network: 'testnet', assetId: ASSET_ID });
      expect(balances.balance).toBe('60');
    });

    it('should claim rewards (mocked)', async () => {
      await sdk.deposit({
        walletAddress: 'G_CLA',
        network: 'testnet',
        amount: '100',
        assetId: ASSET_ID,
        assetSymbol: ASSET_SYMBOL,
        tokenContractId: null
      });

      const tx = await sdk.claimRewards({
        walletAddress: 'G_CLA',
        network: 'testnet',
        assetId: ASSET_ID,
        assetSymbol: ASSET_SYMBOL
      });
      expect(tx.status).toBe('success');

      const balances = await sdk.getBalances({ walletAddress: 'G_CLA', network: 'testnet', assetId: ASSET_ID });
      expect(balances.balance).toBe('101');
      expect(balances.rewards).toBe('0');
    });

    it('should get transactions (mocked)', async () => {
      await sdk.deposit({
        walletAddress: 'G_TXS',
        network: 'testnet',
        amount: '100',
        assetId: ASSET_ID,
        assetSymbol: ASSET_SYMBOL,
        tokenContractId: null
      });
      const txs = await sdk.getTransactions({ walletAddress: 'G_TXS', network: 'testnet', assetId: ASSET_ID });
      expect(txs.length).toBeGreaterThan(0);
    });

    it('should handle malformed storage gracefully', async () => {
      localStorage.setItem('axionvera:vault:testnet:G_MAL', 'invalid-json');
      const balances = await sdk.getBalances({ walletAddress: 'G_MAL', network: 'testnet', assetId: ASSET_ID });
      expect(balances.balance).toBe('0');
    });
  });
});
