/**
 * Controlador de Prioridades
 * ==========================
 * Maneja la lógica para crear, listar, actualizar y eliminar registros
 * de tipo "Prioridad" en Redis. Cada prioridad se almacena como un Hash:
 *   priority:{id} => { id, name, color, order }
 *
 * Además, se utiliza un contador (priorityIdCounter) para autogenerar IDs,
 * y un Set (priorityIdsSet) para poder listar todas las prioridades sin usar SCAN.
 */

const { client } = require('../config/redis');

// Nombre del set para almacenar las claves de cada prioridad
const PRIORITY_SET = 'priorityIdsSet';

/**
 * Crea una nueva prioridad en Redis
 * @param {Object} req - Solicitud Express con campos { name, color, order }
 * @param {Object} res - Respuesta Express con la prioridad creada
 */
const createPriority = async (req, res) => {
  try {
    const { name, color = '#000000', order = 1 } = req.body;

    // Validación básica
    if (!name) {
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    }

    // Generar un nuevo ID incremental
    const newPriorityId = await client.incr('priorityIdCounter');

    // Almacenar la prioridad como un Hash en Redis
    await client.hSet(`priority:${newPriorityId}`, {
      id: newPriorityId.toString(),
      name,
      color,
      order: order.toString()
    });

    // Añadimos la clave al set para poder listar luego
    await client.sAdd(PRIORITY_SET, `priority:${newPriorityId}`);

    // Responder con la prioridad creada
    res.status(201).json({
      id: newPriorityId,
      name,
      color,
      order
    });
  } catch (error) {
    console.error('[createPriority] Error:', error);
    res.status(500).json({ message: 'Error al crear prioridad', error });
  }
};

/**
 * Obtiene todas las prioridades almacenadas en Redis
 * @param {Object} req - Solicitud Express
 * @param {Object} res - Respuesta Express con arreglo de prioridades
 */
const getAllPriorities = async (req, res) => {
  try {
    // 1) Obtener las claves del set (p.ej. ["priority:1", "priority:2", ...])
    const keys = await client.sMembers(PRIORITY_SET); // Retorna array de strings
    const priorities = [];

    // 2) Para cada clave, obtenemos el Hash de Redis
    for (const key of keys) {
      const data = await client.hGetAll(key);
      // data es un objeto { id, name, color, order: '...' }
      if (data && data.id) {
        priorities.push({
          id: data.id,
          name: data.name,
          color: data.color,
          order: parseInt(data.order, 10) // Convertimos a número
        });
      }
    }

    // 3) Ordenar las prioridades por 'order' ascendente (opcional)
    priorities.sort((a, b) => a.order - b.order);

    // 4) Responder
    res.json(priorities);
  } catch (error) {
    console.error('[getAllPriorities] Error:', error);
    res.status(500).json({ message: 'Error al obtener prioridades', error });
  }
};

/**
 * Obtiene una prioridad por ID
 * @param {Object} req - Solicitud Express con param { id }
 * @param {Object} res - Respuesta Express con la prioridad o 404 si no existe
 */
const getPriorityById = async (req, res) => {
  try {
    const { id } = req.params;
    const key = `priority:${id}`;

    // Obtener el Hash de Redis
    const data = await client.hGetAll(key);

    // Si no hay 'data.id', significa que no existe
    if (!data || !data.id) {
      return res.status(404).json({ message: 'Prioridad no encontrada' });
    }

    // Convertir 'order' a número
    const priority = {
      id: data.id,
      name: data.name,
      color: data.color,
      order: parseInt(data.order, 10)
    };

    res.json(priority);
  } catch (error) {
    console.error('[getPriorityById] Error:', error);
    res.status(500).json({ message: 'Error al obtener prioridad', error });
  }
};

/**
 * Actualiza una prioridad en Redis
 * @param {Object} req - Solicitud Express con param { id }, body { name, color, order }
 * @param {Object} res - Respuesta Express con la prioridad actualizada
 */
const updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, order } = req.body;

    // Verificar si existe la prioridad en Redis
    const key = `priority:${id}`;
    const existing = await client.hGetAll(key);
    if (!existing || !existing.id) {
      return res.status(404).json({ message: 'Prioridad no encontrada' });
    }

    // Actualizar sólo los campos provistos
    if (name !== undefined) await client.hSet(key, 'name', name);
    if (color !== undefined) await client.hSet(key, 'color', color);
    if (order !== undefined) await client.hSet(key, 'order', order.toString());

    // Obtener la data actualizada
    const updated = await client.hGetAll(key);
    res.json({
      id: updated.id,
      name: updated.name,
      color: updated.color,
      order: parseInt(updated.order, 10)
    });
  } catch (error) {
    console.error('[updatePriority] Error:', error);
    res.status(500).json({ message: 'Error al actualizar prioridad', error });
  }
};

/**
 * Elimina una prioridad de Redis
 * @param {Object} req - Solicitud Express con param { id }
 * @param {Object} res - Respuesta Express con mensaje de confirmación
 */
const deletePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const key = `priority:${id}`;

    // Verificar si la prioridad existe
    const data = await client.hGetAll(key);
    if (!data || !data.id) {
      return res.status(404).json({ message: 'Prioridad no encontrada' });
    }

    // Eliminar la key de Redis
    await client.del(key);

    // Quitamos la clave del set para que no aparezca en la lista
    await client.sRem(PRIORITY_SET, key);

    res.json({ message: 'Prioridad eliminada correctamente' });
  } catch (error) {
    console.error('[deletePriority] Error:', error);
    res.status(500).json({ message: 'Error al eliminar prioridad', error });
  }
};

module.exports = {
  createPriority,
  getAllPriorities,
  getPriorityById,
  updatePriority,
  deletePriority
};
