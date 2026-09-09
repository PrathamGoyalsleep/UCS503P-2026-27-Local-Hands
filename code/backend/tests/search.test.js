// Author: Pratham Goyal
// Week 5 Task: Ranking Logic & Search Endpoints Test

const request = require('supertest');
const app = require('../server'); 
const mongoose = require('mongoose');
const Worker = require('../models/Worker');

describe('Customer Search & Ranking Logic API', () => {

  it('should return a list of approved workers', async () => {
    const res = await request(app).get('/api/workers');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('should filter workers by category (e.g., Plumber)', async () => {
    const res = await request(app).get('/api/workers?category=Plumber');
    expect(res.statusCode).toEqual(200);
    if (res.body.length > 0) {
      expect(res.body[0].category.toLowerCase()).toContain('plumber');
    }
  });

  it('should filter workers by location (e.g., Patiala)', async () => {
    const res = await request(app).get('/api/workers?location=Patiala');
    expect(res.statusCode).toEqual(200);
    if (res.body.length > 0) {
      expect(res.body[0].location.toLowerCase()).toContain('patiala');
    }
  });

  it('should sort workers by rating in descending order (Ranking Logic)', async () => {
    const res = await request(app).get('/api/workers');
    expect(res.statusCode).toEqual(200);
    
    if (res.body.length > 1) {
      const firstWorkerRating = res.body[0].rating;
      const secondWorkerRating = res.body[1].rating;
      expect(firstWorkerRating).toBeGreaterThanOrEqual(secondWorkerRating);
    }
  });

});

