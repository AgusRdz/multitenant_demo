const { getAll } = require('../repositories/user')

const index = async (req, res) => {
  const users = await getAll()
  return res.formatter.ok({ users })
}

module.exports = { index }
