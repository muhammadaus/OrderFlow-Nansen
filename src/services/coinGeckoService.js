/**
 * CoinGecko Service Stub
 * This is a placeholder - real implementation is on feature/coingecko-integration branch
 */

export class CoinGeckoService {
  constructor() {
    console.warn('CoinGeckoService: Using stub. Switch to feature/coingecko-integration branch for real API.');
  }

  async connect() {
    throw new Error('CoinGecko service not available. Using mock data.');
  }

  getAvailableTypes() {
    return [];
  }
}

export default CoinGeckoService;
