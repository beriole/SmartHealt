const { NotFoundError, ForbiddenError, ValidationError } = require('../errors/AppError');
const { prisma } = require('../services/database');
const { sendCommandeNotification } = require('../utils/email');
const crypto = require('crypto');
const notchpayClient = require('../utils/notchpay');
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, id_patient, id_pharmacie, statut_commande } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (id_patient) where.id_patient = id_patient;
    if (id_pharmacie) where.id_pharmacie = id_pharmacie;
    if (statut_commande) where.statut_commande = statut_commande;

    const [data, total] = await Promise.all([
      prisma.commande.findMany({
        where,
        skip,
        take: Number(limit),
        include: { patient: true, pharmacie: true, lignes: true },
        orderBy: { date_commande: 'desc' },
      }),
      prisma.commande.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id_commande: req.params.id },
      include: {
        patient: true,
        pharmacie: true,
        lignes: { include: { stock: { include: { medicament: true } } } },
      },
    });
    if (!commande) throw new NotFoundError('Commande');
    res.json({ success: true, data: commande });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { lignes, type_livraison, id_pharmacie, photo_ordonnance_url, ...commandeData } = req.body;

    // Récupérer le patient
    const patient = await prisma.patient.findUnique({
      where: { id_utilisateur: req.user.id },
      include: { utilisateur: true }
    });

    if (!patient) throw new ForbiddenError('Seuls les patients peuvent passer commande.');

    const result = await prisma.$transaction(async (tx) => {
      let montantTotal = type_livraison === 'livraison_domicile' ? 1500 : 0;
      let requiresPrescription = false;

      // 1. Création de la commande de base
      const commande = await tx.commande.create({
        data: {
          ...commandeData,
          id_patient: patient.id_patient,
          id_pharmacie,
          type_livraison,
          photo_ordonnance_url,
          montant_total_fcfa: 0 // Mis à jour après
        }
      });

      // 2. Traitement des lignes
      for (const ligne of lignes) {
        const stock = await tx.stockPharmacie.findUnique({
          where: { id_stock: ligne.id_stock },
          include: { medicament: true }
        });

        if (!stock) throw new NotFoundError(`Stock introuvable pour le produit ID: ${ligne.id_stock}`);
        if (stock.id_pharmacie !== id_pharmacie) throw new ValidationError('Tous les produits doivent provenir de la même pharmacie.');
        if (stock.quantite_disponible < ligne.quantite_commandee) {
          throw new ValidationError(`Stock insuffisant pour ${stock.medicament.nom_commercial}. Restant: ${stock.quantite_disponible}`);
        }

        if (stock.medicament.necessite_ordonnance) requiresPrescription = true;

        const sousTotal = Number(stock.prix_vente_fcfa) * ligne.quantite_commandee;
        montantTotal += sousTotal;

        // Création de la ligne de commande
        await tx.ligneCommande.create({
          data: {
            id_commande: commande.id_commande,
            id_stock: ligne.id_stock,
            quantite_commandee: ligne.quantite_commandee,
            prix_unitaire_fcfa: stock.prix_vente_fcfa,
            sous_total_fcfa: sousTotal,
          },
        });

        // Décrémentation du stock
        await tx.stockPharmacie.update({
          where: { id_stock: ligne.id_stock },
          data: { quantite_disponible: stock.quantite_disponible - ligne.quantite_commandee }
        });
      }

      // Vérification photo si ordonnance requise
      if (requiresPrescription && !photo_ordonnance_url) {
        throw new ValidationError('Ce panier contient des médicaments sur ordonnance. Veuillez uploader une photo de votre ordonnance.');
      }

      // 3. Mise à jour du montant final
      return await tx.commande.update({
        where: { id_commande: commande.id_commande },
        data: { montant_total_fcfa: montantTotal },
        include: { pharmacie: true, lignes: { include: { stock: { include: { medicament: true } } } } }
      });
    });

    // Notification email
    sendCommandeNotification(patient.utilisateur.email, result);

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.createFromOrdonnance = async (req, res, next) => {
  try {
    const { id_ordonnance, id_pharmacie, type_livraison, adresse_livraison } = req.body;

    const patient = await prisma.patient.findUnique({
      where: { id_utilisateur: req.user.id },
      include: { utilisateur: true }
    });

    if (!patient) throw new ForbiddenError('Seuls les patients peuvent passer commande.');

    const ordonnance = await prisma.ordonnance.findUnique({
      where: { id_ordonnance },
      include: { lignes: { include: { medicament: true } } }
    });

    if (!ordonnance) throw new NotFoundError('Ordonnance introuvable');
    if (ordonnance.id_patient !== patient.id_patient) throw new ForbiddenError('Cette ordonnance ne vous appartient pas.');

    const result = await prisma.$transaction(async (tx) => {
      let montantTotal = type_livraison === 'livraison_domicile' ? 1500 : 0;

      const commande = await tx.commande.create({
        data: {
          id_patient: patient.id_patient,
          id_pharmacie,
          id_ordonnance,
          type_livraison,
          adresse_livraison,
          montant_total_fcfa: 0
        }
      });

      for (const ligneOrd of ordonnance.lignes) {
        const stock = await tx.stockPharmacie.findFirst({
          where: {
            id_pharmacie,
            id_medicament: ligneOrd.id_medicament,
            quantite_disponible: { gte: ligneOrd.quantite }
          }
        });

        if (!stock) {
          throw new ValidationError(`Le médicament ${ligneOrd.medicament.nom_commercial} n'est pas disponible en quantité suffisante dans cette pharmacie.`);
        }

        const sousTotal = Number(stock.prix_vente_fcfa) * ligneOrd.quantite;
        montantTotal += sousTotal;

        await tx.ligneCommande.create({
          data: {
            id_commande: commande.id_commande,
            id_stock: stock.id_stock,
            quantite_commandee: ligneOrd.quantite,
            prix_unitaire_fcfa: stock.prix_vente_fcfa,
            sous_total_fcfa: sousTotal,
          },
        });

        await tx.stockPharmacie.update({
          where: { id_stock: stock.id_stock },
          data: { quantite_disponible: stock.quantite_disponible - ligneOrd.quantite }
        });
      }

      return await tx.commande.update({
        where: { id_commande: commande.id_commande },
        data: { montant_total_fcfa: montantTotal },
        include: { pharmacie: true, lignes: { include: { stock: { include: { medicament: true } } } } }
      });
    });

    sendCommandeNotification(patient.utilisateur.email, result);

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const commande = await prisma.commande.update({
      where: { id_commande: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: commande });
  } catch (error) {
    next(error);
  }
};

exports.initiatePayment = async (req, res, next) => {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id_commande: req.params.id },
      include: { patient: { include: { utilisateur: true } } }
    });

    if (!commande) throw new NotFoundError('Commande');
    
    // Vérifier si cette commande est déjà payée
    if (commande.statut_paiement === 'paye') {
      return res.status(400).json({ success: false, message: 'Cette commande est déjà payée.' });
    }

    const payload = {
      amount: Number(commande.montant_total_fcfa),
      currency: "XAF",
      email: commande.patient.utilisateur.email || 'client@exemple.com',
      phone: commande.patient.utilisateur.telephone || undefined,
      description: `Paiement commande smarthealth #${commande.id_commande.substring(0,8)}`,
      reference: commande.id_commande,
      // URL temporaire, en attente du frontend
      callback: "http://localhost:3000/api/commandes/callback/verify", 
    };

    const response = await notchpayClient.post('/payments/initialize', payload);
    const { transaction, authorization_url } = response.data;

    res.json({
      success: true,
      message: 'Paiement initialisé avec succès',
      data: {
        authorization_url,
        reference: transaction.reference
      }
    });

  } catch (error) {
    if (error.response?.data) {
      console.error('Erreur API NotchPay:', error.response.data);
    }
    next(error);
  }
};

