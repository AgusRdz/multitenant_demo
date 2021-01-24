const knex = require('knex')

const config = {
  client: process.env.DB_CLIENT,
  connection: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD
  },
  pool: { min: 2, max: 10 }
}

const db = knex(config)

module.exports = { db, config }
