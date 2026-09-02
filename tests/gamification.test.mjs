import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function getGelar(points) {
  if (points >= 1000) return 'Pilar Utama';
  if (points >= 600)  return 'Visioner';
  if (points >= 300)  return 'Intelektual';
  if (points >= 100)  return 'Penggerak';
  return 'Perintis';
}

function getGelarIcon(points) {
  if (points >= 1000) return 'fa-solid fa-crown';
  if (points >= 600)  return 'fa-solid fa-star';
  if (points >= 300)  return 'fa-solid fa-medal';
  if (points >= 100)  return 'fa-solid fa-shield-halved';
  return 'fa-solid fa-seedling';
}

describe('Gamification Prestise Utility', () => {
  it('should return Perintis for points < 100', () => {
    assert.equal(getGelar(0), 'Perintis');
    assert.equal(getGelar(50), 'Perintis');
    assert.equal(getGelar(99), 'Perintis');
    assert.equal(getGelarIcon(50), 'fa-solid fa-seedling');
  });

  it('should return Penggerak for points 100 to 299', () => {
    assert.equal(getGelar(100), 'Penggerak');
    assert.equal(getGelar(250), 'Penggerak');
    assert.equal(getGelarIcon(100), 'fa-solid fa-shield-halved');
  });

  it('should return Intelektual for points 300 to 599', () => {
    assert.equal(getGelar(300), 'Intelektual');
    assert.equal(getGelar(599), 'Intelektual');
    assert.equal(getGelarIcon(300), 'fa-solid fa-medal');
  });

  it('should return Visioner for points 600 to 999', () => {
    assert.equal(getGelar(600), 'Visioner');
    assert.equal(getGelar(999), 'Visioner');
    assert.equal(getGelarIcon(600), 'fa-solid fa-star');
  });

  it('should return Pilar Utama for points >= 1000', () => {
    assert.equal(getGelar(1000), 'Pilar Utama');
    assert.equal(getGelar(5000), 'Pilar Utama');
    assert.equal(getGelarIcon(1000), 'fa-solid fa-crown');
  });
});
