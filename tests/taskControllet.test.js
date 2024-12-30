/**
 * Tests de Etiquetas (tagController)
 * ==================================
 * Verifica la creación, lectura, actualización y eliminación de etiquetas en Redis.
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Importamos las rutas
const tagRoutes = require('../src/routes/tagRoutes');

// Creamos una app de prueba
const app = express();
app.use(bodyParser.json());
app.use('/api/tags', tagRoutes);

describe('Tag Controller', () => {
  it('debe crear una etiqueta con éxito', async () => {
    const response = await request(app)
      .post('/api/tags')
      .send({ name: 'Backend' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'Backend');
  });

  it('debe retornar 400 si falta "name"', async () => {
    const response = await request(app)
      .post('/api/tags')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('message', 'El nombre de la etiqueta es obligatorio');
  });

  it('debe listar todas las etiquetas', async () => {
    // Creamos al menos una
    await request(app)
      .post('/api/tags')
      .send({ name: 'Frontend' })
      .expect(201);

    const res = await request(app)
      .get('/api/tags')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('debe obtener una etiqueta por ID', async () => {
    // Creamos
    const createRes = await request(app)
      .post('/api/tags')
      .send({ name: 'DevOps' })
      .expect(201);

    const tagId = createRes.body.id;
    // Obtenemos por ID
    const getRes = await request(app)
      .get(`/api/tags/${tagId}`)
      .expect(200);

    expect(getRes.body).toHaveProperty('id', tagId.toString());
    expect(getRes.body).toHaveProperty('name', 'DevOps');
  });

  it('debe retornar 404 si la etiqueta no existe', async () => {
    const res = await request(app)
      .get('/api/tags/999999')
      .expect(404);

    expect(res.body).toHaveProperty('message', 'Etiqueta no encontrada');
  });

  it('debe actualizar una etiqueta existente', async () => {
    // Crear
    const createRes = await request(app)
      .post('/api/tags')
      .send({ name: 'UpdateTest' })
      .expect(201);

    const tagId = createRes.body.id;

    // Actualizar
    const updateRes = await request(app)
      .put(`/api/tags/${tagId}`)
      .send({ name: 'UpdateTest Renombrado' })
      .expect(200);

    expect(updateRes.body).toHaveProperty('id', tagId.toString());
    expect(updateRes.body).toHaveProperty('name', 'UpdateTest Renombrado');
  });

  it('debe eliminar una etiqueta existente', async () => {
    // Crear
    const createRes = await request(app)
      .post('/api/tags')
      .send({ name: 'Eliminar' })
      .expect(201);

    const tagId = createRes.body.id;

    // Eliminar
    const deleteRes = await request(app)
      .delete(`/api/tags/${tagId}`)
      .expect(200);

    expect(deleteRes.body).toHaveProperty('message', 'Etiqueta eliminada correctamente');
  });
});
