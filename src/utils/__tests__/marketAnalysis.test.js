import { describe, it, expect } from 'vitest';
import { detectMarketStructure, identifySwingPoints } from '../marketAnalysis';

describe('Market Analysis Utils', () => {
  describe('detectMarketStructure', () => {
    it('should detect bullish structure with higher highs and lows', () => {
      const data = [
        { high: 100, low: 90, close: 95 },
        { high: 105, low: 95, close: 100 },
        { high: 110, low: 100, close: 105 },
      ];

      const result = detectMarketStructure(data);
      expect(result.trend).toBe('bullish');
      expect(result.higherHighs).toBeGreaterThan(0);
    });

    it('should detect bearish structure with lower highs and lows', () => {
      const data = [
        { high: 110, low: 100, close: 105 },
        { high: 105, low: 95, close: 100 },
        { high: 100, low: 90, close: 95 },
      ];

      const result = detectMarketStructure(data);
      expect(result.trend).toBe('bearish');
      expect(result.lowerLows).toBeGreaterThan(0);
    });
  });

  describe('identifySwingPoints', () => {
    it('should identify swing highs and lows', () => {
      const data = [
        { high: 100, low: 90 },
        { high: 110, low: 100 },
        { high: 105, low: 95 },
        { high: 115, low: 105 },
      ];

      const result = identifySwingPoints(data);
      expect(result.swingHighs).toBeDefined();
      expect(result.swingLows).toBeDefined();
      expect(Array.isArray(result.swingHighs)).toBe(true);
    });
  });
});
