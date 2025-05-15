const fs = require('fs/promises')
const path = require('path')

exports.getUserMedia = async (req, res) => {
  try {
    const uid = req.user.uid
    const userDir = path.join(__dirname, '..', 'uploads', uid)

    try {
      await fs.access(userDir)
    } catch {
      return res.status(404).json({ error: 'Brak przesłanych plików' })
    }

    const files = await fs.readdir(userDir)

    const mediaFiles = files.filter(file =>
      /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(file)
    )

    const fileUrls = mediaFiles.map(file => ({
      filename: file,
    //   url: `/uploads/${uid}/${file}`
    url: path.join(__dirname, '..', `uploads/${uid}`, `${file}`)

    }))

    res.json(fileUrls)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Błąd serwera' })
  }
}
