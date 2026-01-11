# 📡 REST API Reference

This document provides comprehensive documentation for all REST API endpoints in the Typing Competition Platform.

## Table of Contents

- [Health Check](#-health-check)
- [Authentication](#-authentication)
  - [Authentication Flow](#authentication-flow)
  - [User Roles](#user-roles)
  - [Security Features](#security-features)
- [Authentication Endpoints](#-authentication-endpoints)
- [Competition Endpoints](#-competition-endpoints)
- [Analytics Endpoints](#-analytics-endpoints)
- [Export Endpoints](#-export-endpoints)
- [API Documentation](#-api-documentation)
- [Postman Collection](#-postman-collection)
- [Code Examples](#-code-examples)
- [Error Response Format](#-error-response-format)
- [WebSocket Events](#-websocket-events)
- [Security Features](#️-security-features)

---

## 🏥 Health Check

### GET /health

Check the health status of the API server.

**cURL Example:**
```bash
curl -X GET http://localhost:3000/health
```

**Response (200):**
```json
{
  "status": "ok",
  "uptime": 1234.567,
  "timestamp": "2026-01-09T12:00:00.000Z"
}
```

**Errors:**
- `500` - Server is not healthy

---

## 🔐 Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Rate limiting is applied: **100 requests per 15 minutes per IP**.

### Authentication Flow

1. **Registration**: New organizers register with name, email, and password
2. **Login**: Existing organizers authenticate with email/password to receive JWT token
3. **Token Usage**: Include JWT token in `Authorization: Bearer <token>` header for protected endpoints
4. **Token Expiration**: Tokens expire after 24 hours - refresh by logging in again

### User Roles

Currently, the system supports a single role:
- **Organizer**: Can create competitions, view analytics, export data, and manage their own competitions

### Security Features

- **Password Requirements**: Minimum 12 characters with uppercase, lowercase, numbers, and special characters
- **JWT Tokens**: Secure token-based authentication with expiration
- **Rate Limiting**: 100 requests per 15-minute window per IP
- **Input Validation**: Server-side validation for all inputs
- **CORS**: Configurable cross-origin resource sharing
- **Helmet.js**: Security headers including Content Security Policy (CSP)

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

**Validation Rules:**
- Name: Required, string
- Email: Required, valid email format, must be unique
- Password: Required, minimum 12 characters with uppercase, lowercase, number, and special character (@$!%*?&)
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

**Validation Rules:**
- Name: Required, 3-100 characters, letters, numbers, spaces, hyphens, underscores only
- Description: Optional, max 500 characters
- Rounds: Required, array of 1-10 round objects
- Round.text: Required, 10-2000 characters
- Round.duration: Required, integer, 30-600 seconds (10 minutes max)

**Competition States:**
- `active`: Competition is running and accepting participants
- `completed`: All rounds finished, final rankings available
- `cancelled`: Competition was cancelled by organizer

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

## 📊 Analytics Endpoints

All analytics endpoints require authentication and provide statistical insights for organizers.

### GET /api/analytics/overview

Get overview statistics for all competitions created by the authenticated organizer. **Requires authentication.**

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/analytics/overview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "competitions": {
      "total": 5,
      "active": 2,
      "completed": 3
    },
    "participants": {
      "total": 127,
      "average": 25
    },
    "performance": {
      "avgWPM": 68,
      "maxWPM": 95,
      "minWPM": 32
    }
  }
}
```

**Errors:**
- `401` - Unauthorized (invalid token)
- `500` - Failed to fetch analytics overview

---

### GET /api/analytics/competitions

Get detailed statistics for individual competitions created by the authenticated organizer. **Requires authentication.**

**Query Parameters:**
- None (returns last 20 competitions by default)

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/analytics/competitions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "name": "TechFest 2026",
      "code": "AB12C",
      "status": "completed",
      "participants": 15,
      "rounds": 2,
      "avgWPM": 72,
      "createdAt": "2026-01-06T10:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `401` - Unauthorized (invalid token)
- `500` - Failed to fetch competition analytics

---

### GET /api/analytics/participants

Get participant distribution and top performer statistics across all competitions. **Requires authentication.**

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/analytics/participants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "distribution": [
      {
        "competition": "TechFest 2026",
        "code": "AB12C",
        "participants": 15
      }
    ],
    "topPerformers": [
      {
        "name": "Alice Johnson",
        "avgWPM": 85,
        "maxWPM": 92,
        "totalRounds": 4,
        "avgAccuracy": 97
      }
    ]
  }
}
```

**Errors:**
- `401` - Unauthorized (invalid token)
- `500` - Failed to fetch participant analytics

---

### GET /api/analytics/trends

Get performance and competition creation trends over time. **Requires authentication.**

**Query Parameters:**
- `period` (optional): Number of days to look back (default: 30)

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/analytics/trends?period=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "competitions": [
      {
        "date": "2026-01-01",
        "competitions": 2,
        "participants": 45
      }
    ],
    "performance": [
      {
        "date": "2026-01-01",
        "avgWPM": 68,
        "avgAccuracy": 94,
        "totalTypists": 23
      }
    ]
  }
}
```

**Errors:**
- `401` - Unauthorized (invalid token)
- `500` - Failed to fetch trend analytics

---

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

---

## � Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "error": "technical_error_code",
  "timestamp": "2026-01-09T12:00:00.000Z"
}
```

### Common HTTP Status Codes

- **400 Bad Request**: Invalid input data or validation errors
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Access denied (not the competition organizer)
- **404 Not Found**: Resource or endpoint doesn't exist
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side error

### Validation Error Format

For validation errors (400), the response includes field-specific errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ],
  "timestamp": "2026-01-09T12:00:00.000Z"
}
```

---
## 💻 Code Examples

### JavaScript (Node.js) Example

```javascript
const axios = require('axios');

async function createCompetition(token) {
  try {
    const response = await axios.post('http://localhost:3000/api/create', {
      name: 'TechFest 2026',
      description: 'Annual typing competition',
      rounds: [
        {
          text: 'The quick brown fox jumps over the lazy dog.',
          duration: 60
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Competition created:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

### Python Example

```python
import requests

def create_competition(token):
    url = 'http://localhost:3000/api/create'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    data = {
        'name': 'TechFest 2026',
        'description': 'Annual typing competition',
        'rounds': [
            {
                'text': 'The quick brown fox jumps over the lazy dog.',
                'duration': 60
            }
        ]
    }
    
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code == 200:
        print('Competition created:', response.json())
    else:
        print('Error:', response.json())
```

### cURL with Error Handling

```bash
#!/bin/bash

TOKEN="your_jwt_token_here"
URL="http://localhost:3000/api/create"

response=$(curl -s -w "\n%{http_code}" -X POST $URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "TechFest 2026",
    "rounds": [
      {
        "text": "The quick brown fox jumps over the lazy dog.",
        "duration": 60
      }
    ]
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
  echo "Success: $body"
else
  echo "Error ($http_code): $body"
fi
```

---
## �🔗 WebSocket Events

For real-time competition features, see [SOCKET_API.md](./SOCKET_API.md).

---

## 🛡️ Security Features

- **Helmet.js**: Security headers and CSP
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS**: Configurable cross-origin requests
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Server-side validation
- **Authorization**: Organizer-specific resource access
