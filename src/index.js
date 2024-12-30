require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectRedis } = require('./config/redis');
const app = express();

//Importar rutas
const userRoutes = require('./routes/userRoutes'); 
const priorityRoutes = require('./routes/priorityRoutes');
const tagRoutes = require('./routes/tagRoutes');



// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/priorities', priorityRoutes);
app.use('/api/tags', tagRoutes);

// Conectar a Redis
connectRedis();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
