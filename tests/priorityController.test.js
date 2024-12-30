/**
 * tests/priorityController.test.js
 * =================================
 * Pruebas de unidad/integra con el PriorityController que usa un Set
 * para listar todas las prioridades. Usamos Jest + Supertest.
 */

process.env.NODE_ENV = 'test'; // Forzamos el uso del mock de Redis (si lo tienes configurado)

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Importamos las rutas de prioridades
const priorityRoutes = require('../src/routes/priorityRoutes');

// Creamos una app Express para inyectar las rutas
const app = express();
app.use(bodyParser.json());
app.use('/api/priorities', priorityRoutes);

describe('Priority Controller (con Set)', () => {

  /**
   * 1. Crear una prioridad
   */
  it('debe crear una prioridad con éxito', async () => {
    const response = await request(app)
      .post('/api/priorities')
      .send({
        name: 'Alta',
        color: '#FF0000',
        order: 1
      })
      .expect(201);

    // Verificamos estructura de la respuesta
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'Alta');
    expect(response.body).toHaveProperty('color', '#FF0000');
    expect(response.body).toHaveProperty('order', 1);
  });

  /**
   * 2. Crear prioridad con "name" faltante
   */
  it('debe retornar 400 si falta el campo "name"', async () => {
    const response = await request(app)
      .post('/api/priorities')
      .send({
        color: '#00FF00',
        order: 10
      })
      .expect(400);

    expect(response.body).toHaveProperty('message', 'El nombre es obligatorio');
  });

  /**
   * 3. Listar todas las prioridades
   *  - Creamos al menos dos para verificar que retorne más de una
   */
  it('debe obtener todas las prioridades existentes', async () => {
    // Creamos otra prioridad
    await request(app)
      .post('/api/priorities')
      .send({ name: 'Baja', color: '#00FF00', order: 50 })
      .expect(201);

    const res = await request(app)
      .get('/api/priorities')
      .expect(200);

    // Debe ser un array
    expect(Array.isArray(res.body)).toBe(true);
    // Debe tener al menos 2 prioridades (Alta y Baja)
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    // Verificamos que cada item tenga propiedades válidas
    res.body.forEach((p) => {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('color');
      expect(typeof p.order).toBe('number');
    });
  });

  /**
   * 4. Obtener prioridad por ID
   */
  it('debe obtener una prioridad existente por su ID', async () => {
    // 1) Creamos una prioridad
    const createRes = await request(app)
      .post('/api/priorities')
      .send({ name: 'Media', color: '#FFFF00', order: 10 })
      .expect(201);

    const priorityId = createRes.body.id;

    // 2) GET /:id
    const getRes = await request(app)
      .get(`/api/priorities/${priorityId}`)
      .expect(200);

    // 3) Verificar datos
    expect(getRes.body).toHaveProperty('id', priorityId.toString());
    expect(getRes.body).toHaveProperty('name', 'Media');
    expect(getRes.body).toHaveProperty('color', '#FFFF00');
    expect(getRes.body).toHaveProperty('order', 10);
  });

  it('debe retornar 404 al obtener una prioridad inexistente', async () => {
    const res = await request(app)
      .get('/api/priorities/999999')
      .expect(404);

    expect(res.body).toHaveProperty('message', 'Prioridad no encontrada');
  });

  /**
   * 5. Actualizar prioridad por ID
   */
  it('debe actualizar una prioridad existente', async () => {
    // 1) Crear
    const createRes = await request(app)
      .post('/api/priorities')
      .send({ name: 'Editable', color: '#ABCDEF', order: 5 })
      .expect(201);

    const priorityId = createRes.body.id;

    // 2) PUT
    const updateRes = await request(app)
      .put(`/api/priorities/${priorityId}`)
      .send({
        name: 'Editable Actualizada',
        color: '#FFFFFF',
        order: 99
      })
      .expect(200);

    // 3) Verificar
    expect(updateRes.body).toHaveProperty('id', priorityId.toString());
    expect(updateRes.body).toHaveProperty('name', 'Editable Actualizada');
    expect(updateRes.body).toHaveProperty('color', '#FFFFFF');
    expect(updateRes.body).toHaveProperty('order', 99);
  });

  it('debe retornar 404 al intentar actualizar una prioridad inexistente', async () => {
    const res = await request(app)
      .put('/api/priorities/999999')
      .send({ name: 'No Existe' })
      .expect(404);

    expect(res.body).toHaveProperty('message', 'Prioridad no encontrada');
  });

  /**
   * 6. Eliminar prioridad por ID
   */
  it('debe eliminar una prioridad existente', async () => {
    // 1) Crear
    const createRes = await request(app)
      .post('/api/priorities')
      .send({ name: 'Eliminar', color: '#123456', order: 20 })
      .expect(201);

    const priorityId = createRes.body.id;

    // 2) DELETE
    const deleteRes = await request(app)
      .delete(`/api/priorities/${priorityId}`)
      .expect(200);

    expect(deleteRes.body).toHaveProperty('message', 'Prioridad eliminada correctamente');
  });

  it('debe retornar 404 al eliminar una prioridad inexistente', async () => {
    const res = await request(app)
      .delete('/api/priorities/999999')
      .expect(404);

    expect(res.body).toHaveProperty('message', 'Prioridad no encontrada');
  });
});
