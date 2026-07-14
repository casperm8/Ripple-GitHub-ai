# Ripple API Reference

Base URL: `http://localhost:5000/api`

All authenticated endpoints require an `Authorization: Bearer <token>` header.

---

## Authentication

### POST /auth/register
Register a new user.

**Request body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response `201`:**
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "username": "johndoe", "email": "john@example.com", "profile": {} }
}
```

---

### POST /auth/login
Log in with email and password.

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response `200`:**
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "username": "johndoe", "email": "john@example.com", "profile": {} }
}
```

---

### GET /auth/me *(auth required)*
Get the currently authenticated user.

**Response `200`:** User object (password excluded).

---

### POST /auth/refresh *(auth required)*
Issue a new JWT token.

**Response `200`:** `{ "token": "<jwt>" }`

---

## Referral Codes

### GET /referral-codes
List active codes with optional filtering and pagination.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `platform` | string | Filter by platform (uber, airbnb, doordash, lyft, shopify, amazon, other) |
| `search` | string | Search in description, code, and tags |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |

**Response `200`:**
```json
{
  "codes": [...],
  "total": 42,
  "page": 1,
  "pages": 5
}
```

---

### GET /referral-codes/featured
Get top 6 codes sorted by views and shares.

**Response `200`:** Array of code objects.

---

### GET /referral-codes/:id
Get a single code by ID. Increments the view counter.

**Response `200`:** Code object.

---

### POST /referral-codes *(auth required)*
Create a new referral code.

**Request body:**
```json
{
  "code": "SAVE10",
  "platform": "uber",
  "description": "Get $10 off your first ride",
  "discount": "$10 off",
  "expiryDate": "2025-12-31",
  "usageLimit": 100,
  "tags": ["ride", "discount"]
}
```

**Response `201`:** Created code object.

---

### PUT /referral-codes/:id *(auth required)*
Update an existing code. Only the owner may update.

**Request body:** Same fields as POST.

**Response `200`:** Updated code object.

---

### DELETE /referral-codes/:id *(auth required)*
Delete a code. Only the owner may delete.

**Response `204`:** No content.

---

### POST /referral-codes/:id/share
Increment the share counter for a code.

**Response `200`:** Updated code object.

---

### POST /referral-codes/:id/use
Increment the usage counter. Deactivates the code automatically if `usageLimit` is reached.

**Response `200`:** Updated code object.

---

## Users

### GET /users/:username
Get a user's public profile.

**Response `200`:**
```json
{
  "id": "...",
  "username": "johndoe",
  "email": "john@example.com",
  "profile": { "firstName": "John", "lastName": "Doe", "bio": "...", "avatar": "..." },
  "codesCount": 5,
  "followersCount": 12,
  "followingCount": 7,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /users/:username/codes
Get a user's referral codes with pagination.

**Query parameters:** `page`, `limit`

**Response `200`:** `{ "codes": [...], "total": 5, "page": 1, "pages": 1 }`

---

### GET /users/:username/feed
Get referral codes from users that `:username` follows.

**Query parameters:** `page`, `limit`

**Response `200`:** `{ "codes": [...], "total": 20, "page": 1, "pages": 2 }`

---

### POST /users/:username/follow *(auth required)*
Follow a user.

**Response `200`:** `{ "message": "Now following user" }`

---

### DELETE /users/:username/follow *(auth required)*
Unfollow a user.

**Response `200`:** `{ "message": "Unfollowed user" }`

---

### PUT /users/profile *(auth required)*
Update the authenticated user's profile.

**Request body:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "bio": "Referral enthusiast",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response `200`:** `{ "id": "...", "username": "...", "profile": {} }`

---

### GET /users/search/:query
Search for users by username, first name, or last name.

**Response `200`:** Array of up to 10 user objects.

---

## Health

### GET /health
Check server status.

**Response `200`:** `{ "status": "Server is running" }`

---

## Socket.io Events

The server uses Socket.io for real-time features. Connect to the same base URL.

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `user-online` | `userId` | Mark user as online |
| `code-created` | code object | Broadcast new code |
| `code-updated` | code object | Broadcast updated code |
| `user-followed` | `{ targetUserId, followerId, followerName }` | Notify target of new follower |
| `code-viewed` | `{ codeId, views }` | Broadcast view count update |
| `code-shared` | `{ codeId, shares }` | Broadcast share count update |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `user-status` | `{ userId, status }` | Online/offline status change |
| `new-code` | code object | New code was created |
| `code-changed` | code object | Existing code was updated |
| `follower-notification` | `{ followerId, followerName }` | Someone followed you |
| `code-view-count` | `{ codeId, views }` | View count updated |
| `code-share-count` | `{ codeId, shares }` | Share count updated |
