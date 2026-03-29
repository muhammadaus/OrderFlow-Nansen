/**
 * On-Chain Data Service
 *
 * This service provides on-chain data using ethers.js:
 * - Mempool monitoring for pending transactions
 * - DEX swap event listening (Uniswap, Sushiswap)
 * - Large transfer detection
 * - Gas price tracking
 *
 * Uses Alchemy RPC from environment variables
 *
 * Usage:
 * import { OnchainService } from './services/onchainService';
 * const onchain = new OnchainService();
 * await onchain.connect();
 * onchain.onSwap((swap) => console.log(swap));
 */

import { ethers } from 'ethers';

// Uniswap V3 Pool ABI (minimal for Swap event)
const UNISWAP_V3_POOL_ABI = [
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'
];

// Uniswap V2 Pair ABI (minimal for Swap event)
const UNISWAP_V2_PAIR_ABI = [
  'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)'
];

// ERC20 Transfer ABI
const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

// Common token addresses (Ethereum mainnet)
const TOKENS = {
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EesD1eC1EECD8',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
};

// Uniswap V3 WETH/USDC Pool
const UNISWAP_V3_WETH_USDC = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640';

// Sushiswap WETH/USDC Pair
const SUSHISWAP_WETH_USDC = '0x397FF1542f962076d0BFE58eA045FfA2d347ACa0';

class OnchainService {
  constructor() {
    this.provider = null;
    this.wsProvider = null;
    this.listeners = {
      swap: [],
      largeTransfer: [],
      pendingTx: [],
      gasPrice: []
    };
    this.isConnected = false;
    this.contracts = new Map();
  }

  /**
   * Connect to Ethereum network via Alchemy
   */
  async connect() {
    try {
      // Get RPC URL from environment
      const rpcUrl = import.meta.env.VITE_ALCHEMY_RPC_URL ||
                     import.meta.env.VITE_INFURA_RPC_URL ||
                     'https://eth-mainnet.g.alchemy.com/v2/demo';

      const wsUrl = rpcUrl.replace('https', 'wss').replace('/v2/', '/v2/ws/');

      // Create providers
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      // WebSocket provider for real-time events (optional, may fail without valid key)
      try {
        this.wsProvider = new ethers.WebSocketProvider(wsUrl);
      } catch (e) {
        console.warn('WebSocket connection failed, using HTTP polling');
      }

      // Test connection
      const network = await this.provider.getNetwork();
      console.log(`Connected to ${network.name} (chainId: ${network.chainId})`);

      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Failed to connect to Ethereum:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect from Ethereum network
   */
  disconnect() {
    if (this.wsProvider) {
      this.wsProvider.destroy();
    }
    this.isConnected = false;
    this.contracts.clear();
    console.log('Disconnected from Ethereum');
  }

  /**
   * Listen to Uniswap V3 swaps
   */
  listenToUniswapV3Swaps(poolAddress = UNISWAP_V3_WETH_USDC) {
    if (!this.provider) {
      console.error('Not connected to Ethereum');
      return;
    }

    const pool = new ethers.Contract(
      poolAddress,
      UNISWAP_V3_POOL_ABI,
      this.provider
    );

    pool.on('Swap', (sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick, event) => {
      const swap = this.normalizeV3Swap({
        sender,
        recipient,
        amount0: amount0.toString(),
        amount1: amount1.toString(),
        sqrtPriceX96: sqrtPriceX96.toString(),
        liquidity: liquidity.toString(),
        tick,
        transactionHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber
      });

      this.emit('swap', swap);
    });

    this.contracts.set(`uniV3-${poolAddress}`, pool);
    console.log(`Listening to Uniswap V3 swaps on ${poolAddress}`);
  }

  /**
   * Listen to Uniswap V2 / Sushiswap swaps
   */
  listenToUniswapV2Swaps(pairAddress = SUSHISWAP_WETH_USDC) {
    if (!this.provider) {
      console.error('Not connected to Ethereum');
      return;
    }

    const pair = new ethers.Contract(
      pairAddress,
      UNISWAP_V2_PAIR_ABI,
      this.provider
    );

    pair.on('Swap', (sender, amount0In, amount1In, amount0Out, amount1Out, to, event) => {
      const swap = this.normalizeV2Swap({
        sender,
        to,
        amount0In: amount0In.toString(),
        amount1In: amount1In.toString(),
        amount0Out: amount0Out.toString(),
        amount1Out: amount1Out.toString(),
        transactionHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber
      });

      this.emit('swap', swap);
    });

    this.contracts.set(`uniV2-${pairAddress}`, pair);
    console.log(`Listening to V2/Sushi swaps on ${pairAddress}`);
  }

  /**
   * Listen to large ERC20 transfers (whales)
   */
  listenToLargeTransfers(tokenAddress, minValueUSD = 100000) {
    if (!this.provider) {
      console.error('Not connected to Ethereum');
      return;
    }

    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);

    token.on('Transfer', async (from, to, value, event) => {
      try {
        const decimals = await token.decimals();
        const symbol = await token.symbol();
        const amount = parseFloat(ethers.formatUnits(value, decimals));

        // Estimate USD value (simplified)
        const estimatedUSD = this.estimateUSDValue(symbol, amount);

        if (estimatedUSD >= minValueUSD) {
          const transfer = {
            time: Date.now(),
            from,
            to,
            amount,
            symbol,
            estimatedUSD,
            transactionHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber,
            type: this.classifyTransfer(from, to)
          };

          this.emit('largeTransfer', transfer);
        }
      } catch (error) {
        console.error('Error processing transfer:', error);
      }
    });

    this.contracts.set(`transfer-${tokenAddress}`, token);
    console.log(`Listening to large transfers on ${tokenAddress}`);
  }

  /**
   * Monitor mempool for pending transactions (requires Flashbots or special RPC)
   */
  async monitorMempool() {
    if (!this.wsProvider) {
      console.warn('WebSocket provider not available for mempool monitoring');
      return;
    }

    this.wsProvider.on('pending', async (txHash) => {
      try {
        const tx = await this.provider.getTransaction(txHash);
        if (tx) {
          const pendingTx = this.normalizePendingTx(tx);
          this.emit('pendingTx', pendingTx);
        }
      } catch (error) {
        // Transaction may have been mined already
      }
    });

    console.log('Monitoring mempool for pending transactions');
  }

  /**
   * Start gas price polling
   */
  startGasPricePolling(intervalMs = 10000) {
    const poll = async () => {
      try {
        const feeData = await this.provider.getFeeData();
        const gasPrice = {
          time: Date.now(),
          gasPrice: parseFloat(ethers.formatUnits(feeData.gasPrice || 0, 'gwei')),
          maxFeePerGas: parseFloat(ethers.formatUnits(feeData.maxFeePerGas || 0, 'gwei')),
          maxPriorityFeePerGas: parseFloat(ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, 'gwei'))
        };

        this.emit('gasPrice', gasPrice);
      } catch (error) {
        console.error('Failed to fetch gas price:', error);
      }
    };

    poll(); // Initial fetch
    this.gasInterval = setInterval(poll, intervalMs);
  }

