const { db } = require('../config/database')
const { v4: uuidv4 } = require('uuid')
const generator = require('generate-password')
const slugify = require('slugify')
const { down, up } = require('../services/tenant-service')

const index = async (req, res) => {
  const tenants = await db
    .select('uuid', 'db_name', 'db_username', 'db_password')
    .from('tenants')
  return res.formatter.ok({ tenants })
}

const store = async (req, res) => {
  const {
    body: { organization }
  } = req

  const tenantName = slugify(organization.toLowerCase(), '_')
  const password = generator.generate({ length: 12, numbers: true })
  const uuid = uuidv4()
  const tenant = {
    uuid,
    db_name: tenantName,
    db_username: tenantName,
    db_password: password
  }
  await db('tenants').insert(tenant)
  await up({ tenantName, password, uuid })

  return res.formatter.ok({ tenant: { ...tenant } })
}

const destroy = async (req, res) => {
  const {
    params: { uuid }
  } = req

  const tenant = await db
    .select('db_name', 'db_username', 'uuid')
    .where('uuid', uuid)
    .from('tenants')

  await down({
    userName: tenant[0].db_username,
    tenantName: tenant[0].db_name,
    uuid: tenant[0].uuid
  })
  await db('tenants').where('uuid', uuid).del()

  return res.formatter.ok({ message: 'tenant was deleted successfully' })
}

module.exports = { index, store, destroy }
