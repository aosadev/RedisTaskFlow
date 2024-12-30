/**
 * Controlador de Prioridades
 * ==========================
 * Maneja la lógica para crear, listar, actualizar y eliminar registros
 * de tipo "Prioridad" en Redis. Cada prioridad se almacena como un Hash:
 *   priority:{id} => { id, name, color, order }
 * Además, se utiliza un contador (priorityIdCounter) para autogenerar IDs.
 */

const { client } = require('../config/redis');

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

    // Responder con la prioridad creada
    res.status(201).json({
      id: newPriorityId,
      name,
      color,
      order
    });
  } catch (error) {
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
    const priorities = [];
    let cursor = '0';

    // Usamos SCAN para iterar sobre todas las keys que coincidan con 'priority:*'
    // En un proyecto grande, podrías usar un Set con IDs de prioridad en vez de SCAN.
    do {
      const reply = await client.scan(cursor, {
        MATCH: 'priority:*',
        COUNT: 50
      });
      cursor = reply.cursor;

      // Para cada key que coincida (p.ej. "priority:1"), obtenemos el Hash
      for (const key of reply.keys) {
        const data = await client.hGetAll(key);
        if (data && data.id) {
          priorities.push({
            id: data.id,
            name: data.name,
            color: data.color,
            order: parseInt(data.order, 10)
          });
        }
      }
    } while (cursor !== '0');

    // Ordenamos por 'order' antes de responder
    priorities.sort((a, b) => a.order - b.order);

    res.json(priorities);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener prioridades', error });
  }
};


/**
 * getPriorityById
 * ---------------
 * Dado un ID de prioridad, obtiene los campos almacenados en Redis
 * y los devuelve en formato JSON. Responde con 404 si no existe.
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
        order: parseInt(data.order, 10) // parseo a number
      };
  
      res.json(priority);
    } catch (error) {
      console.error('[getPriorityById] Error:', error);
      res.status(500).json({ message: 'Error al obtener prioridad', error });
    }
  };
  

/**
 * Actualiza los campos de una prioridad existente
 * @param {Object} req - Solicitud Express con param { id } y body { name, color, order }
 * @param {Object} res - Respuesta Express con la prioridad actualizada
 */
const updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, order } = req.body;

    // Verificar si existe la prioridad en Redis
    const priorityData = await client.hGetAll(`priority:${id}`);
    if (!priorityData || !priorityData.id) {
      return res.status(404).json({ message: 'Prioridad no encontrada' });
    }

    // Actualizar solo los campos que se incluyan en el request
    if (name !== undefined) {
      await client.hSet(`priority:${id}`, 'name', name);
    }
    if (color !== undefined) {
      await client.hSet(`priority:${id}`, 'color', color);
    }
    if (order !== undefined) {
      await client.hSet(`priority:${id}`, 'order', order.toString());
    }

    // Obtenemos los datos actualizados
    const updatedData = await client.hGetAll(`priority:${id}`);
    res.json({
      id: updatedData.id,
      name: updatedData.name,
      color: updatedData.color,
      order: parseInt(updatedData.order, 10)
    });
  } catch (error) {
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

    // Verificar si la prioridad existe
    const priorityData = await client.hGetAll(`priority:${id}`);
    if (!priorityData || !priorityData.id) {
      return res.status(404).json({ message: 'Prioridad no encontrada' });
    }

    // Eliminar la key de Redis
    await client.del(`priority:${id}`);

    res.json({ message: 'Prioridad eliminada correctamente' });
  } catch (error) {
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
