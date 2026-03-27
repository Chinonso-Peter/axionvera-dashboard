const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simulated latency middleware
app.use((req, res, next) => {
  const delay = Math.floor(Math.random() * 1000) + 500; // 0.5s - 1.5s
  setTimeout(next, delay);
});

// Mock API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/user', (req, res) => {
  res.json({
    id: '1',
    name: 'Test User',
    email: 'test@axionvera.com',
    walletAddress: 'GB7TAYRUZGE6TVT7NHP5SMIZRNQA6PLM423EYISAOAP3MKYIQMVYP2JO'
  });
});

app.get('/api/balance', (req, res) => {
  res.json({
    native: '1000.0000000',
    assets: [
      {
        asset_code: 'AXV',
        asset_issuer: 'GD5QJOWHXK3FGX5VXGFYQKTHRXQSYIEFZ4RD5MYDQHRJ5QGZRXOESKP',
        balance: '500.0000000'
      }
    ]
  });
});

app.post('/api/transaction', (req, res) => {
  const { amount, destination, asset } = req.body;
  
  // Mock transaction response
  res.json({
    id: 'mock_tx_' + Date.now(),
    status: 'success',
    hash: 'mock_hash_' + Math.random().toString(36).substring(7),
    amount,
    destination,
    asset,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/transactions', (req, res) => {
  res.json({
    transactions: [
      {
        id: 'tx_1',
        hash: 'hash_1',
        type: 'payment',
        amount: '100.0000000',
        asset: 'XLM',
        from: 'GB7TAYRUZGE6TVT7NHP5SMIZRNQA6PLM423EYISAOAP3MKYIQMVYP2JO',
        to: 'GD5QJOWHXK3FGX5VXGFYQKTHRXQSYIEFZ4RD5MYDQHRJ5QGZRXOESKP',
        timestamp: '2024-01-15T10:30:00Z'
      },
      {
        id: 'tx_2',
        hash: 'hash_2',
        type: 'payment',
        amount: '50.0000000',
        asset: 'AXV',
        from: 'GD5QJOWHXK3FGX5VXGFYQKTHRXQSYIEFZ4RD5MYDQHRJ5QGZRXOESKP',
        to: 'GB7TAYRUZGE6TVT7NHP5SMIZRNQA6PLM423EYISAOAP3MKYIQMVYP2JO',
        timestamp: '2024-01-14T15:45:00Z'
      }
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Mock backend server running on port ${PORT}`);
});
