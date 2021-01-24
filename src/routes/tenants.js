const express = require('express')
const router = express.Router()
const { index, store, destroy } = require('../controllers/tenant')
const { storeRequest } = require('../middlewares/tenant')

router.route('/tenants').get(index).post(storeRequest, store)
router.route('/tenants/:uuid').delete(destroy)

module.exports = router
