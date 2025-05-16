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

// Sprawdzanie limitu miejsca
const checkStorageLimit = async (user, files) => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id }
  })

  if (!subscription || !subscription.isActive) {
    throw new Error('Subskrypcja nieaktywna')
  }

  // Oblicz rozmiar nowych plików w MB
  const newFilesSize = files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)

  // Sprawdź czy nie przekroczymy limitu
  if (subscription.usedStorageMB + newFilesSize > subscription.maxStorageMB) {
    throw new Error('Przekroczono limit miejsca')
  }

  return subscription
}

// Aktualizacja użytego miejsca
const updateUsedStorage = async (subscriptionId, newFilesSize) => {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      usedStorageMB: {
        increment: newFilesSize
      }
    }
  })
}

// Upload bez autoryzacji (np. przez QR)
router.post('/:uid', async (req, res) => {
  const uid = req.params.uid
  const user = await prisma.user.findUnique({ 
    where: { uid },
    include: { subscription: true }
  })
  if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' })

  const upload = multer({ storage: getStorage(uid) }).array('file')

  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message })

    try {
      const subscription = await checkStorageLimit(user, req.files)
      
      const authorName = req.body.author_name || 'Nieznany'
      const uploadEntries = req.files.map(file => ({
        filename: file.filename,
        authorName,
        userId: user.id,
        createdAt: new Date()
      }))

      await prisma.uploadInfo.createMany({ data: uploadEntries })

      // Oblicz i zaktualizuj użyte miejsce
      const newFilesSize = req.files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)
      await updateUsedStorage(subscription.id, newFilesSize)

      res.json({ message: 'Pliki przesłane', files: req.files.map(f => f.filename) })
    } catch (error) {
      // Usuń przesłane pliki w przypadku błędu
      for (const file of req.files) {
        await fs.unlink(file.path).catch(console.error)
      }
      res.status(400).json({ error: error.message })
    }
  })
})

// Upload z autoryzacją (np. z aplikacji)
router.post('/', auth, async (req, res) => {
  const uid = req.user.uid
  const user = await prisma.user.findUnique({ 
    where: { uid },
    include: { subscription: true }
  })
  if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' })

  const upload = multer({ storage: getStorage(uid) }).array('file')

  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message })

    try {
      const subscription = await checkStorageLimit(user, req.files)
      
      const authorName = req.body.author_name || 'Nieznany'
      const uploadEntries = req.files.map(file => ({
        filename: file.filename,
        authorName,
        userId: user.id,
        createdAt: new Date()
      }))

      await prisma.uploadInfo.createMany({ data: uploadEntries })

      // Oblicz i zaktualizuj użyte miejsce
      const newFilesSize = req.files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)
      await updateUsedStorage(subscription.id, newFilesSize)

      res.json({ message: 'Pliki przesłane', files: req.files.map(f => f.filename) })
    } catch (error) {
      // Usuń przesłane pliki w przypadku błędu
      for (const file of req.files) {
        await fs.unlink(file.path).catch(console.error)
      }
      res.status(400).json({ error: error.message })
    }
  })
})

module.exports = router