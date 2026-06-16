const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');

const logger = require('../utils/logger');
const { errorHandler } = require('../errors/errorHandler');
const { connectDatabase, disconnectDatabase } = require('../services/database');

const authRoutes = require('../routes/authRoutes');
const utilisateurRoutes = require('../routes/utilisateurRoutes');
const patientRoutes = require('../routes/patientRoutes');
const professionnelRoutes = require('../routes/professionnelRoutes');
const medicamentRoutes = require('../routes/medicamentRoutes');
const pharmacieRoutes = require('../routes/pharmacieRoutes');
const consultationRoutes = require('../routes/consultationRoutes');
const interventionRoutes = require('../routes/interventionRoutes');
const ordonnanceRoutes = require('../routes/ordonnanceRoutes');
const commandeRoutes = require('../routes/commandeRoutes');
const carnetRoutes = require('../routes/carnetRoutes');
const livreurRoutes = require('../routes/livreurRoutes');
const triageRoutes = require('../routes/triageRoutes');
const stockRoutes = require('../routes/stockRoutes');
const rappelRoutes = require('../routes/rappelRoutes');
const b2bRoutes = require('../routes/b2bRoutes');
const adminRoutes = require('../routes/adminRoutes');
const articleRoutes = require('../routes/articleRoutes');
const iaRoutes = require('../routes/iaRoutes');

const { initRappelCron } = require('../services/rappelCron');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  logger.warn('⚠️  JWT_SECRET non défini : un secret par défaut NON SÉCURISÉ est utilisé. Définissez-le dans le .env.');
}

app.use(helmet());
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting global : 100 requêtes / 15 min par IP (désactivé en test)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100000 : 100,
  message: { success: false, message: 'Trop de requêtes. Veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Documentation API interactive (Swagger UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'SmartHealth API — Documentation',
}));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/professionnels', professionnelRoutes);
app.use('/api/medicaments', medicamentRoutes);
app.use('/api/pharmacies', pharmacieRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/ordonnances', ordonnanceRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api/carnets', carnetRoutes);
app.use('/api/livreurs', livreurRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/rappels', rappelRoutes);
app.use('/api/b2b', b2bRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/ia', iaRoutes);

// 404 : doit précéder le gestionnaire d'erreurs
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

async function startServer() {
  await connectDatabase();

  initRappelCron();

  const server = app.listen(PORT, () => {
    logger.info(`🚀 SmartHealth server running on port ${PORT}`);
  });

  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

if (require.main === module) {
  startServer().catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = app;
