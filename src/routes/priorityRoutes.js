/**
 * Rutas de Prioridades
 * ====================
 * Expone los endpoints para crear, listar, actualizar y eliminar prioridades.
 * Se asume que estas rutas se montarán en `index.js` mediante:
 *   app.use('/api/priorities', priorityRoutes);
 */

const express = require('express');
const router = express.Router();
const {
  createPriority,
  getAllPriorities,
  updatePriority,
  deletePriority
} = require('../controllers/priorityController');

// Crear una prioridad nueva
router.post('/', createPriority);

// Obtener todas las prioridades
router.get('/', getAllPriorities);

// Actualizar una prioridad por ID
router.put('/:id', updatePriority);

// Eliminar una prioridad por ID
router.delete('/:id', deletePriority);

module.exports = router;
