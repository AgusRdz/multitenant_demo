const { getConnection } = require('../services/connection-service')

const getAll = async () => {
  const conn = await getConnection()

  if (!conn) {
    return null
  }

  return await conn.select('*').from('users')
}

module.exports = { getAll }
