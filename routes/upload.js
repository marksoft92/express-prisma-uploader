const express = require('express')
const multer = require('multer')
const fs = require('fs-extra')
const path = require('path')
const auth = require('../middlewares/auth')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = express.Router()

// Upload przez kod QR (bez autoryzacji)
router.post('/:uid', async (req, res, next) => {
  const uid = req.params.uid

  // Sprawdź czy użytkownik istnieje
  const user = await prisma.user.findUnique({ where: { uid } })
  if (!user) {
    return res.status(404).json({ error: 'Użytkownik nie znaleziony' })
  }

  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads', uid)
      await fs.ensureDir(dir)
      cb(null, dir)
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname)
    }
  })

  const upload = multer({ storage }).single('file')

  upload(req, res, (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Plik przesłany', filename: req.file.filename })
  })
})

// Upload przez aplikację (z autoryzacją)
router.post('/', auth, async (req, res, next) => {
  const uid = req.user.uid // uid z tokenu JWT

  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads', uid)
      await fs.ensureDir(dir)
      cb(null, dir)
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname)
    }
  })

  const upload = multer({ storage }).single('file')

  upload(req, res, (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Plik przesłany', filename: req.file.filename })
  })
})

module.exports = router