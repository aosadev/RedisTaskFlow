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
  getPriorityById,
  updatePriority,
  deletePriority
} = require('../controllers/priorityController');

// POST /api/priorities
router.post('/', createPriority);

// GET /api/priorities
router.get('/', getAllPriorities);

// GET /api/priorities/:id
router.get('/:id', getPriorityById);

// PUT /api/priorities/:id
router.put('/:id', updatePriority);

// DELETE /api/priorities/:id
router.delete('/:id', deletePriority);

module.exports = router;
