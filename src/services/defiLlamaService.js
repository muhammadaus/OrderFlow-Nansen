/**
 * DefiLlama Service Stub
 * This is a placeholder - real implementation is on feature/defilama-integration branch
 */

export class DefiLlamaService {
  constructor() {
    console.warn('DefiLlamaService: Using stub. Switch to feature/defilama-integration branch for real API.');
  }

  async connect() {
    throw new Error('DefiLlama service not available. Using mock data.');
  }

  getAvailableTypes() {
    return [];
  }
}

export default DefiLlamaService;
