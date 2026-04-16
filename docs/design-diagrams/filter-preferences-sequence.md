# Filter & Preferences Logic — Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Page as discovery/page.tsx<br/>(Server)
    participant DB as Supabase DB
    participant RD as RoommateDiscovery<br/>(Client)
    participant AFP as AdvancedFilterPanel
    participant Helper as discoveryHelper<br/>applyFilters()

    %% ── Page load ──────────────────────────────────────────────────────────────
    User->>Page: GET /discovery
    Page->>DB: getMatches() — fetch my profile<br/>(pref_lifestyle_tags, preferred_gender,<br/>age_min/max, pref_budget, pref_lat/lng,<br/>pref_max_distance)
    DB-->>Page: myProfile
    Page->>DB: fetch candidates (profiles)<br/>optionally pre-filtered by lat/lng bounding box
    DB-->>Page: candidates[]
    Note over Page: Build userBinaryPrefs[]<br/>filter pref_lifestyle_tags by BINARY_PREF_KEYS<br/>["Pet Allowed","Non-Smoker","Same Gender Only",…]
    Page-->>RD: props: matches[], userBinaryPrefs[],<br/>userPreferredGender, prefAge/Budget/Dist,<br/>roomListings[], …

    %% ── Client init ─────────────────────────────────────────────────────────────
    Note over RD: useState init<br/>activeFilters          = [defaultFilters(userRole)]<br/>selectedPreferenceTags = map(userBinaryPrefs)<br/>activeTagFilters       = map(userBinaryPrefs)<br/>("Same Gender Only" → "__same_gender__")<br/>filterAge/Budget/Dist  = from pref props<br/>ageFilterOn / budgetFilterOn / distFilterOn

    %% ── Every render: derive visible results ────────────────────────────────────
    RD->>Helper: applyFilters(matches, activeFilters,<br/>savedIds, showSaved, activeTagFilters,<br/>userPreferredGender, age, budget, dist,<br/>prefLat, prefLng, showIncompatible)
    Note over Helper: 1. Role filter (activeFilters)<br/>   "all" → skip<br/>   "roommate" → role===seeker<br/>   "roommate_with_room" → role===provider<br/>   "room" → role===provider<br/>2. Tag/gender filter (activeTagFilters)<br/>   "__same_gender__" → compare preferred_gender<br/>   other tags → candidate.lifestyle_tags.includes(tag)<br/>3. Age range filter (if ageFilterOn)<br/>4. Budget overlap filter (if budgetFilterOn)<br/>5. Distance filter via haversine (if distFilterOn)<br/>6. Hide incompatible tier (unless showIncompatible)
    Helper-->>RD: visibleMatches[]
    Note over RD: isRoomView = activeFilters===["room"]<br/>visibleListings filtered separately<br/>(budget + distance + activeRoomTagFilters)
    RD-->>User: Render cards

    %% ── Show tab ────────────────────────────────────────────────────────────────
    User->>RD: Click Show tab (All/Roommate/Roommate with Room/Room)
    Note over RD: toggleFilter(key)<br/>setActiveFilters([key])  ← single-select
    RD->>Helper: applyFilters(…)
    Helper-->>RD: visibleMatches[]
    RD-->>User: Re-render cards

    %% ── Advanced filter panel ───────────────────────────────────────────────────
    User->>RD: Click "Filters" button
    RD-->>AFP: Open panel with current filter state

    User->>AFP: Toggle preference tag (e.g. "Same Gender")
    AFP->>RD: toggleSelectedPreferenceTag("__same_gender__")
    Note over RD: If adding: push to selectedPreferenceTags<br/>If removing: also remove from activeTagFilters
    RD-->>User: Tag chip appears in filter bar (inactive)

    User->>AFP: Adjust age / budget / distance slider
    AFP->>RD: setFilterAgeMin/Max, setBudgetMin/Max,<br/>setFilterMaxDist, toggle *FilterOn
    RD->>Helper: applyFilters(…)
    Helper-->>RD: visibleMatches[]
    RD-->>User: Re-render cards

    %% ── Filter bar chip ─────────────────────────────────────────────────────────
    User->>RD: Click preference tag chip in filter bar
    Note over RD: toggleActivePreferenceTag(tag)<br/>If was inactive → add to activeTagFilters (deal-breaker ON)<br/>If was active   → remove from activeTagFilters (deal-breaker OFF)
    RD->>Helper: applyFilters(…)
    Helper-->>RD: visibleMatches[]
    RD-->>User: Re-render cards (chip highlighted, non-matching filtered out)

    %% ── Saved / Incompatible toggles ────────────────────────────────────────────
    User->>RD: Toggle "Saved only" or "Show Incompatible"
    Note over RD: setShowSaved / setShowIncompatible
    RD->>Helper: applyFilters(…)
    Helper-->>RD: visibleMatches[]
    RD-->>User: Re-render cards
```

## State reference

| State | Initialised from | What it does |
|---|---|---|
| `activeFilters` | `defaultFilters(userRole)` | Single-select Show tab — controls role filter |
| `selectedPreferenceTags` | `userBinaryPrefs` (mapped) | Controls which tag chips appear in the filter bar |
| `activeTagFilters` | `userBinaryPrefs` (mapped) | Deal-breaker — profiles that don't match are removed |
| `filterAge/Budget/Dist` | saved pref columns | Numeric range filters; only applied when `*FilterOn` is true |
| `activeRoomTagFilters` | empty | Room-view only — filters by amenity/room type |
