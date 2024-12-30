/**
 * Rutas de Etiquetas (Tags)
 * =========================
 * Expone los endpoints para crear, listar, obtener por ID, actualizar y eliminar
 * etiquetas en Redis.
 *
 * Ruta base: /api/tags
 *
 * Métodos:
 * - POST   /api/tags        -> createTag
 * - GET    /api/tags        -> getAllTags
 * - GET    /api/tags/:id    -> getTagById
 * - PUT    /api/tags/:id    -> updateTag
 * - DELETE /api/tags/:id    -> deleteTag
 */

const express = require('express');
const router = express.Router();

// Importamos las funciones del controlador
const {
  createTag,
  getAllTags,
  getTagById,
  updateTag,
  deleteTag
} = require('../controllers/tagController');

/** Crear una nueva etiqueta */
router.post('/', createTag);

/** Listar todas las etiquetas */
router.get('/', getAllTags);

/** Obtener una etiqueta por ID */
router.get('/:id', getTagById);

/** Actualizar una etiqueta por ID */
router.put('/:id', updateTag);

/** Eliminar una etiqueta por ID */
router.delete('/:id', deleteTag);

module.exports = router;
