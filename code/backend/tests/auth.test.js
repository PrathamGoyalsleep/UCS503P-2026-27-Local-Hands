// Author: Pratham Goyal
// Week 3 Task: Authentication Test Cases

/**
 * These are the integration test cases for the Authentication flow.
 * They should be run using Jest and Supertest.
 */

const request = require('supertest');
const app = require('../server'); // Assuming server.js exports the app

describe('Authentication API Tests', () => {
  
  // Test Case 1: Customer Registration
  it('should successfully register a new customer', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Customer',
        email: 'customer@test.com',
        password: 'password123',
        role: 'customer'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });

  // Test Case 2: Duplicate Account
  it('should reject registration for an existing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate',
        email: 'customer@test.com',
        password: 'password123'
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('User already exists');
  });

  // Test Case 3: Admin Login
  it('should login an admin and return a valid JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'adminpassword'
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.role).toEqual('admin');
    expect(res.body).toHaveProperty('token');
  });

});

