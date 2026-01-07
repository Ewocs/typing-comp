
# 🏗️ Project Architecture

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Performance Considerations](#performance-considerations)

---

## 🎯 Overview

The Typing Competition Platform is a **real-time, full-stack web application** designed for conducting typing competitions at college techfests. The architecture follows a **client-server model** with real-time communication capabilities.

### Key Architectural Principles
- **Separation of Concerns**: Clear division between authentication, competition logic, and real-time features
- **Real-time First**: Built around WebSocket communication for live updates
- **Security by Design**: Multiple layers of security and anti-cheating measures
- **Scalability**: Designed to handle 50+ concurrent participants
- **Maintainability**: Modular structure with clear responsibilities

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Node.js | v14+ | JavaScript runtime environment |
| **Web Framework** | Express.js | v4+ | HTTP server and REST API |
| **Real-time** | Socket.io | v4+ | WebSocket communication |
| **Database** | MongoDB | v5+ | Data persistence |
| **ODM** | Mongoose | v7+ | MongoDB object modeling |
| **Frontend** | Vanilla JavaScript | ES6+ | Client-side logic |
| **UI** | HTML5 + CSS3 | - | User interface |
| **Authentication** | JWT | - | Secure authentication |
| **Security** | Helmet.js | - | Security headers |
| **Containerization** | Docker | - | Development & deployment |

---

## 📂 Project Structure

```
typing-comp/
├── 📄 README.md                    # Project documentation
├── 📄 package.json                 # Dependencies and scripts
├── 📄 package-lock.json            # Locked dependency versions
├── 📄 Dockerfile                   # Container configuration
├── 📄 docker-compose.yml           # Multi-container setup
├── 📄 .env.example                 # Environment variables template
├── 📄 .gitignore                   # Git ignore patterns
├── 📄 .prettierrc                  # Code formatting rules
├── 📄 eslint.config.js             # Linting configuration
│
├── 📁 .github/                     # GitHub workflows and templates
│   ├── 📁 workflows/               # CI/CD workflows
│   └── 📁 ISSUE_TEMPLATE/         # Issue templates
│
├── 📁 docs/                        # Comprehensive documentation
│   ├── 📄 ARCHITECTURE.md          # This file
│   ├── 📄 REST_API.md             # API documentation
│   ├── 📄 SOCKET_API.md           # WebSocket documentation
│   ├── 📄 FEATURES.md             # Feature list
│   ├── 📄 SETUP.md                # Installation guide
│   ├── 📄 DEPLOYMENT.md           # Deployment guide
│   └── 📄 CONTRIBUTING.md         # Contribution guide
│
├── 📁 src/                         # Source code
│   ├── 📄 server.js               # Application entry point
│   ├── 📄 app.js                  # Express app configuration
│   │
│   ├── 📁 config/                 # Configuration modules
│   │   ├── 📄 database.js         # MongoDB connection
│   │   ├── 📄 logger.js           # Winston logger setup
│   │   └── 📄 swagger.js          # API documentation config
│   │
│   ├── 📁 middleware/             # Express middleware
│   │   ├── 📄 auth.js             # JWT authentication
│   │   └── 📄 requestLogger.js    # Request logging
│   │
│   ├── 📁 models/                 # Database schemas
│   │   ├── 📄 Competition.js      # Competition data model
│   │   └── 📄 Organizer.js        # Organizer data model
│   │
│   ├── 📁 routes/                 # REST API endpoints
│   │   ├── 📄 auth.js             # Authentication routes
│   │   ├── 📄 competition.js      # Competition CRUD
│   │   └── 📄 export.js           # Data export routes
│   │
│   ├── 📁 socket/                 # Real-time communication
│   │   ├── 📄 events.js           # Socket event handler
│   │   ├── 📁 handlers/           # Event handlers
│   │   │   ├── 📄 join.js         # Join competition logic
│   │   │   ├── 📄 round.js        # Round management
│   │   │   └── 📄 typing.js       # Typing progress tracking
│   │   └── 📁 utils/              # Socket utilities
│   │       └── 📄 leaderboard.js  # Leaderboard calculations
│   │
│   ├── 📁 utils/                  # Utility functions
│   │   └── 📄 codeGenerator.js    # Competition code generator
│   │
│   └── 📁 public/                 # Frontend assets
│       ├── 📄 styles.css          # Global styles
│       ├── 📄 participant.html    # Participant interface
│       ├── 📄 organizer.html      # Organizer dashboard
│       ├── 📄 login.html          # Authentication page
│       ├── 📄 register.html       # Registration page
│       ├── 📄 exportrankings.html # Export interface
│       ├── 📄 participant-script.js # Participant logic
│       ├── 📄 organizer-script.js   # Organizer logic
│       ├── 📄 login-script.js       # Auth logic
│       └── 📄 register-script.js    # Registration logic
│
└── 📁 tests/                       # Test suites
    ├── 📄 app.test.js              # Application tests
    └── 📄 security.test.js         # Security tests
```

---

## 🔧 Core Components

### 🗄️ **Database Layer (MongoDB)**
- **Purpose**: Persistent data storage
- **Collections**: 
  - `competitions` - Competition data, rounds, results
  - `organizers` - User accounts and authentication
- **Features**: Indexing, validation, relationships

### 🌐 **API Layer (Express.js)**
- **Purpose**: HTTP server and REST API endpoints
- **Features**: 
  - Authentication middleware
  - Request validation
  - Error handling
  - Security headers (Helmet.js)
  - Rate limiting
  - CORS configuration

### ⚡ **Real-time Layer (Socket.io)**
- **Purpose**: Live updates and real-time communication
- **Features**:
  - Competition state synchronization
  - Live leaderboard updates  
  - Participant progress tracking
  - Round management events
  - Anti-cheating monitoring

### 🎨 **Frontend Layer (Vanilla JS)**
- **Purpose**: User interface and client-side logic
- **Components**:
  - Participant interface (typing test)
  - Organizer dashboard (competition management)
  - Authentication forms
  - Real-time data visualization

### 🛡️ **Security Layer**
- **Purpose**: Application security and anti-cheating
- **Features**:
  - JWT-based authentication
  - Input validation and sanitization
  - Rate limiting and DDoS protection
  - Content Security Policy (CSP)
  - Anti-cheating measures

---

## 🔄 Data Flow

### **1. Competition Creation Flow**
```
Organizer → Auth → REST API → Database → Socket.io → Dashboard Update
```

### **2. Participant Join Flow**
```
Participant → Socket.io → Validation → Database → Room Join → Live Updates
```

### **3. Typing Progress Flow**
```
Keystroke → Client Validation → Socket.io → Server Validation → Database → Leaderboard Update
```

### **4. Round Management Flow**
```
Organizer Action → Socket.io → Round State Change → Broadcast → All Participants
```

---

## 🛡️ Security Architecture

### **Authentication & Authorization**
- **JWT Tokens**: Stateless authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Protected Routes**: Middleware-based protection
- **Session Management**: Token expiration and refresh

### **Anti-Cheating Measures**
- **Client-side Prevention**: Disabled copy/paste/context menu
- **Server-side Validation**: All calculations verified server-side
- **Focus Monitoring**: Tab switch detection and warnings
- **Submission Validation**: Post-round submission blocking
- **Real-time Monitoring**: Keystroke pattern analysis

### **Network Security**
- **HTTPS Enforcement**: SSL/TLS encryption
- **CORS Configuration**: Controlled cross-origin access
- **Rate Limiting**: DDoS and abuse prevention
- **Input Sanitization**: XSS and injection prevention

---

## 🚀 Deployment Architecture

### **Development Environment**
```
Docker Compose → MongoDB Container + Node.js Container → Local Development
```

### **Production Environment**
```
Load Balancer → Node.js Instances → MongoDB Cluster → CDN (Static Assets)
```

### **Supported Platforms**
- **Cloud Providers**: Render, Railway, Heroku, AWS, GCP
- **Container Orchestration**: Docker Swarm, Kubernetes
- **Database Hosting**: MongoDB Atlas, self-hosted MongoDB

---

## ⚡ Performance Considerations

### **Real-time Optimization**
- **Throttled Updates**: Leaderboard updates limited to 1-second intervals
- **Event Debouncing**: Typing progress throttling
- **Connection Pooling**: MongoDB connection optimization
- **Memory Management**: Efficient data structures and cleanup

### **Scalability Features**
- **Concurrent Support**: 50+ simultaneous participants
- **Horizontal Scaling**: Stateless application design
- **Database Indexing**: Optimized queries for large datasets
- **Caching Strategy**: In-memory data for active competitions

### **Client-side Performance**
- **Lazy Loading**: Progressive content loading
- **DOM Optimization**: Efficient UI updates
- **Network Efficiency**: Minimal payload sizes
- **Browser Compatibility**: Cross-browser optimization

---

## 🔗 Component Interactions

### **Server Startup Sequence**
1. Load environment variables
2. Initialize database connection
3. Configure Express middleware
4. Setup Socket.io server
5. Register API routes
6. Start HTTP server

### **Competition Lifecycle**
1. **Creation**: Organizer creates competition via REST API
2. **Configuration**: Rounds and settings configured
3. **Joining**: Participants join via Socket.io
4. **Execution**: Real-time round management and progress tracking
5. **Completion**: Results calculation and export
6. **Cleanup**: Memory cleanup and data archival

This architecture ensures **reliability**, **security**, and **scalability** while providing an excellent user experience for both organizers and participants.