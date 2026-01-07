const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Competition = require('../src/models/Competition');
const Participant = require('../src/models/Participant');
const { handleJoin } = require('../src/socket/handlers/join');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Participant Refactor', () => {
    let competition;

    beforeEach(async () => {
        await Competition.deleteMany({});
        await Participant.deleteMany({});

        competition = await Competition.create({
            name: 'Test Comp',
            code: 'TEST01',
            rounds: [{ roundNumber: 1, text: 'test', duration: 60 }],
            organizer: 'Organizer',
        });
    });

    it('should create a participant in the separate collection', async () => {
        const socketMock = {
            id: 'socket-123',
            join: jest.fn(),
            emit: jest.fn(),
        };
        const ioMock = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };
        const activeCompetitions = new Map();

        await handleJoin(
            socketMock,
            ioMock,
            { code: 'TEST01', participantName: 'Player1' },
            activeCompetitions
        );

        // Verify Participant document created
        const participant = await Participant.findOne({ name: 'Player1' });
        expect(participant).toBeDefined();
        expect(participant.competitionId.toString()).toBe(competition._id.toString());
        expect(participant.socketId).toBe('socket-123');

        // Verify Competition does NOT have participants array (schema check)
        const compCheck = await Competition.findById(competition._id);
        expect(compCheck.participants).toBeUndefined();
    });

    it('should prevent duplicate participants in the same competition', async () => {
        // Create first participant manually
        await Participant.create({
            competitionId: competition._id,
            name: 'Player1',
            socketId: 'socket-123'
        });

        // Try to create second with same name/comp
        try {
            await Participant.create({
                competitionId: competition._id,
                name: 'Player1',
                socketId: 'socket-456'
            });
            fail('Should have thrown duplicate error');
        } catch (err) {
            expect(err.code).toBe(11000); // MongoDB duplicate key error
        }
    });
});
