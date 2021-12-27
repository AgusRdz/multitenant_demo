const Queue = require('bull')
const { db } = require('../config/database')
const migrate = require('../migrations')
const seed = require('../seeders')
const { bootstrap, getTenantConnection } = require('./connection-service')

const up = async (params) => {
  const job = new Queue(
    `setting-up-database-${new Date().getTime()}`,
    `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
  )
  job.add({
    ...params
  })
  job.process(async (job, done) => {
    try {
      await db.raw(
        `CREATE USER '${params.tenantName}'@'${process.env.DB_HOST}' IDENTIFIED BY '${params.password}';`
      )
      await db.raw(`CREATE DATABASE ${params.tenantName};`)
      await db.raw(
        `GRANT ALL PRIVILEGES ON ${params.tenantName}.* TO '${params.tenantName}'@'${process.env.DB_HOST}';`
      )
      await db.raw('FLUSH PRIVILEGES;')
      await bootstrap()
      const tenant = getTenantConnection(params.uuid)
      await migrate(tenant)
      await seed(tenant)
      done()
    } catch (e) {
      console.error(e)
    }
  })
}

const down = async (params) => {
  const job = new Queue(
    `deleting-database-${new Date().getTime()}`,
    `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
  )

  job.add({
    ...params
  })
  job.process(async (job, done) => {
    try {
      await db.raw(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
        WHERE pid <> pg_backend_pid()
        AND datname = '${params.tenantName}';`
      )
      await db.raw(`DROP DATABASE IF EXISTS ${params.tenantName};`)
      await db.raw(`DROP ROLE IF EXISTS ${params.tenantName};`)
      await bootstrap()
      done()
    } catch (e) {
      console.error(e)
    }
  })
}

module.exports = { up, down }