exports.verifyPaymentCallback = async (req, res, next) => {
  try {
    const { reference } = req.query;
    if (!reference) return res.status(400).json({ success: false, message: 'Référence manquante' });

    const response = await notchpayClient.get(`/payments/${reference}`);
    const { transaction } = response.data;

    // Mise à jour de la base de données
    const statut_paiement = transaction.status === 'complete' ? 'paye' : 
                            (transaction.status === 'failed' || transaction.status === 'canceled' ? 'echoue' : 'en_attente');

    await prisma.commande.update({
      where: { id_commande: reference },
      data: { statut_paiement }
    });

    if (transaction.status === 'complete') {
      // Redirection après succès (FRONTEND)
      res.redirect(`http://localhost:3000/paiement-succes?ref=${reference}`);
    } else {
      res.redirect(`http://localhost:3000/paiement-echec?ref=${reference}&status=${transaction.status}`);
    }
  } catch (error) {
    if (error.response?.data) {
      console.error('Erreur vérification NotchPay:', error.response.data);
    }
    next(error);
  }
};

exports.webhookNotchPay = async (req, res) => {
  try {
    const signature = req.headers['x-notch-signature'];
    const payload = req.rawBody;

    if (process.env.NOTCHPAY_HASH_KEY && payload && signature) {
      const expectedSig = crypto
        .createHmac('sha256', process.env.NOTCHPAY_HASH_KEY)
        .update(payload).digest('hex');

      if (signature !== expectedSig) {
        return res.status(401).send('Signature invalide');
      }
    }

    const event = req.body;
    
    if (event && event.type && event.data && event.data.reference) {
      const { reference } = event.data;
      if (event.type === 'payment.complete') {
        await prisma.commande.update({
          where: { id_commande: reference },
          data: { statut_paiement: 'paye' }
        });
      } else if (event.type === 'payment.failed' || event.type === 'payment.canceled') {
        await prisma.commande.update({
          where: { id_commande: reference },
          data: { statut_paiement: 'echoue' }
        });
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erreur webhook NotchPay:', error);
    res.status(500).send('Erreur interne webhooks');
  }
};

