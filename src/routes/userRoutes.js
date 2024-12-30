const express = require('express');
const router = express.Router();
const {
  registerUser,
  getUserById
} = require('../controllers/userController');

/**
 * Rutas de Usuarios
 * =================
 * - POST /register : registrar usuario nuevo
 * - GET /:id       : obtener usuario por ID
 */

// Registrar usuario
router.post('/register', registerUser);

// Obtener usuario por ID
router.get('/:id', getUserById);

module.exports = router;
