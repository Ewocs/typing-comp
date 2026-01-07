# 📡 REST API Reference

This document provides comprehensive documentation for all REST API endpoints in the Typing Competition Platform.

## 🔐 Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Rate limiting is applied: **100 requests per 15 minutes per IP**.

---

## 🔑 Authentication Endpoints

### POST /api/auth/register

Create a new organizer account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "organizer": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Errors:**
- `400` - Missing required fields or password too short
- `400` - Email already registered
- `500` - Registration failed

---

### POST /api/auth/login

Authenticate an existing organizer.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "organizer": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Errors:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Login failed

---

### GET /api/auth/me

Get current authenticated organizer information. **Requires authentication.**

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "organizer": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-01-06T10:30:00.000Z",
    "lastLogin": "2026-01-06T15:45:00.000Z"
  }
}
```

**Errors:**
- `401` - Unauthorized (invalid token)
- `404` - Organizer not found
- `500` - Server error

---

## 🏆 Competition Endpoints

### POST /api/create

Create a new typing competition. **Requires authentication.**

**Authentication:** Bearer token required (JWT)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "TechFest 2026",
  "description": "Annual college typing competition",
  "rounds": [
    {
      "text": "The quick brown fox jumps over the lazy dog. This is a sample text for typing practice.",
      "duration": 60
    },
    {
      "text": "Programming is the art of telling another human what one wants the computer to do.",
      "duration": 90
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "TechFest 2026",
    "description": "Annual college typing competition",
    "rounds": [
      {
        "text": "The quick brown fox jumps over the lazy dog. This is a sample text for typing practice.",
        "duration": 60
      },
      {
        "text": "Programming is the art of telling another human what one wants the computer to do.",
        "duration": 90
      }
    ]
  }'
```

**Response (200):**
```json
{
  "success": true,
  "code": "AB12C",
  "competitionId": "507f1f77bcf86cd799439011"
}
```

**Errors:**
- `400` - Missing name or rounds
- `401` - Unauthorized
- `500` - Failed to create competition

---

### GET /api/competition/:code

Get competition details by competition code (5-character code).

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/competition/AB12C
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "TechFest 2026",
  "code": "AB12C",
  "status": "ongoing",
  "roundCount": 2,
  "roundsCompleted": 1,
  "participants": 15,
  "currentRound": 1
}
```

**Errors:**
- `404` - Competition not found
- `500` - Failed to fetch competition

---

### GET /api/competition/:competitionId

Get detailed competition data by MongoDB ObjectId.

**Response (200):**
```json
{
  "competition": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "TechFest 2026",
    "code": "AB12C",
    "status": "ongoing",
    "rounds": [
      {
        "roundNumber": 1,
        "text": "Sample text...",
        "duration": 60,
        "status": "completed",
        "results": []
      }
    ],
    "participants": [],
    "finalRankings": []
  }
}
```

**Errors:**
- `404` - Competition not found
- `500` - Failed to fetch competition

---

### GET /api/my-competitions

Get all competitions created by the authenticated organizer. **Requires authentication.**

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/my-competitions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "competitions": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "TechFest 2026",
      "code": "AB12C",
      "status": "completed",
      "currentRound": 2,
      "totalRounds": 2,
      "createdAt": "2026-01-06T10:00:00.000Z",
      "participants": 15
    }
  ],
  "count": 1
}
```

**Errors:**
- `401` - Unauthorized
- `500` - Failed to fetch competitions

---

### GET /api/competition/:competitionId/rankings

Get final rankings for a completed competition.

**Response (200):**
```json
{
  "success": true,
  "name": "TechFest 2026",
  "code": "AB12C",
  "rankings": [
    {
      "rank": 1,
      "participantName": "Alice Johnson",
      "averageWpm": 85.5,
      "averageAccuracy": 97.8,
      "totalRoundsCompleted": 2,
      "highestWpm": 92,
      "lowestWpm": 79
    }
  ],
  "status": "completed"
}
```

**Errors:**
- `404` - Competition not found
- `500` - Failed to fetch rankings

---

## 📊 Export Endpoints

All export endpoints require authentication and organizer ownership of the competition.

### GET /api/export/:competitionId/csv

Export competition rankings as CSV file.

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/export/507f1f77bcf86cd799439011/csv \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o "competition_rankings.csv"
```

**Response:** CSV file download with rankings data.

**Filename:** `competition_name_yyyy-mm-dd.csv`

**Errors:**
- `400` - No rankings available
- `403` - Permission denied (not organizer)
- `404` - Competition not found
- `500` - Export failed

---

### GET /api/export/:competitionId/json

Export complete competition data as JSON file.

**Response:** JSON file download with full competition data including:
- Competition metadata
- Final rankings  
- Round-by-round results
- Export timestamp and organizer info

**Filename:** `competition_name_yyyy-mm-dd.json`

**Errors:**
- `400` - No rankings available
- `403` - Permission denied
- `404` - Competition not found
- `500` - Export failed

---

### GET /api/export/:competitionId/rounds/csv

Export detailed round-by-round results as CSV file.

**Response:** CSV file download with detailed typing statistics per round.

**Filename:** `competition_name_rounds_yyyy-mm-dd.csv`

**Errors:**
- `400` - No round data available
- `403` - Permission denied
- `404` - Competition not found  
- `500` - Export failed

---

## 📝 API Documentation

Interactive API documentation is available at `/api-docs` when the server is running.

**Example:** `http://localhost:3000/api-docs`

---

## 🔧 Postman Collection

For easier testing, you can import these endpoints into Postman:

### Environment Variables
```
BASE_URL: http://localhost:3000
JWT_TOKEN: (set after login/register)
```

### Sample Postman Requests

**1. Register Organizer**
- Method: `POST`
- URL: `{{BASE_URL}}/api/auth/register`
- Body: Raw JSON
```json
{
  "name": "Test Organizer",
  "email": "test@example.com",
  "password": "password123"
}
```

**2. Login**
- Method: `POST`  
- URL: `{{BASE_URL}}/api/auth/login`
- Body: Raw JSON
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
- Tests Script: `pm.environment.set("JWT_TOKEN", pm.response.json().token);`

**3. Create Competition**
- Method: `POST`
- URL: `{{BASE_URL}}/api/create`
- Headers: `Authorization: Bearer {{JWT_TOKEN}}`
- Body: Raw JSON
```json
{
  "name": "Test Competition",
  "rounds": [
    {
      "text": "Sample typing text for competition",
      "duration": 60
    }
  ]
}
```

---

## 🔗 WebSocket Events

For real-time competition features, see [SOCKET_API.md](./SOCKET_API.md).

---

## 🛡️ Security Features

- **Helmet.js**: Security headers and CSP
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS**: Configurable cross-origin requests
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Server-side validation
- **Authorization**: Organizer-specific resource access
