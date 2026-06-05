# Firestore Security Specification & Threat Model (TDD)

## 1. Data Invariants

1. **User Ownership**: No user can read, list, create, update, or delete records (Subjects, Topics, Subtopics, Mistakes) belonging to another user.
2. **Strict Document Identifiers**: Path variable strings must conform to valid IDs (alphanumeric, underscores, hyphens, under 128 characters) to avoid poisoning.
3. **Temporal Integrity**: All client dates are kept format-consistent (YYYY-MM-DD) and verified securely.
4. **Status Guard**: The `status` on mistakes can only be 'New', 'Reviewing', or 'Mastered'.
5. **No Orphaned Entries**: During creation of Topics, Subtopics, and Mistakes, reference consistency is checked on the database if needed, and write checks verify that the user owns their specific parent scope items.

---

## 2. The "Dirty Dozen" Threat Scenarios (Malformed Payloads)

Here are 12 specific payload structures attempting to bypass security boundaries, which MUST return `PERMISSION_DENIED`:

### Payload 1: Unauthorized Subject Creation (Identity Spoofing)
An attacker logs in as `attacker123` but tries to create a Subject with `userId` of `victim456`.
```json
{
  "id": "sb-spoof",
  "name": "Malicious Biology",
  "userId": "victim456"
}
```

### Payload 2: Hostile Subject Modification (External Write)
An attacker logged in as `attacker123` attempts to write/overwrite someone else's subject document (`subjects/sb-victim`).
```json
{
  "id": "sb-victim",
  "name": "Hacked Subject Name",
  "userId": "victim456"
}
```

### Payload 3: Subject Cross-User Deletion (Identity Breach)
`attacker123` tries to delete `/subjects/sb-victim` belonging to `victim456`.

### Payload 4: Topic Creation for Another User's Subject
`attacker123` tries to create topic `/topics/tp-new` with `userId` set to `attacker123` but targeting a subject belonging to `victim456`. (This represents reference model poisoning).

### Payload 5: Subtopic Overwrite (Shadow Field Attachment)
`attacker123` attempts to save a subtopic but joins a secret payload property `isAdminUser = true` (Shadow field validation test).
```json
{
  "id": "sbt-attack",
  "topicId": "tp-mine",
  "name": "Unverified Topic Part",
  "userId": "attacker123",
  "isAdminUser": true
}
```

### Payload 6: Invalid Document ID Poisoning (Path Injection)
`attacker123` attempts to create / update a document with ID containing unsafe or massive string sequences: `subjects/sb-../../../etc/passwd` or extremely long strings (>128 chars).

### Payload 7: Mistake Status Injection (State Shortcutting)
`attacker123` tries to set the mistake `status` to an unsupported term: `status = 'ExpertMode'`.
```json
{
  "id": "m-wrong",
  "title": "Unsafe state test",
  "subjectId": "sb-mine",
  "topicId": "tp-mine",
  "dateLogged": "2026-06-04",
  "originalQuestion": "?",
  "myAnswer": "?",
  "correctAnswer": "?",
  "whatIGotWrong": "test",
  "correctExplanation": "test",
  "reflection": "test",
  "futureAdvice": "test",
  "categories": ["Other"],
  "status": "ExpertMode",
  "userId": "attacker123"
}
```

### Payload 8: Mistake Category Corruption
`attacker123` writes an empty string or malformed values inside categories array, e.g. `categories = [null, true, "NotACategory"]`.

### Payload 9: Blanket Query Scraping
An anonymous client (or a signed-in user) queries `subjects/` without specifying a `where("userId", "==", uid)` constraint, hoping the rules will allow broad read.

### Payload 10: Modifying Immutables (Subject ID Re-Mapping)
`attacker123` updates their own existing subject but changes its primary `id` or tries to point it to another user `userId: victim456`.

### Payload 11: Future Date Injection
Creating a mistake with invalid or empty fields like empty title or empty whatIGotWrong but bypassing UI validators.

### Payload 12: Private UserSettings Intrusion
`attacker123` reads private UserSettings matching `usersettings/victim456` or tries to modify victim settings.

---

## 3. Threat Rule Mapping

All twelve payload tests must return `permission_denied` at the firestore security rules engine layer.
This ensures complete Attribute-Based Access Control (ABAC) and Zero-Trust validation.
