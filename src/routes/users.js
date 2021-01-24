const express = require('express')
const router = express.Router()
const { index } = require('../controllers/user')
const { connectionRequest } = require('../middlewares/connection')

router.route('/users').get(connectionRequest, index)

module.exports = router
