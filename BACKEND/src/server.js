const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

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
const ordonnanceRoutes = require('../routes/ordonnanceRoutes');
const commandeRoutes = require('../routes/commandeRoutes');
const carnetRoutes = require('../routes/carnetRoutes');
const triageRoutes = require('../routes/triageRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/professionnels', professionnelRoutes);
app.use('/api/medicaments', medicamentRoutes);
app.use('/api/pharmacies', pharmacieRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/ordonnances', ordonnanceRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api/carnets', carnetRoutes);
app.use('/api/triage', triageRoutes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

async function startServer() {
  await connectDatabase();

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

startServer().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
