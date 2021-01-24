const Joi = require('joi')
const { createNamespace } = require('continuation-local-storage')
const { getTenantConnection } = require('../services/connection-service')

const namespace = createNamespace('tenants')

const connectionRequest = (req, res, next) => {
  const schema = Joi.object({
    tenantId: Joi.string().guid({ version: 'uuidv4' }).required()
  })
  const { error } = schema.validate(req.query)

  if (error) {
    return res.formatter.unprocess(error.message)
  }

  namespace.run(() => {
    namespace.set('connection', getTenantConnection(req.query.tenantId))
    next()
  })
}

module.exports = { connectionRequest }
