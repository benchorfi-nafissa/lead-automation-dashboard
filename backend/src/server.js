require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');

const leadsRoutes = require('./routes/leads.routes');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/leads', leadsRoutes);

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time');

    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].current_time,
    });
  } catch (error) {
    console.error('Database health check failed:', error.message);

    res.status(503).json({
      status: 'error',
      database: 'unavailable',
    });
  }
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});