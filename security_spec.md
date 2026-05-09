# Security Specification for Bizi Vocab

## 1. Data Invariants
- A `Word` must be unique by its text and level (though we'll allow multiple entries for now, ideally unique).
- A user's `progress` record must belong to the user (`userId` in path matches `auth.uid`).
- Only signed-in users can read vocabulary words.
- Only signed-in users can create words (crowdsourced/system population).
- Users can only read and write their own profiles and progress.

## 2. The Dirty Dozen Payloads (Rejection Tests)

1. **Identity Spoofing**: Attempt to create a word with `ownerId` of another user (though words don't have ownerId, let's say they did).
2. **Path Variable Poisoning**: Accessing `/users/ADMIN_UID/progress/word123`.
3. **Ghost Field Update**: Updating a profile with `{ isAdmin: true }`.
4. **Incorrect Type**: Setting `xp` to `"one hundred"` (string instead of number).
5. **Size Violation**: Setting `word` to a 5MB string.
6. **Relational Sync Break**: Creating progress for a `wordId` that doesn't exist.
7. **Bypassing Verification**: Writing logic when `email_verified` is false.
8. **Shadow Field injection**: Adding `{ secret: 'hidden' }` to a word record.
9. **Terminal State Break**: (N/A for now).
10. **Immutable Field Change**: Changing `uid` in a user profile.
11. **PII Leak**: A user reading another user's `email`.
12. **Blanket Read**: Querying all users without a filter.

## 3. Conflict Report
| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
| :--- | :--- | :--- | :--- |
| /words | Protected by `isSignedIn()` | N/A | Protected by `isValidWord()` |
| /users | Protected by `isOwner()` | N/A | Protected by `isValidUser()` |
| /progress | Protected by `isOwner()` | Protected by `isValidProgress()` | Protected by `isValidProgress()` |
