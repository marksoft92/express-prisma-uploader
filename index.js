require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('/var/www/imprezowa-fota.pl/uploads'))

app.use('/qr-codes', express.static('qr-codes'))

app.use('/api/auth', require('./routes/auth'))
app.use('/api/upload', require('./routes/upload'))
app.use('/api/media',require('./routes/media'))
app.use('/api/subscription',require('./routes/subscription'))

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
