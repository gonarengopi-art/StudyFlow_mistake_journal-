# Study Squads: Collaborative Mistake Decks & Peer Review

A collaborative learning system enabling students to form study squads, invite classmates via 6-character squad codes or shareable links, curate shared high-yield mistake banks, and benchmark review accuracy together in the Review Arena.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following core design decisions have been aligned based on your responses:

- **Confirmed Decision 1 (Squad Purpose)**: Study Squads designed for collaborative mistake curation and peer review, allowing students to tackle tricky exam traps together rather than in isolation.
- **Confirmed Decision 2 (Invite Delivery)**: Shareable universal invite link + auto-generated 6-character alphanumeric squad code (e.g., `BIO-7X2`), with instant clipboard copy and QR support.
- **Confirmed Decision 3 (Collaboration Level)**: Dual-mode collaboration:
  1. *Full Collaborative Curation*: Squad members can contribute new mistakes, edit explanations, and attach diagrams to shared subject decks.
  2. *Comparative Accuracy Arena*: Members can practice the squad deck in the Review Arena and compare mastery rates on a friendly squad accuracy leaderboard.
- **Open Question / Recommendation**: To protect individual study records, each member's personal mistakes remain private by default, with an explicit 1-click **"Share to Squad"** toggle or direct squad bank authoring.

---

### 1. Overview & Core Concept

- **What It Does**: Gives students the ability to create study groups ("Squads") focused on specific exams or subjects (e.g., AP Chemistry, MCAT Prep, UCAT), generate 6-character invite codes to invite peers, collaboratively compile tricky exam problems and pitfalls, and practice squad decks in the interactive Review Arena.
- **Target Audience / Persona**: High school and university students, study groups, revision cohorts, and exam test-takers who want to pool tricky questions and test each other's diagnostic intuition.
- **Key Value**: Transmutes individual error analysis into collective intelligence—students learn from mistakes they haven't personally made yet, multiplying their exposure to subtle exam traps.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Squad Hub & Creation**:
     - User navigates to the new **"Squads"** view from the top header or dashboard widget.
     - Clicks **"Create Study Squad"**, selects a target subject (e.g., Chemistry) and squad name (e.g., "Organic Chem Warriors").
     - The app generates a 6-character squad code (e.g., `CHEM92`) and an instant shareable link (`?squad=CHEM92`).
  2. **Joining a Squad**:
     - An invited peer opens the link or enters the 6-character code in the **"Join Squad"** dialog.
     - The peer is instantly enrolled, their avatar appears in the member roster, and the squad's shared mistake bank syncs in real time.
  3. **Collaborative Mistake Authoring & Curation**:
     - Members can add mistakes directly to the squad or click **"Publish to Squad"** on any existing personal mistake log.
     - Shows author attribution ("Contributed by Liam · Last updated by Maya") with inline comments/alternative solution methods.
  4. **Squad Review Arena & Leaderboard**:
     - Any member can click **"Launch Squad Review"** to drill all shared squad cards.
     - A dynamic **Squad Mastery Leaderboard** shows session accuracy, total cards mastered, and current streaks across all squad mates.

- **Visual Identity & Theme**:
  - *Aesthetic*: Scholarly, collegiate editorial design maintaining StudyFlow's warm serif typography (`font-serif`), slate/stone canvas, and terracotta/sage accent discipline.
  - *Colors*: Subdued warm neutrals (`#FAF8F5`, `#E8E2D9`), slate typography (`#2D2A26`), terracotta action highlights (`#D98A6C`), and sage mastery accents (`#5A5A40`, `#8DA38A`).
  - *Member Badges*: Clean unboxed typographic metadata (e.g. `Liam K. · Founder · 14 cards shared`) respecting zero-pill guidelines.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Code-Based Joining vs. Email Invitations**:
  - *Chosen Approach*: Lightweight 6-character alphanumeric code + universal URL parameter (`?squad=ABC123`).
  - *Why*: Eliminates friction—students share codes instantly on WhatsApp, Discord, or in class without waiting for backend email dispatch or spam folder delays.
  - *Alternative Considered*: Direct transactional email invitations (higher setup friction, requires third-party SMTP/SendGrid credentials).

