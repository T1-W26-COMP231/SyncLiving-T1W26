# SyncLiving — FCRM Engine: Algorithm & Stack Specification

---

## 1. Purpose & Scope

This document is the authoritative specification for the **Fuzzy Centroid Roommate Matching (FCRM) Engine** — the mathematical and infrastructure core of SyncLiving. It is structured for direct consumption by an AI coding agent.

**In scope (v1.1):** Input encoding, scoring formula, temporal aggregation, normalisation, acoustic penalty, conflict triggers, match surfacing, full backend stack.  
**Out of scope:** Fuzzy C-Means re-clustering (FCM) — this is the v2 upgrade path.

---

## 2. Input Encoding

### 2.1 User Object

```json
{
  "id": "UUID_123",
  "v_wd": [s, a, c, r, b],
  "v_we": [s, a, c, r, b]
}
```

- `v_wd` = weekday feature vector
- `v_we` = weekend feature vector
- Each element ∈ `{ 0.1, 0.3, 0.5, 0.7, 0.9 }` (ordinal, 5-point scale)
- Dimension order: **[Social, Acoustic, Sanitary, Rhythm, Boundary]** — indices 0–4

### 2.2 Dimension Weights

```
ω = { s: 0.25, a: 0.35, c: 0.20, r: 0.15, b: 0.05 }
Σω = 1.0  (invariant — must always hold)
```

| Index | Dimension | Variable | Weight |
|-------|-----------|----------|--------|
| 0 | Social Density | s | 0.25 |
| 1 | Acoustic Environment | a | 0.35 |
| 2 | Sanitary Standards | c | 0.20 |
| 3 | Circadian Rhythm | r | 0.15 |
| 4 | Boundary Philosophy | b | 0.05 |

### 2.3 Tag Library

#### Social Density (s) — index 0
| Tag | Value |
|-----|-------|
| #TheHermit | 0.1 |
| #QuietLiving | 0.3 |
| #BalancedSocial | 0.5 |
| #FrequentHost | 0.7 |
| #OpenHouse | 0.9 |

#### Acoustic Environment (a) — index 1
| Tag | Value |
|-----|-------|
| #LibraryZone | 0.1 |
| #QuietFocus | 0.3 |
| #AmbientLife | 0.5 |
| #VibrantHome | 0.7 |
| #HighDecibel | 0.9 |

#### Sanitary Standards (c) — index 2
| Tag | Value |
|-----|-------|
| #ChaosLover | 0.1 |
| #LifeOverLaundry | 0.3 |
| #AverageTidy | 0.5 |
| #PubliclyTidy | 0.7 |
| #Minimalist24/7 | 0.9 |

#### Circadian Rhythm (r) — index 3
| Tag | Value |
|-----|-------|
| #StrictEarlyBird | 0.1 |
| #AM_Routine | 0.3 |
| #The9to5er | 0.5 |
| #TheLateShifter | 0.7 |
| #TrueNightOwl | 0.9 |

#### Boundary Philosophy (b) — index 4
| Tag | Value |
|-----|-------|
| #StrictlyPrivate | 0.1 |
| #RespectfulDistance | 0.3 |
| #Borrower | 0.5 |
| #SharedHousehold | 0.7 |
| #CommunalLiving | 0.9 |

---

## 3. Scoring Algorithm

### 3.1 Weighted Euclidean Distance (per time-state)

```
D_wd = sqrt( Σ ω[n] · (A_wd[n] − B_wd[n])² )   for n ∈ [0..4]
D_we = sqrt( Σ ω[n] · (A_we[n] − B_we[n])² )   for n ∈ [0..4]
```

### 3.2 Temporal Aggregation

```
Final_Dist = (D_wd × 0.70) + (D_we × 0.30)
```

> **Invariant:** weekday weight + weekend weight = 1.0. Default 70/30. Tunable — see §8.

### 3.3 Normalisation

Maximum possible distance: `D_max = sqrt(0.8² × Σω) = 0.8`

```
Raw_Score = (1 − Final_Dist / 0.8) × 100     → range [0%, 100%]
```

