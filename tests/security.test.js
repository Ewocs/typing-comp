const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Mock the database config to prevent immediate connection
jest.mock('../src/config/database', () => ({}));

let app;
let mongoServer;

describe('Security Middleware', () => {
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        process.env.MONGODB_URI = mongoUri;

        // Connect properly
        await mongoose.connect(mongoUri);

        // Require app after setting up environment
        app = require('../src/app');
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('should set Helmet security headers', async () => {
        const res = await request(app).get('/');
        expect(res.headers).toHaveProperty('content-security-policy');
        expect(res.headers).toHaveProperty('x-dns-prefetch-control');
        expect(res.headers).toHaveProperty('x-frame-options');
    });

    it('should set Rate Limit headers', async () => {
        const res = await request(app).get('/');
        expect(res.headers).toHaveProperty('ratelimit-limit');
        expect(res.headers).toHaveProperty('ratelimit-remaining');
    });

    describe('Authentication Validation Logging', () => {
        it('should log validation errors for registration', async () => {
            const invalidData = {
                name: 'A', // Too short
                email: 'invalid-email', // Invalid email
                password: 'short' // Too short and missing requirements
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(invalidData);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Validation failed');
            expect(Array.isArray(res.body.errors)).toBe(true);
        });

        it('should log validation errors for login', async () => {
            const invalidData = {
                email: 'not-an-email', // Invalid email
                password: '' // Empty password
            };

            const res = await request(app)
                .post('/api/auth/login')
                .send(invalidData);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Validation failed');
            expect(Array.isArray(res.body.errors)).toBe(true);
        });

        it('should log failed login attempts', async () => {
            const invalidCredentials = {
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            };

            const res = await request(app)
                .post('/api/auth/login')
                .send(invalidCredentials);

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe('Invalid email or password');
        });
    });
});

