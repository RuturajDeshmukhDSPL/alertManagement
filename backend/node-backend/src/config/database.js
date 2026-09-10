const { Sequelize } = require('sequelize');
const env = require('./env');

/**
 * Single shared Sequelize instance, connected to the `alertManagement`
 * MySQL database created by the provided SQL script. Models attach to
 * this instance in `src/models/*`.
 *
 * `underscored: true` + `freezeTableName: true` make Sequelize match the
 * exact snake_case table/column names from the schema (e.g. `facility_id`,
 * `is_latest`) without needing to rename anything on the JS side.
 */
const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: false,
  define: {
    underscored: true,
    freezeTableName: true,
  },
});

module.exports = sequelize;
