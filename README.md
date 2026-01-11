

# ⚡ TechFest Typing Competition Platform

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-repo/typing-comp)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7+-blue.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-red.svg)](LICENSE)

> A **production-ready, full-stack typing competition platform** built with Node.js, Socket.io, MongoDB, and Vanilla JavaScript. Perfect for college techfests, typing competitions, and typing speed challenges with real-time scoring and anti-cheating measures.

## 📋 Table of Contents

- [✨ Features](#-features)
- [� Prerequisites](#-prerequisites)
- [🚀 Quick Start](#-quick-start)
- [🌍 Environment Variables](#-environment-variables)
- [🐳 Docker Troubleshooting](#-docker-troubleshooting)
- [📖 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## ✨ Features

- **Real-time Competition**: Live typing races with instant updates via WebSocket
- **Anti-Cheating Measures**: Advanced detection to ensure fair play
- **Multi-Role Support**: Separate interfaces for organizers, participants, and admins
- **Comprehensive Scoring**: Accurate WPM and accuracy calculations
- **Export Rankings**: Generate and export competition results
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Production Ready**: Optimized for performance and scalability

## � Prerequisites

### For Docker Setup (Recommended)
- **Docker**: Version 20.10 or higher ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: Version 1.29 or higher (usually included with Docker Desktop)
- **Disk Space**: At least 2GB free for MongoDB image and data
- **Ports**: Ensure ports 3000 and 27017 are available

### For Manual Setup
- **Node.js**: Version 18 LTS or higher ([Download](https://nodejs.org/))
- **npm**: Version 8 or higher (comes with Node.js)
- **MongoDB**: Version 6 or higher ([Install](https://docs.mongodb.com/manual/installation/))
  - **macOS**: `brew install mongodb-community`
  - **Ubuntu**: Follow [MongoDB Ubuntu Guide](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)
  - **Windows**: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
- **Git**: For cloning the repository
- **Disk Space**: At least 1GB free for dependencies and MongoDB data

## 🚀 Quick Start

### 🐳 Run with Docker (Recommended)

You can run the entire application stack (App + MongoDB) with a single command. No need to install Node.js or MongoDB locally.

1. **Clone the Repository**
   ```bash
   git clone https://github.com/saurabh-dev-vns/typing-comp.git
   cd typing-comp
   ```

2. **Start the Platform**
   ```bash
   docker-compose up --build
   ```
   
   Expected output:
   ```
   app_1   | ✓ MongoDB connected
   app_1   | 🚀 Server running on http://localhost:3000
   ```

3. **Access Application**
   - **Participant Portal**: [http://localhost:3000](http://localhost:3000)
   - **Organizer Dashboard**: [http://localhost:3000/organizer](http://localhost:3000/organizer)

4. **Stop the Platform**
   ```bash
   docker-compose down
   ```

### 🔧 Manual Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/saurabh-dev-vns/typing-comp.git
   cd typing-comp
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your configuration
   # See "Environment Variables" section below for details
   ```

3. **Ensure MongoDB is Running**
   ```bash
   # Start MongoDB locally (if using local MongoDB)
   # macOS:
   brew services start mongodb-community
   
   # Ubuntu:
   sudo systemctl start mongod
   
   # Windows:
   # MongoDB should start automatically if installed as a service
   ```

4. **Start Server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access Application**
   - **Participant Portal**: [http://localhost:3000](http://localhost:3000)
   - **Organizer Dashboard**: [http://localhost:3000/organizer](http://localhost:3000/organizer)

## 🌍 Environment Variables

The application uses environment variables to configure behavior for different environments. Create a `.env` file in the root directory or set these in your deployment platform.

### Server Configuration
| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `PORT` | `3000` | Server port | `3000`, `8080` |
| `NODE_ENV` | `development` | Runtime environment | `development`, `production`, `test` |

### Database Configuration
| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `MONGODB_URI` | `mongodb://localhost:27017/typing-platform` | MongoDB connection string | `mongodb://mongo:27017/typing-platform` (Docker), `mongodb+srv://user:pass@cluster.mongodb.net/typing-platform` (Atlas) |

### Authentication
| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `JWT_SECRET` | `fallback_secret_key_change_in_production` | Secret key for signing JWT tokens. **IMPORTANT**: Use a strong random string in production (min 32 characters) | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `24h` | JWT token expiration time | `24h`, `7d`, `30d` |

### Logging
| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `LOG_LEVEL` | `info` | Logging level | `error`, `warn`, `info`, `http`, `debug` |

### Quick Setup - Copy & Paste

**For Development (Local Setup):**
```bash
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/typing-platform
JWT_SECRET=dev_secret_key_change_in_production
JWT_EXPIRES_IN=24h
LOG_LEVEL=debug
```

**For Docker Setup:**
```bash
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://mongo:27017/typing-platform
JWT_SECRET=docker_dev_secret_change_in_production
JWT_EXPIRES_IN=24h
LOG_LEVEL=info
```

**For Production:**
```bash
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/typing-platform
JWT_SECRET=<generate-strong-random-key>
JWT_EXPIRES_IN=7d
LOG_LEVEL=warn
```

## 🐳 Docker Troubleshooting

### Common Docker Issues and Solutions

#### 1. **Port Already in Use**

**Problem**: Error like `bind: address already in use` or `Port 3000 is already allocated`

**Solutions**:
```bash
# Option A: Free up the port (macOS/Linux)
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Option B: Use a different port in docker-compose.yml
# Edit ports section:
# ports:
#   - "3001:3000"  # Changed from 3000:3000
docker-compose down
docker-compose up --build
```

#### 2. **Container Won't Start / MongoDB Connection Failed**

**Problem**: App container exits immediately or shows `MongooseError: connect ECONNREFUSED`

**Solutions**:
```bash
# Check container logs for detailed error
docker-compose logs app

# Ensure mongo service is running and healthy
docker-compose ps

# If mongo is not up, restart services
docker-compose down -v
docker-compose up --build

# Verify MongoDB is listening (inside app container)
docker-compose exec app node -e "require('mongoose').connect('mongodb://mongo:27017/typing-platform').then(() => console.log('✓ Connected')).catch(e => console.log('✗ Error:', e.message))"
```

#### 3. **Docker Image Build Fails**

**Problem**: Error during `docker-compose up --build` with npm install failures

**Solutions**:
```bash
# Clear Docker cache and rebuild
docker-compose down
docker system prune -a --volumes  # WARNING: Removes all unused Docker data
docker-compose up --build

# Build with verbose output for debugging
docker-compose build --verbose

# Check Node.js and npm versions in Dockerfile
docker run node:18-alpine node --version && npm --version
```

#### 4. **Data Persistence Issues**

**Problem**: Data is lost after `docker-compose down` or container restart

**Solution**: Verify volume mounting in docker-compose.yml:
```yaml
volumes:
  mongo_data:  # Named volume for persistence

services:
  mongo:
    volumes:
      - mongo_data:/data/db  # Ensure this is present
```

**Backup/Restore MongoDB data**:
```bash
# Backup
docker-compose exec mongo mongodump --out /data/backup

# Restore
docker-compose exec mongo mongorestore /data/backup
```

#### 5. **Out of Disk Space**

**Problem**: Error like `Error response from daemon: write error`

**Solutions**:
```bash
# Check Docker disk usage
docker system df

# Clean up unused images, containers, and volumes
docker system prune -a --volumes

# Remove specific containers/images if needed
docker-compose down -v
```

#### 6. **Service Health Check Failures**

**Problem**: Container marked as `unhealthy` in `docker-compose ps`

**Solution**: Check logs and verify environment variables:
```bash
# View detailed logs
docker-compose logs -f

# Verify environment variables are set correctly
docker-compose config | grep -A 20 "environment:"

# Restart services
docker-compose restart
```

#### 7. **Permission Issues on macOS/Linux**

**Problem**: Permission denied errors when accessing Docker socket

**Solution**:
```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Restart Docker Desktop (macOS)
# Docker > Preferences > reset or restart Docker engine
```

### Docker Debugging Commands

```bash
# View real-time logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
docker-compose logs -f mongo

# Access app container shell
docker-compose exec app sh

# Access MongoDB shell
docker-compose exec mongo mongosh

# Check container status
docker-compose ps

# Detailed container information
docker-compose ps -a

# Check network connectivity between containers
docker-compose exec app ping mongo

# View resource usage
docker stats
```

### Docker Best Practices

1. **Always use `.env` file for sensitive data** - Never commit actual values
2. **Use named volumes** for database persistence - Prevents data loss on restart
3. **Check logs before restarting** - Helps identify root cause
4. **Keep images up to date** - Regularly pull latest Node.js and MongoDB images
5. **Use `--build` flag** when environment variables change in Dockerfile

## 📖 Documentation

This documentation is organized into modular files for better navigation. See the [docs](./docs/) folder for complete documentation:

| Document | Description |
|----------|-------------|
| **[FEATURES.md](./docs/FEATURES.md)** | Complete feature list and capabilities |
| **[SETUP.md](./docs/SETUP.md)** | Installation and configuration guide |
| **[QUICKSTART.md](./docs/QUICKSTART.md)** | Quick start guide for organizers and participants |
| **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | Project structure and tech stack |
| **[SOCKET_API.md](./docs/SOCKET_API.md)** | WebSocket events and communication protocol |
| **[DATABASE.md](./docs/DATABASE.md)** | MongoDB schema and data structure |
| **[DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md)** | Color tokens, typography, spacing, animations |
| **[REST_API.md](./docs/REST_API.md)** | REST API endpoints and responses |
| **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** | Deployment guides for Render and Railway |
| **[TESTING.md](./docs/TESTING.md)** | Testing checklist and edge cases |
| **[CONFIG.md](./docs/CONFIG.md)** | Configuration and customization options |
| **[TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** | Common issues and solutions |
| **[PERFORMANCE.md](./docs/PERFORMANCE.md)** | Performance metrics and optimization |
| **[CONTRIBUTING.md](./docs/CONTRIBUTING.md)** | Contribution guidelines |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for techfest typing competitions**

**Last Updated**: January 9, 2026  
**Version**: 1.0.0