  /**
   * Normalize Uniswap V3 swap data
   */
  normalizeV3Swap(data) {
    // Calculate price from sqrtPriceX96
    const sqrtPrice = BigInt(data.sqrtPriceX96);
    const price = Number((sqrtPrice * sqrtPrice) / (BigInt(2) ** BigInt(192)));

    return {
      time: Date.now(),
      protocol: 'uniswap_v3',
      amount0: parseFloat(ethers.formatUnits(data.amount0, 18)),
      amount1: parseFloat(ethers.formatUnits(data.amount1, 6)), // USDC has 6 decimals
      price,
      side: BigInt(data.amount0) > 0 ? 'sell' : 'buy',
      tick: data.tick,
      transactionHash: data.transactionHash,
      blockNumber: data.blockNumber
    };
  }

  /**
   * Normalize Uniswap V2 swap data
   */
  normalizeV2Swap(data) {
    const isBuy = BigInt(data.amount0In) > 0;

    return {
      time: Date.now(),
      protocol: 'uniswap_v2',
      amount0In: parseFloat(ethers.formatUnits(data.amount0In, 18)),
      amount1In: parseFloat(ethers.formatUnits(data.amount1In, 6)),
      amount0Out: parseFloat(ethers.formatUnits(data.amount0Out, 18)),
      amount1Out: parseFloat(ethers.formatUnits(data.amount1Out, 6)),
      side: isBuy ? 'buy' : 'sell',
      transactionHash: data.transactionHash,
      blockNumber: data.blockNumber
    };
  }

  /**
   * Normalize pending transaction
   */
  normalizePendingTx(tx) {
    return {
      time: Date.now(),
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: parseFloat(ethers.formatEther(tx.value)),
      gasPrice: parseFloat(ethers.formatUnits(tx.gasPrice || 0, 'gwei')),
      gasLimit: tx.gasLimit.toString(),
      nonce: tx.nonce,
      data: tx.data.substring(0, 10) // Function selector
    };
  }

  /**
   * Classify transfer type
   */
  classifyTransfer(from, to) {
    // Known exchange addresses (simplified)
    const exchanges = [
      '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance
      '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d', // Coinbase
    ];

    const isFromExchange = exchanges.some(e => e.toLowerCase() === from.toLowerCase());
    const isToExchange = exchanges.some(e => e.toLowerCase() === to.toLowerCase());

    if (isFromExchange && !isToExchange) return 'exchange_withdrawal';
    if (!isFromExchange && isToExchange) return 'exchange_deposit';
    return 'whale_transfer';
  }

  /**
   * Estimate USD value (simplified)
   */
  estimateUSDValue(symbol, amount) {
    const prices = {
      'WETH': 2800,
      'ETH': 2800,
      'USDC': 1,
      'USDT': 1,
      'DAI': 1,
      'WBTC': 95000
    };

    return amount * (prices[symbol] || 0);
  }

  /**
   * Event emitter
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * Subscribe to swap events
   */
  onSwap(callback) {
    this.listeners.swap.push(callback);
    return () => {
      this.listeners.swap = this.listeners.swap.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to large transfer events
   */
  onLargeTransfer(callback) {
    this.listeners.largeTransfer.push(callback);
    return () => {
      this.listeners.largeTransfer = this.listeners.largeTransfer.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to pending transaction events
   */
  onPendingTx(callback) {
    this.listeners.pendingTx.push(callback);
    return () => {
      this.listeners.pendingTx = this.listeners.pendingTx.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to gas price updates
   */
  onGasPrice(callback) {
    this.listeners.gasPrice.push(callback);
    return () => {
      this.listeners.gasPrice = this.listeners.gasPrice.filter(cb => cb !== callback);
    };
  }
}

// React hook for using on-chain data
export const useOnchainData = () => {
  // TODO: Implement React hook with useState and useEffect
  // This is a stub for future implementation
  return {
    swaps: [],
    largeTransfers: [],
    gasPrice: null,
    isConnected: false
  };
};

export { OnchainService, TOKENS };
export default OnchainService;
