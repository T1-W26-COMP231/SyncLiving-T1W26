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
  userAWeekdayVector: number[],
  userAWeekendVector: number[],
  userBWeekdayVector: number[],
  userBWeekendVector: number[]
): number {
  const weekdayDistance = euclideanDist(userAWeekdayVector, userBWeekdayVector);
  const weekendDistance = euclideanDist(userAWeekendVector, userBWeekendVector);

  // Step 3: Temporal aggregation (70/30 weekday/weekend weight)
  const finalDist = weekdayDistance * 0.70 + weekendDistance * 0.30;

  // Step 4: Normalise to [0, 100] scale
  let score = (1 - finalDist / D_MAX) * 100;

  // Step 5: Acoustic hard-gate penalty (§3.4)
  // If noise preference gap exceeds the gate, apply a 20% penalty
  const acousticGap = Math.abs(userAWeekdayVector[ACOUSTIC_IDX] - userBWeekdayVector[ACOUSTIC_IDX]);
  if (acousticGap > ACOUSTIC_GATE) score *= ACOUSTIC_PENALTY;

  // Step 6: Clamp result to [0, 100]
  return Math.max(0, Math.min(100, score));
}

/**
 * Evaluates lifestyle conflict triggers for a matched pair (§4.2).
 * Identifies specific dimensions where users' habits significantly diverge.
 * 
 * @param userAWeekdayVector - Weekday vector of user A
 * @param userAWeekendVector - Weekend vector of user A
 * @param userBWeekdayVector - Weekday vector of user B
 * @param userBWeekendVector - Weekend vector of user B
 * @returns Array of identified conflict triggers with suggested house rules
 */
export function computeConflicts(
  userAWeekdayVector: number[],
  userAWeekendVector: number[],
  userBWeekdayVector: number[],
  userBWeekendVector: number[]
): ConflictTrigger[] {
  const triggers: ConflictTrigger[] = [];

  const deltaS = Math.abs(userAWeekdayVector[0] - userBWeekdayVector[0]);
  const deltaA = Math.abs(userAWeekdayVector[1] - userBWeekdayVector[1]);
  const deltaC = Math.abs(userAWeekdayVector[2] - userBWeekdayVector[2]);
  const deltaR = Math.abs(userAWeekdayVector[3] - userBWeekdayVector[3]);
  const deltaB = Math.abs(userAWeekdayVector[4] - userBWeekdayVector[4]);

  // Weekend lifestyle divergence score delta
  const scoreWd = computeScore(userAWeekdayVector, userAWeekdayVector, userBWeekdayVector, userBWeekdayVector);
  const scoreWe = computeScore(userAWeekendVector, userAWeekendVector, userBWeekendVector, userBWeekendVector);
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
 * @param userAWeekdayVector - Weekday vector of user A
 * @param userAWeekendVector - Weekend vector of user A
 * @param userBWeekdayVector - Weekday vector of user B
 * @param userBWeekendVector - Weekend vector of user B
 * @returns Comprehensive match result object
 */
export function computeMatchResult(
  userAWeekdayVector: number[],
  userAWeekendVector: number[],
  userBWeekdayVector: number[],
  userBWeekendVector: number[]
): MatchResult {
  const score = computeScore(userAWeekdayVector, userAWeekendVector, userBWeekdayVector, userBWeekendVector);
  return {
    score,
    tier: getMatchTier(score),
    conflicts: computeConflicts(userAWeekdayVector, userAWeekendVector, userBWeekdayVector, userBWeekendVector),
  };
}
