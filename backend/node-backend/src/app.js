const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', env: env.NODE_ENV });
});

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
