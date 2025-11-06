import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';
import authRoutes from '../routes/authRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    await User.create([
      { name: 'John Doe', email: 'john@example.com', password: 'password', isDonor: true, bloodGroup: 'O+', city: 'Test City', phone: '1234567890' },
      { name: 'Jane Smith', email: 'jane@example.com', password: 'password', isDonor: false },
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should return only public donor information', async () => {
    const res = await request(app).get('/api/auth/donors-public');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty('name', 'John Doe');
    expect(res.body[0]).toHaveProperty('bloodGroup', 'O+');
    expect(res.body[0]).toHaveProperty('city', 'Test City');
    expect(res.body[0]).not.toHaveProperty('email');
    expect(res.body[0]).not.toHaveProperty('phone');
  });
});