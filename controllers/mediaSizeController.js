const path = require('path')
const fs = require('fs').promises
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.getSizeMedia = async (req, res) => {
  try {
    const uid = req.user.uid
    const userDir = path.join(__dirname, '..', 'uploads', uid)

    // Sprawdzamy czy folder istnieje
    try {
      await fs.access(userDir)
    } catch {
      return res.status(404).json({ error: 'Brak przesłanych plików' })
    }

    // Pobieramy pliki z folderu
    const files = await fs.readdir(userDir)

    // Obliczamy łączny rozmiar plików
    let totalSize = 0
    for (const file of files) {
      // Sprawdzamy czy plik jest zdjęciem lub video
      if (/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(file)) {
        const filePath = path.join(userDir, file)
        const stats = await fs.stat(filePath)
        totalSize += stats.size
      }
    }

    // Konwertujemy rozmiar na MB
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2)

    res.json({
      totalSize: totalSize,
      totalSizeMB: parseFloat(sizeInMB),
      filesCount: files.length
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Błąd serwera' })
  }
}
