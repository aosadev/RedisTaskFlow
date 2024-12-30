/**
 * Rutas de Tareas (Tasks)
 * =======================
 * Expone los endpoints para el CRUD de tareas. Usan el controller anterior.
 *
 * Ruta base: /api/tasks
 *
 * Métodos:
 * - POST   /api/tasks        -> createTask
 * - GET    /api/tasks        -> getAllTasks
 * - GET    /api/tasks/:id    -> getTaskById
 * - PUT    /api/tasks/:id    -> updateTask
 * - DELETE /api/tasks/:id    -> deleteTask
 */

const express = require('express');
const router = express.Router();
const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

/** Crear una nueva tarea */
router.post('/', createTask);

/** Listar todas las tareas */
router.get('/', getAllTasks);

/** Obtener una tarea por ID */
router.get('/:id', getTaskById);

/** Actualizar tarea por ID */
router.put('/:id', updateTask);

/** Eliminar tarea por ID */
router.delete('/:id', deleteTask);

module.exports = router;