> **Do NOT use** `(1 − Final_Dist) × 100` — this floors at 20%, not 0%.

### 3.4 Acoustic Hard-Gate Penalty

```
acoustic_gap = abs(A_wd[1] − B_wd[1])   // index 1 = Acoustic

if acoustic_gap > 0.4:
    Final_Score = Raw_Score × 0.80
else:
    Final_Score = Raw_Score
```

> Threshold 0.4 = two-step tag gap. Applied **after** normalisation, **before** surfacing check.

### 3.5 Complete Pipeline (ordered)

```
1.  D_wd        = sqrt( Σ ω[n] · (A_wd[n] − B_wd[n])² )
2.  D_we        = sqrt( Σ ω[n] · (A_we[n] − B_we[n])² )
3.  Final_Dist  = D_wd × 0.70 + D_we × 0.30
4.  Raw_Score   = (1 − Final_Dist / 0.8) × 100
5.  If abs(A_wd[1] − B_wd[1]) > 0.4:  Raw_Score × 0.80
6.  Final_Score = clamp(result, 0, 100)
```

### 3.6 Reference Implementation (TypeScript)

```typescript
const WEIGHTS: Record<string, number> = { s: 0.25, a: 0.35, c: 0.20, r: 0.15, b: 0.05 };
const DIMS = ['s', 'a', 'c', 'r', 'b'];
const D_MAX = 0.8;
const ACOUSTIC_IDX = 1;
const ACOUSTIC_GATE = 0.4;
const ACOUSTIC_PENALTY = 0.80;

interface UserVector {
  weekday: number[];  // [s, a, c, r, b]
  weekend: number[];
}

function euclidean(A: number[], B: number[]): number {
  return Math.sqrt(
    DIMS.reduce((sum, d, i) => sum + WEIGHTS[d] * (A[i] - B[i]) ** 2, 0)
  );
}

export function computeScore(A: UserVector, B: UserVector): number {
  const D_wd = euclidean(A.weekday, B.weekday);
  const D_we = euclidean(A.weekend, B.weekend);
  const dist = D_wd * 0.70 + D_we * 0.30;
  let score = (1 - dist / D_MAX) * 100;

  const acousticGap = Math.abs(A.weekday[ACOUSTIC_IDX] - B.weekday[ACOUSTIC_IDX]);
  if (acousticGap > ACOUSTIC_GATE) score *= ACOUSTIC_PENALTY;

  return Math.max(0, Math.min(100, score));
}
```

### 3.7 Properties

- **Symmetric:** `computeScore(A, B) === computeScore(B, A)` always — both users see the same score.
- **Range:** [0, 100] after clamp.
- **No external math library required** — native arithmetic only.

---

## 4. Conflict Prediction & Agreement Triggers

### 4.1 Delta Definitions

```
ΔS   = abs(A_wd[0] − B_wd[0])   // Social
ΔA   = abs(A_wd[1] − B_wd[1])   // Acoustic
ΔC   = abs(A_wd[2] − B_wd[2])   // Sanitary
ΔR   = abs(A_wd[3] − B_wd[3])   // Rhythm
ΔB   = abs(A_wd[4] − B_wd[4])   // Boundary

// Temporal shift: weekday vs weekend compatibility divergence
score_wd = pairwiseScore using v_wd vectors only
score_we = pairwiseScore using v_we vectors only
ΔSim = abs(score_wd − score_we)
```

### 4.2 Trigger Table

| Trigger | Conflict Type | Agreement Clause |
|---------|--------------|------------------|
| ΔS > 0.5 | "Third Roommate" syndrome — guest presence erodes privacy | "Notice required 24h prior for overnight guests; max 2 overnight stays/week." |
| ΔA > 0.5 | Noise tolerance mismatch → frequent disputes | "Quiet hours 11:00 PM – 07:00 AM daily." |
| ΔC > 0.5 | Cleanliness mismatch → chore resentment | "Common area dishes cleared within 4h of use. Surfaces wiped every Sunday." |
| ΔR < 0.15 | High circadian symmetry → resource bottleneck (bathroom/kitchen) | "Morning bathroom schedule: Roommate A 7:30–8:00 AM; Roommate B 8:00–8:30 AM." |
| ΔR > 0.6 | Extreme mismatch → Night Owl activity during Early Bird REM | "Quiet hours from 11:00 PM weeknights. No hairdryer, loud cooking, or speakers." |
| ΔB > 0.5 | Boundary mismatch → resource depletion and violations | "Strict 'Ask Before Using' policy for personal groceries and toiletries." |
| ΔSim > 0.4 | Weekend lifestyle divergence → weekend clash | "Quiet hours shift to 01:00 AM on Friday/Saturday nights only." |

