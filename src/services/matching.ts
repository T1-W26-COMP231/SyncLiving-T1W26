// FCRM Engine — Fuzzy Centroid Roommate Matching v1.1
// Implements the full pipeline from matchingAlgorithm.md §3.5

// Dimension weights: [Social, Acoustic, Sanitary, Rhythm, Boundary]
const WEIGHTS = [0.25, 0.35, 0.20, 0.15, 0.05];
const D_MAX = 0.8;
const ACOUSTIC_IDX = 1;
const ACOUSTIC_GATE = 0.4;
const ACOUSTIC_PENALTY = 0.80;
export const SURFACE_THRESHOLD = 65;

export type MatchTier = 'strong' | 'good' | 'borderline' | 'incompatible';

export interface ConflictTrigger {
  type: string;
  clause: string;
}

export interface MatchResult {
  score: number;
  tier: MatchTier;
  conflicts: ConflictTrigger[];
}

// Step 1–2: Weighted Euclidean distance between two 5-element vectors
function euclideanDist(A: number[], B: number[]): number {
  return Math.sqrt(
    WEIGHTS.reduce((sum, w, i) => sum + w * (A[i] - B[i]) ** 2, 0)
  );
}

// Steps 1–6: Full FCRM pipeline
export function computeScore(
  vWd_A: number[],
  vWe_A: number[],
  vWd_B: number[],
  vWe_B: number[]
): number {
  const D_wd = euclideanDist(vWd_A, vWd_B);
  const D_we = euclideanDist(vWe_A, vWe_B);

  // Step 3: Temporal aggregation (70/30 weekday/weekend)
  const finalDist = D_wd * 0.70 + D_we * 0.30;

  // Step 4: Normalise to [0, 100]
  let score = (1 - finalDist / D_MAX) * 100;

  // Step 5: Acoustic hard-gate penalty
  const acousticGap = Math.abs(vWd_A[ACOUSTIC_IDX] - vWd_B[ACOUSTIC_IDX]);
  if (acousticGap > ACOUSTIC_GATE) score *= ACOUSTIC_PENALTY;

  // Step 6: Clamp
  return Math.max(0, Math.min(100, score));
}

// §4.2: Evaluate conflict triggers for a matched pair
export function computeConflicts(
  vWd_A: number[],
  vWe_A: number[],
  vWd_B: number[],
  vWe_B: number[]
): ConflictTrigger[] {
  const triggers: ConflictTrigger[] = [];

  const deltaS = Math.abs(vWd_A[0] - vWd_B[0]);
  const deltaA = Math.abs(vWd_A[1] - vWd_B[1]);
  const deltaC = Math.abs(vWd_A[2] - vWd_B[2]);
  const deltaR = Math.abs(vWd_A[3] - vWd_B[3]);
  const deltaB = Math.abs(vWd_A[4] - vWd_B[4]);

  // Weekend lifestyle divergence score delta
  const scoreWd = computeScore(vWd_A, vWd_A, vWd_B, vWd_B);
  const scoreWe = computeScore(vWe_A, vWe_A, vWe_B, vWe_B);
  const deltaSim = Math.abs(scoreWd - scoreWe) / 100;

  if (deltaS > 0.5) {
    triggers.push({
      type: 'Social Density',
      clause: 'Notice required 24h prior for overnight guests; max 2 overnight stays/week.',
    });
  }
  if (deltaA > 0.5) {
    triggers.push({
      type: 'Acoustic Environment',
      clause: 'Quiet hours 11:00 PM – 07:00 AM daily.',
    });
  }
  if (deltaC > 0.5) {
    triggers.push({
      type: 'Sanitary Standards',
      clause: 'Common area dishes cleared within 4h of use. Surfaces wiped every Sunday.',
    });
  }
  if (deltaR < 0.15) {
    triggers.push({
      type: 'Circadian Rhythm (Resource Bottleneck)',
      clause: 'Morning bathroom schedule: Roommate A 7:30–8:00 AM; Roommate B 8:00–8:30 AM.',
    });
  }
  if (deltaR > 0.6) {
    triggers.push({
      type: 'Circadian Rhythm (Extreme Mismatch)',
      clause: 'Quiet hours from 11:00 PM weeknights. No hairdryer, loud cooking, or speakers.',
    });
  }
  if (deltaB > 0.5) {
    triggers.push({
      type: 'Boundary Philosophy',
      clause: "Strict 'Ask Before Using' policy for personal groceries and toiletries.",
    });
  }
  if (deltaSim > 0.4) {
    triggers.push({
      type: 'Weekend Lifestyle Divergence',
      clause: 'Quiet hours shift to 01:00 AM on Friday/Saturday nights only.',
    });
  }

  return triggers;
}

// §5.2: Score → tier
export function getMatchTier(score: number): MatchTier {
  if (score >= 80) return 'strong';
  if (score >= 65) return 'good';
  if (score >= 40) return 'borderline';
  return 'incompatible';
}

// Full result including tier and conflicts
export function computeMatchResult(
  vWd_A: number[],
  vWe_A: number[],
  vWd_B: number[],
  vWe_B: number[]
): MatchResult {
  const score = computeScore(vWd_A, vWe_A, vWd_B, vWe_B);
  return {
    score,
    tier: getMatchTier(score),
    conflicts: computeConflicts(vWd_A, vWe_A, vWd_B, vWe_B),
  };
}
