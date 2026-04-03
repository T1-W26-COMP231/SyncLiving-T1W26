import { describe, it, expect } from 'vitest';
import { computeScore, getMatchTier, computeMatchResult } from './matching';

describe('Matching Algorithm', () => {
  const perfectMatch = [0.5, 0.5, 0.5, 0.5, 0.5];
  const oppositeMatch = [1.0, 1.0, 1.0, 1.0, 1.0];
  const zeroMatch = [0.0, 0.0, 0.0, 0.0, 0.0];

  it('should return 100 for a perfect match', () => {
    const score = computeScore(perfectMatch, perfectMatch, perfectMatch, perfectMatch);
    expect(score).toBe(100);
  });

  it('should return a high score for similar vectors', () => {
    const v1 = [0.5, 0.5, 0.5, 0.5, 0.5];
    const v2 = [0.6, 0.6, 0.6, 0.6, 0.6];
    const score = computeScore(v1, v1, v2, v2);
    expect(score).toBeGreaterThan(80);
  });

  it('should return a low score for very different vectors', () => {
    const score = computeScore(zeroMatch, zeroMatch, oppositeMatch, oppositeMatch);
    expect(score).toBeLessThan(40);
  });

  it('should apply acoustic penalty when gap is large', () => {
    // Acoustic index is 1. Gap > 0.4 triggers penalty.
    const v1 = [0.5, 0.1, 0.5, 0.5, 0.5];
    const v2 = [0.5, 0.6, 0.5, 0.5, 0.5]; // Gap is 0.5 > 0.4
    const score = computeScore(v1, v1, v2, v2);
    
    // Without penalty: finalDist = euclideanDist([0.5, 0.1...], [0.5, 0.6...]) 
    // = sqrt(0.35 * (0.5)^2) = sqrt(0.35 * 0.25) = sqrt(0.0875) ≈ 0.2958
    // score = (1 - 0.2958 / 0.8) * 100 ≈ (1 - 0.36975) * 100 ≈ 63.025
    // With 0.8 penalty: 63.025 * 0.8 ≈ 50.42
    expect(score).toBeLessThan(60);
  });

  describe('getMatchTier', () => {
    it('should return strong for scores >= 80', () => {
      expect(getMatchTier(85)).toBe('strong');
      expect(getMatchTier(80)).toBe('strong');
    });

    it('should return good for scores between 65 and 79', () => {
      expect(getMatchTier(75)).toBe('good');
      expect(getMatchTier(65)).toBe('good');
    });

    it('should return borderline for scores between 40 and 64', () => {
      expect(getMatchTier(50)).toBe('borderline');
      expect(getMatchTier(40)).toBe('borderline');
    });

    it('should return incompatible for scores < 40', () => {
      expect(getMatchTier(30)).toBe('incompatible');
    });
  });

  describe('computeMatchResult', () => {
    it('should return full result with conflicts', () => {
      const v1 = [0.1, 0.1, 0.1, 0.1, 0.1];
      const v2 = [0.9, 0.9, 0.9, 0.9, 0.9];
      const result = computeMatchResult(v1, v1, v2, v2);
      
      expect(result.score).toBeDefined();
      expect(result.tier).toBeDefined();
      expect(result.conflicts.length).toBeGreaterThan(0);
      
      // Social Density conflict (deltaS > 0.5)
      expect(result.conflicts.some(c => c.type === 'Social Density')).toBe(true);
    });
  });
});
