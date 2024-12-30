/**
 * Controlador de Tareas (Task)
 * ============================
 * Maneja la lógica para crear, listar, obtener por ID, actualizar y eliminar
 * registros de tipo "Task" en Redis. Cada tarea se almacena como un Hash:
 *   task:{id} => { id, title, description, status, ... }
 *
 * Además, se utiliza un contador (taskIdCounter) para autogenerar IDs,
 * y un Set (taskIdsSet) para poder listar todas las tareas fácilmente.
 */

const { client } = require('../config/redis');

// Nombre del set donde guardamos las claves de cada tarea
const TASK_SET = 'taskIdsSet';

/**
 * Crea una nueva tarea en Redis
 * @param {Object} req - Express request, con body { title, description, status, ... }
 * @param {Object} res - Express response
 */
const createTask = async (req, res) => {
  try {
    const { title, description = '', status = 'pendiente' } = req.body;

    // Validación básica
    if (!title) {
      return res.status(400).json({ message: 'El título de la tarea es obligatorio' });
    }

    // Generar un nuevo ID para la tarea
    const newTaskId = await client.incr('taskIdCounter');

    // Guardar la tarea como un Hash
    await client.hSet(`task:${newTaskId}`, {
      id: newTaskId.toString(),
      title,
      description,
      status
    });

    // Agregar la clave al Set
    await client.sAdd(TASK_SET, `task:${newTaskId}`);

    return res.status(201).json({
      id: newTaskId,
      title,
      description,
      status
    });
  } catch (error) {
    console.error('[createTask] Error:', error);
    return res.status(500).json({ message: 'Error al crear tarea', error });
  }
};

/**
 * Lista todas las tareas almacenadas en Redis
 * @param {Object} req
 * @param {Object} res
 */
const getAllTasks = async (req, res) => {
  try {
    const keys = await client.sMembers(TASK_SET);
    const tasks = [];

    for (const key of keys) {
      const data = await client.hGetAll(key);
      if (data && data.id) {
        tasks.push({
          id: data.id,
          title: data.title,
          description: data.description,
          status: data.status
        });
      }
    }

    // (Opcional) Podrías ordenar las tareas
    // tasks.sort((a, b) => a.id - b.id);

    return res.json(tasks);
  } catch (error) {
    console.error('[getAllTasks] Error:', error);
    return res.status(500).json({ message: 'Error al obtener tareas', error });
  }
};

/**
 * Obtiene una tarea por su ID
 * @param {Object} req - Express request con { id } en req.params
 * @param {Object} res - Express response
 */
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const key = `task:${id}`;

    const data = await client.hGetAll(key);
    if (!data || !data.id) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    return res.json({
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status
    });
  } catch (error) {
    console.error('[getTaskById] Error:', error);
    return res.status(500).json({ message: 'Error al obtener la tarea', error });
  }
};

/**
 * Actualiza una tarea por ID
 * @param {Object} req - Express request con param { id } y body { title, description, status }
 * @param {Object} res - Express response
 */
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const key = `task:${id}`;
    const existing = await client.hGetAll(key);
    if (!existing || !existing.id) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Actualizamos sólo los campos provistos
    if (title !== undefined) await client.hSet(key, 'title', title);
    if (description !== undefined) await client.hSet(key, 'description', description);
    if (status !== undefined) await client.hSet(key, 'status', status);

    // Obtenemos la data final
    const updated = await client.hGetAll(key);
    return res.json({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      status: updated.status
    });
  } catch (error) {
    console.error('[updateTask] Error:', error);
    return res.status(500).json({ message: 'Error al actualizar la tarea', error });
  }
};

/**
 * Elimina una tarea por ID
 * @param {Object} req - Express request con param { id }
 * @param {Object} res - Express response
 */
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const key = `task:${id}`;

    const data = await client.hGetAll(key);
    if (!data || !data.id) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Borramos el hash y la sacamos del Set
    await client.del(key);
    await client.sRem(TASK_SET, key);

    return res.json({ message: 'Tarea eliminada correctamente' });
  } catch (error) {
    console.error('[deleteTask] Error:', error);
    return res.status(500).json({ message: 'Error al eliminar la tarea', error });
  }
};

/** Exportamos los métodos para usarlos en las rutas. */
module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask
};