- **Decision 2: Dual Personal vs. Shared Data Model**:
  - *Chosen Approach*: Separate Firestore collection `squads` and subcollection `squads/{squadId}/mistakes`, linked with member IDs.
  - *Why*: Ensures complete student privacy. Private mistake journals are never exposed to squads unless explicitly published, and squad deletions do not destroy personal cards.
  - *Alternative Considered*: Flagging personal mistakes with `isPublic` (confusing permissions and risk of accidental exposure).

- **Decision 3: Offline & Guest Fallback**:
  - *Chosen Approach*: Guest users see simulated demo squads with interactive code generation and mock joining to evaluate the feature before signing in with Google.
  - *Why*: Guarantees instant engagement without forcing immediate sign-in.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────┐
│                        STUDYFLOW CLIENT APPLICATION                    │
├───────────────────────────────┬────────────────────────────────────────┤
│          VIEWS & MODALS       │               DATA LAYER               │
│                               │                                        │
│  ┌─────────────────────────┐  │   ┌──────────────────────────────────┐ │
│  │   SquadsHubView         │  │   │     useJournalStore / Squads     │ │
│  │   - Active Squads Grid  │◄─┼───┤     - mySquads: Squad[]          │ │
│  │   - Create/Join Bar     │  │   │     - currentSquadMistakes[]     │ │
│  │   - Leaderboard Standings│ │   │     - createSquad() / joinSquad()│ │
│  └─────────────────────────┘  │   └─────────────────┬────────────────┘ │
│  ┌─────────────────────────┐  │                     │                  │
│  │   SquadDetailView       │  │                     │ Sync             │
│  │   - Shared Mistake Bank │◄─┤                     ▼                  │
│  │   - Member Roster       │  │   ┌──────────────────────────────────┐ │
│  │   - "Drill Squad Deck"  │  │   │      FIRESTORE REAL-TIME DB      │ │
│  └─────────────────────────┘  │   │   /squads/{squadId}              │ │
│  ┌─────────────────────────┐  │   │     - name, code, subjectId      │ │
│  │   InviteSquadModal      │  │   │     - memberUids: string[]       │ │
│  │   - 6-Char Code Display │  │   │   /squads/{squadId}/mistakes     │ │
│  │   - 1-Click Link Copy   │  │   │     - originalQuestion, answer   │ │
│  └─────────────────────────┘  │   │     - authorUid, authorName      │ │
│  ┌─────────────────────────┐  │   │   /squads/{squadId}/scores       │ │
│  │   SquadReviewArena      │◄─┤   │     - uid, accuracy, reviewsDone │ │
│  │   - Card drills & tally │  │   └──────────────────────────────────┘ │
│  └─────────────────────────┘  │                                        │
└───────────────────────────────┴────────────────────────────────────────┘
```

#### Data Entities:
1. **`StudySquad`**:
   - `id`: string
   - `name`: string (e.g., "MCAT Biology High-Yield")
   - `code`: string (unique 6-character code, e.g. `MCAT42`)
   - `subjectId`: string
   - `ownerUid`: string
   - `ownerName`: string
   - `memberCount`: number
   - `memberUids`: string[]
   - `createdAt`: string
2. **`SquadMistakeEntry`**:
   - Extends standard `MistakeEntry` with `squadId`, `authorUid`, `authorName`, and `lastEditedBy`.
3. **`SquadMemberScore`**:
   - `uid`: string
   - `displayName`: string
   - `accuracy`: number
   - `reviewsCompleted`: number
   - `lastActiveDate`: string

#### Interactive Component Mapping:
- `handleCreateSquad(name, subjectId)`: Generates code, saves to Firestore `/squads`, auto-enrolls creator as Owner.
- `handleJoinSquad(code)`: Looks up squad matching `code.toUpperCase()`, appends `user.uid` to `memberUids`, loads squad deck.
- `handlePublishToSquad(mistakeId, squadId)`: Copies mistake data to `/squads/{squadId}/mistakes`.
- `handleSquadReviewComplete(squadId, accuracy, cardsCount)`: Updates `/squads/{squadId}/scores/{user.uid}` and refreshes live leaderboard.
