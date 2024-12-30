require('dotenv').config();
const express = require('express');

const { connectRedis } = require('./config/redis');
const app = express();

// Conectar a Redis
connectRedis();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
