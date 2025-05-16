const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const mediaController = require('../controllers/subscriptionController')

router.get('/', auth, mediaController.getSubscriptionDetails)

module.exports = router
