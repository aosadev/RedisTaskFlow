require('dotenv').config();
const { createClient } = require('redis');

let client = createClient({
  url: process.env.REDIS_URL
});

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