> **Multiple triggers may fire** for the same pair. All clauses are compiled into a single Agreement Workspace document.

---

## 5. Match Surfacing

### 5.1 Threshold

Only surface matches where `Final_Score >= 65`.

### 5.2 Tiers

| Score | Tier | Action |
|-------|------|--------|
| ≥ 80% | Strong Match | Surface prominently |
| 65–79% | Good Match | Surface normally |
| 40–64% | Borderline | Hidden (opt-in filter) |
| < 40% | Incompatible | Never surfaced |

### 5.3 Ranking

```
Primary sort:   Final_Score DESC
Tiebreaker:     abs(A_wd[1] − B_wd[1]) ASC   (acoustic similarity, lower gap = better)
Gate:           Both users must independently reach threshold (mutual consent)
```

---

## 6. Backend Technology Stack

### 6.1 Rationale

The v1.0 FCRM pipeline is arithmetic on 5-element vectors. **No Python service, NumPy, or scikit-fuzzy is required.** The full engine is ~40 lines of TypeScript inside NestJS. Deployment is 3 Docker containers.

### 6.2 Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| API + Matching Engine | **NestJS** (Node.js / TypeScript) | All business logic including MatchingService |
| Matching Logic | Inline TypeScript | See §3.6 — no external math library |
| ORM | **Prisma** | Schema, migrations, type-safe queries |
| Primary Database | **PostgreSQL 16** | Profiles, vectors, match scores, chat |
| Vector Pre-filter | **pgvector** extension | Cosine similarity pre-filter, narrows to top-100 candidates |
| Cache | **Redis 7** + ioredis | Match scores cached with 24h TTL |
| Job Queue | **BullMQ** | Runs on same Redis instance |

### 6.3 Docker Compose (3 services)

```yaml
services:
  api:
    build: .
    image: node:20-alpine
    ports: ["3000:3000"]
    depends_on: [db, redis]

  db:
    image: pgvector/pgvector:pg16
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: syncliving
      POSTGRES_PASSWORD: secret

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### 6.4 NestJS Module Structure

```
src/
├── auth/           AuthModule      — JWT + Passport guards
├── users/          UserModule      — Profile CRUD; publishes recompute-matches on tag update
├── matching/       MatchingModule  — MatchingService with full FCRM pipeline
├── vector/         VectorModule    — pgvector queries; findCandidates(userId, limit=100)
├── cache/          CacheModule     — ioredis; getMatchScore / setMatchScore
└── chat/           ChatModule      — Socket.io; gated by mutual-consent status
```

### 6.5 pgvector Schema & Query

```sql
-- Schema
CREATE TABLE user_vectors (
  user_id UUID PRIMARY KEY,
  v_wd    vector(5),
  v_we    vector(5)
);

-- Index (add once table > 1000 rows)
CREATE INDEX ON user_vectors USING ivfflat (v_wd vector_cosine_ops);

-- Pre-filter query (returns top 100 candidates)
SELECT user_id
FROM   user_vectors
ORDER  BY v_wd <=> $1::vector
LIMIT  100;
```

> pgvector candidate limit is tunable — see §8.

### 6.6 BullMQ Jobs

```typescript
// Job 1: triggered by UserModule on tag update
queue.add('recompute-matches', { userId: string });

