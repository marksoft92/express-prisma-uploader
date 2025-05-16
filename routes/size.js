const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const mediaController = require('../controllers/mediaSizeController')

router.get('/', auth, mediaController.getSizeMedia)

module.exports = router
