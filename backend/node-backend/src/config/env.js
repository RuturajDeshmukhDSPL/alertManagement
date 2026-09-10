require('dotenv').config();

/**
 * Central place for all environment variables, with sane local defaults.
 * Every other file reads config through this module — nothing reaches
 * into `process.env` directly.
 */
module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 4000,

  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: Number(process.env.DB_PORT) || 3306,
  DB_NAME: process.env.DB_NAME || 'alertManagement',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:4200',
};
