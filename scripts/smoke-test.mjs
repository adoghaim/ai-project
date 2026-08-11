import axios from 'axios';

const appUrl = process.env.APP_URL || 'http://127.0.0.1:3434';
const mockSmsUrl = process.env.MOCK_SMS_URL || 'http://127.0.0.1:3435';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const check = async (name, operation) => {
  await operation();
  console.log(`PASS ${name}`);
};

await check('Admin page responds', async () => {
  const response = await axios.get(`${appUrl}/admin`);
  assert(response.status === 200, `Expected 200, received ${response.status}`);
});

let demoCustomer;

await check('Customer filter reaches MongoDB', async () => {
  const response = await axios.get(`${appUrl}/api/customers?name=Demo`);
  demoCustomer = response.data.items.find(
    (customer) => customer.email === 'demo.customer@example.com',
  );
  assert(demoCustomer, 'The local demo customer was not found');
});

for (const [name, endpoint] of [
  ['Appointments API', '/api/appointments?offset=0&limit=5'],
  ['Desk logs API', '/api/desklogs?offset=0&limit=5'],
  ['Chats API', '/api/chats'],
]) {
  await check(`${name} responds`, async () => {
    const response = await axios.get(`${appUrl}${endpoint}`);
    assert(response.status === 200, `Expected 200, received ${response.status}`);
  });
}

let mockMessageCount;

await check('Mock SMS safety boundary is active', async () => {
  const response = await axios.get(`${mockSmsUrl}/messages`);
  mockMessageCount = response.data.items.length;
});

await check('Campaign completes through the mock SMS endpoint', async () => {
  const context = `Automated local smoke test ${new Date().toISOString()}`;
  const launchResponse = await axios.post(`${appUrl}/api/customers/launch`, {
    customerIds: [demoCustomer._id],
    context,
  });

  assert(launchResponse.data.totalSuccess === 1, 'Expected one successful mock send');
  assert(launchResponse.data.totalFailed === 0, 'Expected zero failed mock sends');

  const mockResponse = await axios.get(`${mockSmsUrl}/messages`);
  assert(
    mockResponse.data.items.length === mockMessageCount + 1,
    'The mock SMS inbox did not receive the campaign',
  );
  assert(
    mockResponse.data.items.at(-1).context === context,
    'The received mock message did not match the campaign',
  );
});

console.log('Smoke test passed: UI server -> API -> MongoDB -> mock SMS.');
