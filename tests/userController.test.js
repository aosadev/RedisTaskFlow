process.env.NODE_ENV = 'test';  // Fuerza el uso del mock
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('../src/routes/userRoutes');

// Creamos una app de Express ficticia para inyectar userRoutes
const app = express();
app.use(bodyParser.json());
app.use('/api/users', userRoutes);

describe('User Controller', () => {
  it('debe registrar un usuario con éxito', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ name: 'Juan', email: 'juan@example.com', password: '1234' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', 'Juan');
    expect(res.body).toHaveProperty('email', 'juan@example.com');
  });

  it('debe retornar error si el email ya existe', async () => {
    // Reintentamos registrar el mismo usuario
    const res = await request(app)
      .post('/api/users/register')
      .send({ name: 'Otro', email: 'juan@example.com', password: '5678' })
      .expect(400);

    expect(res.body).toHaveProperty('message', 'El email ya está en uso');
  });

  it('debe obtener el usuario por ID', async () => {
    // Registramos un nuevo usuario
    const register = await request(app)
      .post('/api/users/register')
      .send({ name: 'María', email: 'maria@example.com', password: 'abc' })
      .expect(201);

    const userId = register.body.id;

    // Lo buscamos
    const getRes = await request(app)
      .get(`/api/users/${userId}`)
      .expect(200);

    expect(getRes.body).toHaveProperty('id', userId.toString());
    expect(getRes.body).toHaveProperty('name', 'María');
    expect(getRes.body).toHaveProperty('email', 'maria@example.com');
  });

  it('debe retornar 404 si el usuario no existe', async () => {
    const res = await request(app)
      .get('/api/users/999')
      .expect(404);

    expect(res.body).toHaveProperty('message', 'Usuario no encontrado');
  });
});
