/**
 * Controlador de Etiquetas (Tags)
 * ===============================
 * Maneja la lógica para crear, listar, actualizar y eliminar registros
 * de tipo "Tag" en Redis. Cada etiqueta se almacena como un Hash:
 *   tag:{id} => { id, name }
 *
 * Además, se utiliza un contador (tagIdCounter) para autogenerar IDs,
 * y un Set (tagIdsSet) para poder listar todas las etiquetas de forma eficiente.
 */

const { client } = require('../config/redis');

// Nombre del set donde se guardan las claves de cada etiqueta
const TAG_SET = 'tagIdsSet';

/**
 * Crea una nueva etiqueta en Redis
 * @function createTag
 * @async
 * @param {Object} req - Objeto de solicitud Express con { name } en el body
 * @param {Object} res - Objeto de respuesta Express
 * @returns {JSON} Un objeto JSON con la etiqueta creada
 *
 * @example
 * POST /api/tags
 * {
 *   "name": "Backend"
 * }
 *
 * Respuesta exitosa (201):
 * {
 *   "id": 1,
 *   "name": "Backend"
 * }
 */
const createTag = async (req, res) => {
  try {
    const { name } = req.body;

    // Validación: name es obligatorio
    if (!name) {
      return res.status(400).json({ message: 'El nombre de la etiqueta es obligatorio' });
    }

    // Genera un nuevo ID incremental para esta etiqueta
    const newTagId = await client.incr('tagIdCounter');

    // Almacena la etiqueta como un Hash en Redis
    await client.hSet(`tag:${newTagId}`, {
      id: newTagId.toString(),
      name
    });

    // Añade la clave "tag:{id}" a un Set global para poder listarlo más tarde
    await client.sAdd(TAG_SET, `tag:${newTagId}`);

    return res.status(201).json({
      id: newTagId,
      name
    });
  } catch (error) {
    console.error('[createTag] Error:', error);
    return res.status(500).json({ message: 'Error al crear etiqueta', error });
  }
};

/**
 * Obtiene todas las etiquetas (tags) almacenadas en Redis
 * @function getAllTags
 * @async
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {JSON} Un array JSON de todas las etiquetas
 *
 * @example
 * GET /api/tags
 *
 * Respuesta exitosa (200):
 * [
 *   { "id": "1", "name": "Backend" },
 *   { "id": "2", "name": "Frontend" }
 * ]
 */
const getAllTags = async (req, res) => {
  try {
    // Obtenemos todas las claves de etiquetas desde el Set
    const keys = await client.sMembers(TAG_SET);
    const tags = [];

    // Para cada clave (p.ej. "tag:1"), obtenemos el Hash
    for (const key of keys) {
      const data = await client.hGetAll(key);
      if (data && data.id) {
        tags.push({
          id: data.id,
          name: data.name
        });
      }
    }

    // Ordena alfabéticamente por "name"
     tags.sort((a, b) => a.name.localeCompare(b.name));

    return res.json(tags);
  } catch (error) {
    console.error('[getAllTags] Error:', error);
    return res.status(500).json({ message: 'Error al obtener etiquetas', error });
  }
};

/**
 * Obtiene una etiqueta específica por su ID
 * @function getTagById
 * @async
 * @param {Object} req - Objeto de solicitud Express, con { id } en req.params
 * @param {Object} res - Objeto de respuesta Express
 * @returns {JSON} La etiqueta encontrada o un 404 si no existe
 *
 * @example
 * GET /api/tags/1
 *
 * Respuesta exitosa (200):
 * { "id": "1", "name": "Backend" }
 */
const getTagById = async (req, res) => {
  try {
    const { id } = req.params;
    const key = `tag:${id}`;

    const data = await client.hGetAll(key);
    if (!data || !data.id) {
      return res.status(404).json({ message: 'Etiqueta no encontrada' });
    }

    return res.json({
      id: data.id,
      name: data.name
    });
  } catch (error) {
    console.error('[getTagById] Error:', error);
    return res.status(500).json({ message: 'Error al obtener etiqueta', error });
  }
};

/**
 * Actualiza una etiqueta por ID
 * @function updateTag
 * @async
 * @param {Object} req - Objeto de solicitud Express, con { id } en req.params y { name } en el body
 * @param {Object} res - Objeto de respuesta Express
 * @returns {JSON} La etiqueta actualizada o un 404 si no existe
 *
 * @example
 * PUT /api/tags/1
 * {
 *   "name": "Backend Avanzado"
 * }
 *
 * Respuesta exitosa (200):
 * {
 *   "id": "1",
 *   "name": "Backend Avanzado"
 * }
 */
const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const key = `tag:${id}`;
    const existing = await client.hGetAll(key);

    // Verificar si la etiqueta existe
    if (!existing || !existing.id) {
      return res.status(404).json({ message: 'Etiqueta no encontrada' });
    }

    // Solo actualizamos si "name" ha sido provisto
    if (name !== undefined) {
      await client.hSet(key, 'name', name);
    }

    // Obtenemos el hash actualizado
    const updated = await client.hGetAll(key);
    return res.json({
      id: updated.id,
      name: updated.name
    });
  } catch (error) {
    console.error('[updateTag] Error:', error);
    return res.status(500).json({ message: 'Error al actualizar etiqueta', error });
  }
};

/**
 * Elimina una etiqueta por ID
 * @function deleteTag
 * @async
 * @param {Object} req - Objeto de solicitud Express, con { id } en req.params
 * @param {Object} res - Objeto de respuesta Express
 * @returns {JSON} Mensaje de confirmación o 404 si no existe
 *
 * @example
 * DELETE /api/tags/1
 *
 * Respuesta exitosa (200):
 * { "message": "Etiqueta eliminada correctamente" }
 */
const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    const key = `tag:${id}`;

    // Verificar si la etiqueta existe
    const data = await client.hGetAll(key);
    if (!data || !data.id) {
      return res.status(404).json({ message: 'Etiqueta no encontrada' });
    }

    // Borrar el hash
    await client.del(key);

    // Remover la clave del set
    await client.sRem(TAG_SET, key);

    return res.json({ message: 'Etiqueta eliminada correctamente' });
  } catch (error) {
    console.error('[deleteTag] Error:', error);
    return res.status(500).json({ message: 'Error al eliminar etiqueta', error });
  }
};

/** Exportamos los métodos del controlador. */
module.exports = {
  createTag,
  getAllTags,
  getTagById,
  updateTag,
  deleteTag
};
