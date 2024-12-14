const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const http = require('http');
const { Pool } = require('pg');
const contractRoutes = require('./routes/contractRoutes');

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const pool = require('./config/database');
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err.stack);
    } else {
        console.log('Database connected:', res.rows[0]);
    }
});


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); 
// Routes
app.use('/contracts', contractRoutes);
const contractController = require('./controllers/contractController');

const router = express.Router();
router.post('/', contractController.createContract);
// Test endpoint
app.get('/test', (req, res) => {
  res.send('Server is working!');
});
app.get('/', (req, res) => {
  res.send('Welcome to the Contract Management System!');
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
app.get('/contracts', async (req, res) => {
  try {
    console.log('Connecting to database...');
    const result = await pool.query('SELECT * FROM contracts');
    console.log('Query successful:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching contracts:', err);
    res.status(500).send('Internal Server Error');
  }
});

// REST API to update contract and trigger WebSocket
app.put('/contracts/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Update contract in database
    const result = await pool.query(
      'UPDATE contracts SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Contract not found');
    }

    const updatedContract = result.rows[0];

    // Emit real-time update
    io.emit('contractUpdated', updatedContract);

    res.json(updatedContract);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Start server
const PORT = 5003;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
