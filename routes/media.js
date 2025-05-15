const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const mediaController = require('../controllers/mediaController')

router.get('/media', auth, mediaController.getUserMedia)

module.exports = router
