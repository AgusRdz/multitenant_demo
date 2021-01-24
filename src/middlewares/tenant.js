const Joi = require('joi')

const storeRequest = (req, res, next) => {
  const schema = Joi.object({
    organization: Joi.string().required()
  })
  const { error } = schema.validate(req.body)

  if (error) {
    return res.formatter.unprocess(error.message)
  }

  req.body.organization = req.sanitize(req.body.organization)
  next()
}

module.exports = { storeRequest }
