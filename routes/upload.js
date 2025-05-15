const express = require('express')
const multer = require('multer')
const fs = require('fs-extra')
const path = require('path')
const auth = require('../middlewares/auth')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = express.Router()

// Wspólna logika storage
const getStorage = (uid) => multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', uid)
    await fs.ensureDir(dir)
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

// Upload bez autoryzacji (np. przez QR)
router.post('/:uid', async (req, res) => {
  const uid = req.params.uid
  const user = await prisma.user.findUnique({ where: { uid } })
  if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' })

  const upload = multer({ storage: getStorage(uid) }).array('files')

  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message })

    const authorName = req.body.author_name || 'Nieznany'
    const uploadEntries = req.files.map(file => ({
      filename: file.filename,
      authorName,
      userId: user.id,
      createdAt: new Date()
    }))

    await prisma.uploadInfo.createMany({ data: uploadEntries })

    res.json({ message: 'Pliki przesłane', files: req.files.map(f => f.filename) })
  })
})

// Upload z autoryzacją (np. z aplikacji)
router.post('/', auth, async (req, res) => {
  const uid = req.user.uid
  const user = await prisma.user.findUnique({ where: { uid } })
  if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' })

  const upload = multer({ storage: getStorage(uid) }).array('files')

  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message })

    const authorName = req.body.author_name || 'Nieznany'
    const uploadEntries = req.files.map(file => ({
      filename: file.filename,
      authorName,
      userId: user.id,
      createdAt: new Date()
    }))

    await prisma.uploadInfo.createMany({ data: uploadEntries })

    res.json({ message: 'Pliki przesłane', files: req.files.map(f => f.filename) })
  })
})


module.exports = router