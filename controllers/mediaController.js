const path = require('path')
const fs = require('fs').promises
const { prisma } = require('../prismaClient') // dostosuj ścieżkę do klienta Prisma

exports.getUserMedia = async (req, res) => {
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

    // Pobieramy uploady z bazy dla danego użytkownika i filtrujemy po nazwach plików z folderu
    const user = await prisma.user.findUnique({
      where: { uid },
      include: {
        uploads: true, // pobieramy wszystkie uploady powiązane z użytkownikiem
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Nie znaleziono użytkownika' })
    }

    // Filtrujemy uploady, które faktycznie istnieją w katalogu (aby uniknąć zwracania uploadów, których pliki nie ma)
    const mediaFiles = user.uploads.filter(upload =>
      files.includes(upload.filename) &&
      /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(upload.filename)
    )

    // Mapujemy do obiektu z url, authorName i createdAt
    const fileUrls = mediaFiles.map(upload => ({
      filename: upload.filename,
      url: `/uploads/${uid}/${upload.filename}`,
      authorName: upload.authorName,
      createdAt: upload.createdAt
    }))

    res.json(fileUrls)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Błąd serwera' })
  }
}
