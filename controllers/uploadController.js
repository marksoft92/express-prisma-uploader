const path = require('path')
const fs = require('fs-extra')

exports.uploadFile = async (req, res) => {
  res.json({ message: 'Plik przesłany', filename: req.file.filename })
}
