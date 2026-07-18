# Security Spec: Hardened Firestore Rules for OmniHub Pro

## 1. Data Invariants
- A `User` document MUST exist with `uid` matching `request.auth.uid`.
- `Friendship` MUST have a `senderId` and `receiverId`, and `status` MUST be 'pending' or 'accepted'.
- `ChatMessage` MUST have a `roomId` that strictly follows the `senderId_receiverId` format (lexicographical).
- `DeveloperNews` MUST be authored by a user, `createdAt` is server-time.

## 2. The "Dirty Dozen" Payloads (Examples)
1. Shadow Update: Updating a `User` profile with `{ gold: 999999, isAdmin: true }` (Injecting Ghost Field).
2. Identity Spoofing: Creating a `Friendship` with `senderId: 'someone-else-uid'`.
3. State Shortcutting: Updating a `Friendship` status directly from 'pending' to 'blocked' (if not allowed).
4. Resource Poisoning: Creating a `User` with `username` as a 2KB string.
5. PII Leak: Reading `users/{targetId}/private/info` as a non-owner.
6. Email Spoofing: Creating a `User` profile where `email` matches admin but `email_verified` is false.
7. Orphaned Record: Creating a `ChatMessage` where the `senderId` does not exist.
8. Immutable Field Write: Updating `createdAt` on a `User` document.
9. Schema Violation (Type): Setting `gold` (number) to a string "9999".
10. Schema Violation (Required): Creating a `Friendship` without `senderUsername`.
11. Path Variable Poisoning: Accessing `/chats/{poisonedId}` where ID is 2KB.
12. Terminal State Write: Updating a `Friendship` after `status` is 'accepted'.

## 3. Test Runner Plan
- Implement `firestore.rules.test.ts` to assert PERMISSION_DENIED on the above 12 payloads.