// Job 2: scheduled nightly
queue.add('expire-cache', {}, { repeat: { cron: '0 3 * * *' } });
```

Worker flow for `recompute-matches`:
1. Call `VectorModule.findCandidates(userId, 100)` — pgvector pre-filter
2. For each candidate, call `MatchingService.computeScore(A, B)`
3. For scores ≥ 65: write to Redis with 24h TTL
4. Compile conflict triggers and write to Agreement Workspace table

### 6.7 Cache Read Pattern

```typescript
// In MatchingController.getMatches(userId)
const cached = await cacheModule.getMatchScore(userId);
if (cached) return cached;

// Cache miss: compute synchronously, then cache
const score = matchingService.computeScore(A, B);
await cacheModule.setMatchScore(userId, partnerId, score, 86400);
return score;
```

### 6.8 Excluded from v1.0

Do not implement until FCM v2 is designed:
- Python / FastAPI service
- NumPy / scikit-fuzzy
- Celery worker
- Centroid storage table
- Membership weight computation

---

## 7. Build Order

| Sprint | Focus | Deliverable |
|--------|-------|-------------|
| 1–2 | Data layer | PostgreSQL schema + Prisma migrations. UserModule with tag storage. pgvector installed. |
| 3–4 | Matching engine | MatchingService with full pipeline. Unit-tested with hardcoded vector pairs before DB wiring. |
| 5–6 | Vector pre-filter | VectorModule wrapping pgvector cosine search. Wire UserModule → VectorModule → MatchingService. |
| 7–8 | Cache + queue | Redis cache with 24h TTL. BullMQ recompute-matches job on tag updates. |
| 9+ | Chat + frontend | Socket.io, Agreement Workspace UI, conflict trigger display, Weekend Toggle. |

---

## 8. Tunable Constants

| Constant | v1.0 Value | Range | When to Revisit |
|----------|-----------|-------|-----------------|
| Weekday temporal weight | 0.70 | [0.5, 0.9] | If conflict reports skew weekend-heavy |
| Weekend temporal weight | 0.30 | [0.1, 0.5] | Mirror of weekday; must sum to 1.0 |
| Acoustic gate threshold | 0.4 | [0.3, 0.6] | Lower = stricter acoustic gating |
| Acoustic penalty multiplier | 0.80 | [0.7, 0.95] | Lower = harsher penalty |
| Surfacing floor | 65% | [55%, 75%] | Raise if match quality complaints increase |
| D_max normaliser | 0.8 | Fixed | Only changes if tag scale changes |
| pgvector candidate limit | 100 | [50, 200] | Raise if match quality drops at high user counts |
| Redis cache TTL | 24h | [6h, 72h] | Lower if users update tags frequently |

---

## 9. Worked Example

```
A_wd = [0.1, 0.3, 0.9, 0.3, 0.3]   // Hermit | QuietFocus | Minimalist | AM_Routine | Respectful
B_wd = [0.7, 0.7, 0.5, 0.9, 0.7]   // FrequentHost | VibrantHome | AverageTidy | NightOwl | SharedHousehold

D_wd = sqrt(
  0.35·(0.1−0.7)²  +  0.25·(0.3−0.7)²  +  0.20·(0.9−0.5)²
  + 0.15·(0.3−0.9)²  +  0.05·(0.3−0.7)²
)
     = sqrt( 0.126 + 0.040 + 0.032 + 0.054 + 0.008 )
     = sqrt(0.260) ≈ 0.510

Assume D_we ≈ 0.300

Final_Dist = 0.510 × 0.70 + 0.300 × 0.30 = 0.447
Raw_Score  = (1 − 0.447 / 0.8) × 100 = 44.1%

Acoustic gap = |0.3 − 0.7| = 0.4  →  NOT > 0.4, penalty does NOT apply

Final_Score = 44.1%  →  Borderline  →  not surfaced by default

Triggers fired: ΔS = 0.6 > 0.5 ✓  |  ΔR = 0.6 triggers both Rhythm checks
```

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-03 | Added §6 Backend Stack, §7 Build Order, §3.6 TypeScript reference implementation, expanded §8 constants. |
| 1.0 | 2026-03 | Initial release. Pairwise Weighted Euclidean scoring, Weekend Toggle, temporal aggregation, acoustic hard-gate, normalised score range, conflict trigger table. |
