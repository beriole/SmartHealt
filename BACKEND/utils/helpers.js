const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { UnauthorizedError } = require('../errors/AppError');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

function generateUUID() {
  return require('uuid').v4();
}

function generateNumeroCarnet() {
  const prefix = 'SH';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateUUID,
  generateNumeroCarnet,
};
