/**
 * FCRM Engine — Fuzzy Centroid Roommate Matching v1.1
 * Implements the full pipeline from matchingAlgorithm.md §3.5
 * 
 * The algorithm uses weighted Euclidean distance between 5-dimensional lifestyle vectors
 * representing Social, Acoustic, Sanitary, Rhythm, and Boundary preferences.
 */

// Dimension weights: [Social, Acoustic, Sanitary, Rhythm, Boundary]
// Defined in matchingAlgorithm.md §3.1
const WEIGHTS = [0.25, 0.35, 0.20, 0.15, 0.05];
const D_MAX = 0.8; // Maximum theoretical distance for normalization
const ACOUSTIC_IDX = 1;
const ACOUSTIC_GATE = 0.4;
const ACOUSTIC_PENALTY = 0.80;
export const SURFACE_THRESHOLD = 65;

export type MatchTier = 'strong' | 'good' | 'borderline' | 'incompatible';

/**
 * Represents a conflict identified by the matching engine.
 */
export interface ConflictTrigger {
  type: string;
  clause: string;
}

/**
 * The final result of a match calculation.
 */
export interface MatchResult {
  score: number;
  tier: MatchTier;
  conflicts: ConflictTrigger[];
}

/**
 * Calculates the weighted Euclidean distance between two 5-element vectors.
 * Implements Step 1–2 of the FCRM pipeline.
 * 
 * @param A - Vector A
 * @param B - Vector B
 * @returns The weighted distance
 */
function euclideanDist(A: number[], B: number[]): number {
  return Math.sqrt(
    WEIGHTS.reduce((sum, w, i) => sum + w * (A[i] - B[i]) ** 2, 0)
  );
}

/**
 * Computes the temporal aggregated matching score between two users.
 * Implements Steps 1–6 of the FCRM pipeline (§3.5).
 * 
 * @param vWd_A - Weekday vector of user A
 * @param vWe_A - Weekend vector of user A
 * @param vWd_B - Weekday vector of user B
 * @param vWe_B - Weekend vector of user B
 * @returns A normalized score from 0 to 100
 */
export function computeScore(
  vWd_A: number[],
  vWe_A: number[],
  vWd_B: number[],
  vWe_B: number[]
): number {
  const D_wd = euclideanDist(vWd_A, vWd_B);
  const D_we = euclideanDist(vWe_A, vWe_B);

  // Step 3: Temporal aggregation (70/30 weekday/weekend weight)
  const finalDist = D_wd * 0.70 + D_we * 0.30;

  // Step 4: Normalise to [0, 100] scale
  let score = (1 - finalDist / D_MAX) * 100;

  // Step 5: Acoustic hard-gate penalty (§3.4)
  // If noise preference gap exceeds the gate, apply a 20% penalty
  const acousticGap = Math.abs(vWd_A[ACOUSTIC_IDX] - vWd_B[ACOUSTIC_IDX]);
  if (acousticGap > ACOUSTIC_GATE) score *= ACOUSTIC_PENALTY;

  // Step 6: Clamp result to [0, 100]
  return Math.max(0, Math.min(100, score));
}

/**
 * Evaluates lifestyle conflict triggers for a matched pair (§4.2).
 * Identifies specific dimensions where users' habits significantly diverge.
 * 
 * @param vWd_A - Weekday vector of user A
 * @param vWe_A - Weekend vector of user A
 * @param vWd_B - Weekday vector of user B
 * @param vWe_B - Weekend vector of user B
 * @returns Array of identified conflict triggers with suggested house rules
 */
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

/**
 * Maps a numerical score to a categorical match tier (§5.2).
 * 
 * @param score - Computed match score
 * @returns Categorical tier
 */
export function getMatchTier(score: number): MatchTier {
  if (score >= 80) return 'strong';
  if (score >= 65) return 'good';
  if (score >= 40) return 'borderline';
  return 'incompatible';
}

/**
 * Computes the full match result including score, tier, and conflict triggers.
 * 
 * @param vWd_A - Weekday vector of user A
 * @param vWe_A - Weekend vector of user A
 * @param vWd_B - Weekday vector of user B
 * @param vWe_B - Weekend vector of user B
 * @returns Comprehensive match result object
 */
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
