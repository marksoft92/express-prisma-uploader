const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const mediaController = require('../controllers/mediaController')

router.get('/', auth, mediaController.getUserMedia)

module.exports = router
