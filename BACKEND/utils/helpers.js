const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { UnauthorizedError } = require('../errors/AppError');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
// Durée de vie courte pour l'access token (le refresh token prend le relais).
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '1h';

function generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// Access token court (authentification des requêtes API).
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
}

// Refresh token opaque (valeur aléatoire, jamais un JWT) : seule sa version
// hashée est stockée en base, comme un mot de passe.
function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
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
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateUUID,
  generateNumeroCarnet,
};
