const path = require('path')
const fs = require('fs').promises
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.getSubscriptionDetails = async (req, res) => {
    try {
      const uid = req.user.uid
  
      // Pobieramy użytkownika i subskrypcję
      const user = await prisma.user.findUnique({
        where: { uid },
        include: {
          subscription: true
        }
      })
  
      if (!user || !user.subscription) {
        return res.status(404).json({ error: 'Nie znaleziono subskrypcji' })
      }
  
      const { subscription } = user
  
      // Obliczamy rozmiar folderu
      const userDir = path.join(__dirname, '..', 'uploads', uid)
      let totalSize = 0
      try {
        const files = await fs.readdir(userDir)
        for (const file of files) {
          if (/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(file)) {
            const stats = await fs.stat(path.join(userDir, file))
            totalSize += stats.size
          }
        }
      } catch (err) {
        // Jeśli folder nie istnieje – przyjmij 0 MB
        totalSize = 0
      }
  
      const usedStorageMB = parseFloat((totalSize / (1024 * 1024)).toFixed(2))
  
      // Możesz też opcjonalnie zaktualizować w bazie (jeśli chcesz)
      // await prisma.subscription.update({
      //   where: { id: subscription.id },
      //   data: { usedStorageMB }
      // })
  
      res.json({
        planName: subscription.planName,
        isActive: subscription.isActive,
        isPaid: subscription.isPaid,
        maxStorageMB: subscription.maxStorageMB,
        expiryDate: subscription.expiryDate,
        usedStorageMB
      })
  
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Błąd serwera' })
    }
  }