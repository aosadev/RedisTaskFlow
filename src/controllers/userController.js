/**
 * Controlador de Usuarios
 * =======================
 * Este archivo maneja la lógica para registrar y obtener usuarios en Redis.
 * Almacena cada usuario como un hash: user:{id}, y un índice userByEmail:{email} -> id.
 */

const bcrypt = require('bcrypt');
const { client } = require('../config/redis');

/**
 * Registra un nuevo usuario
 * @param {object} req - Solicitud Express con campos name, email, password
 * @param {object} res - Respuesta Express con datos del usuario creado
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    // Revisar si el email ya está en uso
    const existingUserId = await client.get(`userByEmail:${email}`);
    if (existingUserId) {
      return res.status(400).json({ message: 'El email ya está en uso' });
    }

    // Generar un nuevo ID con INCR
    const newUserId = await client.incr('userIdCounter');

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Guardar en Redis
    await client.hSet(`user:${newUserId}`, {
      id: newUserId.toString(),
      name,
      email,
      password: hashedPassword
    });

    // Indexar email->id
    await client.set(`userByEmail:${email}`, newUserId.toString());

    return res.status(201).json({
      id: newUserId,
      name,
      email
      // password se omite por seguridad
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar usuario', error });
  }
};

/**
 * Obtiene un usuario por ID
 * @param {object} req - Solicitud Express con param id
 * @param {object} res - Respuesta Express con datos del usuario
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await client.hGetAll(`user:${id}`);
    if (!userData || !userData.id) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Excluir la contraseña
    const { password, ...userWithoutPass } = userData;
    return res.json(userWithoutPass);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario', error });
  }
};

module.exports = {
  registerUser,
  getUserById
};
