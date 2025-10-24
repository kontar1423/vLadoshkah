// knexfile.js
import { config } from 'dotenv';
config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export default {
  development: {
    client: 'pg',
    connection: {
      host: process.env.PGHOST || 'db',
      port: process.env.PGPORT || 5432,
      database: process.env.PGDATABASE || 'volunteer_db',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '1234'
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
      extension: 'cjs'
    },
    seeds: {
      directory: './seeds',
      extension: 'cjs'
    },
    pool: {
      min: 2,
      max: 10
    }
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
      extension: 'cjs'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};