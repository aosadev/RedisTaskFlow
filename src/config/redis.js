// src/config/redis.js
require('dotenv').config();

let client;

if (process.env.NODE_ENV === 'test') {
  // Usar el mock
  const mockRedis = require('../../tests/config/redis.mock');
  client = mockRedis.createClient();
} else {
  // Usar Redis real
  const { createClient } = require('redis');
  client = createClient({ url: process.env.REDIS_URL });
}

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

const connectRedis = async () => {
  try {
    await client.connect();
    console.log('Conectado a Redis');
  } catch (error) {
    console.error('Error al conectar a Redis:', error);
    process.exit(1);
  }
};

module.exports = {
  client,
  connectRedis
};
