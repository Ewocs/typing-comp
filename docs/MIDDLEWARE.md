# Middleware Documentation

This document describes the middleware components used in the Typing Competition Platform API.

## Authentication Middleware (`auth.js`)

### Purpose
The authentication middleware validates JWT tokens and attaches organizer information to the request object for protected routes.

### Location
`src/middleware/auth.js`

### How It Works

1. **Token Extraction**: Extracts the JWT token from the `Authorization` header
2. **Token Validation**: Verifies the token using the JWT secret
3. **Organizer Lookup**: Finds the organizer in the database using the decoded token ID
4. **Request Enhancement**: Attaches organizer data to the `req.organizer` object

### Usage
```javascript
const auth = require('../middleware/auth');

router.post('/protected-route', auth, (req, res) => {
  // req.organizer is available here
  console.log(req.organizer.name);
});
```

### Request Object Enhancement
After successful authentication, the middleware adds:
```javascript
req.organizer = {
  id: organizer._id,      // MongoDB ObjectId
  name: organizer.name,   // String
  email: organizer.email  // String
}
```

### Error Handling

#### Invalid/Missing Token
- **Status**: 401 Unauthorized
- **Response**: `{ "error": "No authentication token provided" }`
- **Trigger**: Missing Authorization header or not starting with "Bearer "

#### Invalid Token Format
- **Status**: 401 Unauthorized
- **Response**: `{ "error": "Invalid token" }`
- **Trigger**: Malformed JWT token

#### Expired Token
- **Status**: 401 Unauthorized
- **Response**: `{ "error": "Token expired" }`
- **Trigger**: JWT token has expired

#### Organizer Not Found
- **Status**: 401 Unauthorized
- **Response**: `{ "error": "Organizer not found" }`
- **Trigger**: Token is valid but organizer no longer exists in database

### Security Features

- **Bearer Token Only**: Only accepts tokens in "Bearer <token>" format
- **JWT Verification**: Uses `jsonwebtoken` library for secure token validation
- **Database Validation**: Ensures organizer still exists in database
- **Error Logging**: Logs authentication failures for security monitoring

### Environment Variables
- `JWT_SECRET`: Secret key for JWT verification (defaults to fallback for development)

### Dependencies
- `jsonwebtoken`: For JWT token verification
- `../models/Organizer`: MongoDB model for organizer lookup
- `../config/logger`: For logging authentication events

## Request Logger Middleware (`requestLogger.js`)

### Purpose
The request logger middleware logs incoming HTTP requests for debugging, monitoring, and analytics purposes.

### Location
`src/middleware/requestLogger.js`

### How It Works

1. **Request Capture**: Intercepts all incoming requests
2. **Information Extraction**: Gathers request details (method, URL, user agent, etc.)
3. **Logging**: Records the request information using the configured logger
4. **Pass Through**: Continues to the next middleware/route handler

### Usage
```javascript
const requestLogger = require('../middleware/requestLogger');

app.use(requestLogger); // Add to Express app
```

### Logged Information

The middleware logs the following request details:
- **Method**: HTTP method (GET, POST, PUT, DELETE, etc.)
- **URL**: Request URL/path
- **User Agent**: Client user agent string
- **IP Address**: Client IP address
- **Timestamp**: When the request was received

### Log Format
```
[INFO] Incoming request: GET /api/competition/ABC123 - User-Agent: Mozilla/5.0... - IP: 192.168.1.1
```

### Features

- **Non-Blocking**: Logging is asynchronous and doesn't block request processing
- **Structured Logging**: Uses the application's logger configuration
- **Security Conscious**: Logs IP addresses for security monitoring
- **Debug Friendly**: Includes user agent for debugging client issues

### Dependencies
- `../config/logger`: For logging functionality

## Middleware Order

In the Express application, middleware should be applied in this order:

```javascript
const express = require('express');
const requestLogger = require('./middleware/requestLogger');
const auth = require('./middleware/auth');

const app = express();

// 1. Request logging (should be first)
app.use(requestLogger);

// 2. Body parsing middleware
app.use(express.json());

// 3. Authentication (applied per route as needed)
app.post('/api/create', auth, createCompetitionHandler);
```

## Best Practices

### Authentication Middleware
- Apply only to routes that require authentication
- Use consistent error responses for security
- Monitor authentication failure logs for suspicious activity
- Keep JWT secrets secure and rotate regularly

### Request Logger Middleware
- Use in development and production for debugging
- Monitor logs for unusual patterns or attacks
- Consider log rotation for production deployments
- Respect privacy regulations when logging user data

## Testing

### Authentication Middleware
```javascript
// Test valid token
const req = { header: () => 'Bearer valid.jwt.token' };
const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
const next = jest.fn();

// Test invalid token
const req = { header: () => null };
```

### Request Logger Middleware
```javascript
// Test logging
const req = {
  method: 'GET',
  url: '/test',
  headers: { 'user-agent': 'test-agent' },
  ip: '127.0.0.1'
};
const res = {};
const next = jest.fn();
