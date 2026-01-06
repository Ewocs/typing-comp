## 📡 REST API Reference

This document provides detailed specifications for all API endpoints in the Typing Competition Platform.

## Authentication Endpoints

### POST /api/auth/register - Register New Organizer

**Authentication:** None required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "organizer": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or validation errors
- `500 Internal Server Error`: Server error during registration

**Validation Rules:**
- Name: Required, string
- Email: Required, valid email format, must be unique
- Password: Required, minimum 6 characters

### POST /api/auth/login - Organizer Login

**Authentication:** None required

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "organizer": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid email or password
- `500 Internal Server Error`: Server error during login

### GET /api/auth/me - Get Current Organizer Info

**Authentication:** Bearer token required (JWT)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "organizer": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "lastLogin": "2024-01-20T14:45:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Organizer not found
- `500 Internal Server Error`: Server error

## Competition Endpoints

### POST /api/create - Create Competition

**Authentication:** Bearer token required (JWT)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "TechFest 2025 Typing Championship",
  "description": "Annual college tech fest typing competition",
  "rounds": [
    {
      "text": "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once.",
      "duration": 60
    },
    {
      "text": "Programming is the process of creating a set of instructions that tell a computer how to perform a task.",
      "duration": 45
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "code": "AB12C",
  "competitionId": "507f1f77bcf86cd799439011"
}
```

**Error Responses:**
- `400 Bad Request`: Missing name or rounds
- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Server error during creation

**Validation Rules:**
- Name: Required, string
- Description: Optional, string
- Rounds: Required, array with at least one round
- Each round must have: text (string) and duration (integer > 0)

### GET /api/competition/:code - Get Competition by Code

**Authentication:** None required

**Path Parameters:**
- `code`: Competition code (string, e.g., "AB12C")

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "TechFest 2025 Typing Championship",
  "code": "AB12C",
  "status": "pending",
  "roundCount": 2,
  "roundsCompleted": 0,
  "participants": 0,
  "currentRound": -1
}
```

**Error Responses:**
- `404 Not Found`: Competition not found
- `500 Internal Server Error`: Server error

### GET /api/my-competitions - Get Organizer's Competitions

**Authentication:** Bearer token required (JWT)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:** None

**Response (200 OK):**
```json
{
  "success": true,
  "competitions": [
    {
      "name": "TechFest 2025",
      "code": "AB12C",
      "status": "ongoing",
      "currentRound": 1,
      "totalRounds": 3,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "participants": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
    }
  ],
  "count": 1
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Server error

### GET /api/competition/:competitionId - Get Full Competition Details

**Authentication:** None required

**Path Parameters:**
- `competitionId`: Competition ID (MongoDB ObjectId)

**Response (200 OK):**
```json
{
  "competition": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "TechFest 2025 Typing Championship",
    "description": "Annual college tech fest typing competition",
    "code": "AB12C",
    "organizerId": "507f1f77bcf86cd799439013",
    "organizer": "John Doe",
    "rounds": [
      {
        "roundNumber": 1,
        "text": "The quick brown fox jumps over the lazy dog...",
        "duration": 60,
        "status": "completed",
        "startedAt": "2024-01-20T10:00:00.000Z",
        "endedAt": "2024-01-20T11:00:00.000Z",
        "participantsCompleted": 15,
        "highestWpm": 85.5,
        "lowestWpm": 25.3,
        "averageWpm": 52.7,
        "averageAccuracy": 94.2,
        "results": [...],
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "status": "ongoing",
    "currentRound": 1,
    "totalRounds": 3,
    "roundsCompleted": 1,
    "participants": ["507f1f77bcf86cd799439011"],
    "finalRankings": [],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: Competition not found
- `500 Internal Server Error`: Server error

### GET /api/competition/:competitionId/rankings - Get Competition Rankings

**Authentication:** None required

**Path Parameters:**
- `competitionId`: Competition ID (MongoDB ObjectId)

**Response (200 OK):**
```json
{
  "success": true,
  "name": "TechFest 2025 Typing Championship",
  "code": "AB12C",
  "rankings": [
    {
      "rank": 1,
      "participantName": "Alice Johnson",
      "averageWpm": 78.5,
      "averageAccuracy": 96.2,
      "totalRoundsCompleted": 3,
      "highestWpm": 85.3,
      "lowestWpm": 72.1
    },
    {
      "rank": 2,
      "participantName": "Bob Smith",
      "averageWpm": 74.2,
      "averageAccuracy": 94.8,
      "totalRoundsCompleted": 3,
      "highestWpm": 82.1,
      "lowestWpm": 68.5
    }
  ],
  "status": "completed"
}
```

**Error Responses:**
- `404 Not Found`: Competition not found
- `500 Internal Server Error`: Server error

## Authentication Notes

- JWT tokens are required for protected endpoints
- Include the token in the Authorization header as: `Bearer <token>`
- Tokens expire after 24 hours (configurable via JWT_EXPIRES_IN environment variable)
- Invalid or expired tokens return 401 Unauthorized

## Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource successfully created
- `400 Bad Request`: Invalid request data or validation error
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.
