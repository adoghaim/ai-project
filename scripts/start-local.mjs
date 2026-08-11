import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

const mongoPort = Number(process.env.MONGO_PORT || 27343);
const mockSmsPort = Number(process.env.MOCK_SMS_PORT || 3435);
const dataDirectory = path.resolve('.local', 'mongodb');

fs.mkdirSync(dataDirectory, { recursive: true });

console.log('[local] Starting MongoDB...');

const mongoServer = await MongoMemoryServer.create({
  binary: {
    version: process.env.MONGOMS_VERSION || '5.0.19',
  },
  instance: {
    port: mongoPort,
    dbName: 'crm',
    dbPath: dataDirectory,
    storageEngine: 'wiredTiger',
  },
});

process.env.NODE_ENV = 'development';
process.env.PORT ||= '3434';
process.env.MONGO_URL = mongoServer.getUri('crm');
process.env.ADMIN_PASSWORD ||= 'local-dev-only';
process.env.AWS_SEND_MESSAGE_URI = `http://127.0.0.1:${mockSmsPort}/send-message`;

console.log(`[local] MongoDB ready at ${process.env.MONGO_URL}`);

const mockMessages = [];
const mockSmsServer = http.createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json');

  if (request.method === 'GET' && request.url === '/messages') {
    response.end(JSON.stringify({ items: mockMessages }));
    return;
  }

  if (request.method === 'POST' && request.url === '/send-message') {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);

    const message = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    mockMessages.push({ ...message, receivedAt: new Date().toISOString() });
    console.log(`[local:sms] Captured mock message for ${message.phone}`);
    response.end(JSON.stringify({ mocked: true, success: true }));
    return;
  }

  response.statusCode = 404;
  response.end(JSON.stringify({ message: 'Not found' }));
});

await new Promise((resolve, reject) => {
  mockSmsServer.once('error', reject);
  mockSmsServer.listen(mockSmsPort, '127.0.0.1', resolve);
});

console.log(`[local] Mock SMS endpoint ready on http://127.0.0.1:${mockSmsPort}`);

const seedConnection = await mongoose
  .createConnection(process.env.MONGO_URL, { serverSelectionTimeoutMS: 5000 })
  .asPromise();
const customers = seedConnection.collection('customers');
const demoEmail = 'demo.customer@example.com';

if ((await customers.countDocuments({ email: demoEmail })) === 0) {
  await customers.insertOne({
    name: 'Demo Customer',
    age: 35,
    gender: 'Other',
    address: '100 Test Drive',
    email: demoEmail,
    phone: '5555550100',
    homeNumber: '5555550100',
    cellNumber: '5555550100',
    workNumber: '5555550100',
    conversations: [],
    dateOfBirth: new Date('1991-01-01T00:00:00.000Z'),
    occupation: 'Software Tester',
    sourceOfLead: 'Local Demo',
    preferredContactMethod: 'Text',
    notes: 'Safe local testing record',
    textPreferred: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`[local] Seeded demo customer: ${demoEmail}`);
}

await seedConnection.close();

const stop = async () => {
  await new Promise((resolve) => mockSmsServer.close(resolve));
  await mongoServer.stop({ doCleanup: false });
  process.exit(0);
};

process.once('SIGINT', stop);
process.once('SIGTERM', stop);

await import('../dist/index.js');
