const app = require('./src/app');
const env = require('./src/config/env');
const { sequelize } = require('./src/models');

async function start() {
  try {
    await sequelize.authenticate();

    app.listen(env.PORT, () => {console.log(`✔ Server listening on port ${env.PORT}......`); });
  } catch (err) {
    console.error('✖ Unable to start server:', err.message);
    process.exit(1);
  }
}

start();
