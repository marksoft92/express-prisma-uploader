const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const fs = require('fs-extra')
const path = require('path')
const QRCode = require('qrcode')
const { nanoid } = require('nanoid')

const prisma = new PrismaClient()

// Funkcja pomocnicza do generowania unikalnego UID
async function generateUniqueUid() {
  let uid
  let isUnique = false
  
  while (!isUnique) {
    uid = nanoid(10) // generuj 10-znakowy UID
    const existingUser = await prisma.user.findUnique({ where: { uid } })
    if (!existingUser) {
      isUnique = true
    }
  }
  
  return uid
}

exports.register = async (req, res) => {
  const { email, password } = req.body

  try {
    // Generuj unikalny uid
    const uid = await generateUniqueUid()
    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
         email,
          password: 
          hashed,
           uid ,
           subscription: {
            create: {} // puste, a Prisma wstawi defaulty z modelu
          }
          }
    })

    // utwórz katalog użytkownika
    const userDir = path.join(__dirname, '..', 'uploads', uid)
    await fs.ensureDir(userDir)

    // generuj QR z linkiem do uploadu
    const uploadUrl = `${process.env.BASE_URL}/upload/${uid}`
    const qrPath = path.join(__dirname, '..', 'qr-codes', `${uid}.png`)
    await QRCode.toFile(qrPath, uploadUrl)

    res.json({ 
      message: 'Zarejestrowano', 
      uid, 
      qrCode: `/qr-codes/${uid}.png`,
      uploadUrl 
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

exports.login = async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Nieprawidłowe dane logowania' })
  }

  const token = jwt.sign({ userId: user.id, uid: user.uid }, process.env.JWT_SECRET, {
    expiresIn: '1d'
  })

  res.json({ token })
}
