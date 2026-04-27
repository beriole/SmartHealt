const { NotFoundError, ForbiddenError, ValidationError, ConflictError } = require('../errors/AppError');
const { prisma } = require('../services/database');
const { sendCommandeNotification, sendPinLivraisonEmail } = require('../utils/email');
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
          montant_total_fcfa: 0, // Mis à jour après
          statut_paiement: 'en_attente',
          statut_commande: 'en_attente'
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
          data: { quantite_disponible: { decrement: ligne.quantite_commandee } }
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
          montant_total_fcfa: 0,
          statut_paiement: 'en_attente',
          statut_commande: 'en_attente'
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
          data: { quantite_disponible: { decrement: ligneOrd.quantite } }
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

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut_commande, date_livraison_prevue, date_livraison_effective } = req.body;

    const commande = await prisma.commande.findUnique({
      where: { id_commande: id },
      include: { pharmacie: true }
    });

    if (!commande) throw new NotFoundError('Commande');

    // Sécurité: vérifier propriétaire pharmacie
    if (req.user.type !== 'ADMIN' && commande.pharmacie.id_responsable !== req.user.id) {
      throw new ForbiddenError('Seule la pharmacie en charge peut modifier le suivi de ce colis.');
    }

    const data = {};
    if (statut_commande) {
      if (statut_commande === 'preparee' && commande.statut_paiement !== 'paye') {
        throw new ForbiddenError('Impossible de préparer cette commande : le paiement NotchPay n\'est pas finalisé.');
      }
      data.statut_commande = statut_commande;
    }
    if (date_livraison_prevue) data.date_livraison_prevue = new Date(date_livraison_prevue);
    if (date_livraison_effective) data.date_livraison_effective = new Date(date_livraison_effective);
    
    // Auto-datation lors de la confirmation finale
    if (statut_commande === 'livree' && !data.date_livraison_effective) {
      data.date_livraison_effective = new Date();
    }

    const updated = await prisma.commande.update({
      where: { id_commande: id },
      data,
    });
    res.json({ success: true, message: 'Suivi de commande mis à jour', data: updated });
  } catch (error) {
    next(error);
  }
};

exports.annulerCommande = async (req, res, next) => {
  try {
    const { id } = req.params;

    const commande = await prisma.commande.findUnique({
      where: { id_commande: id },
      include: { pharmacie: true, lignes: true }
    });

    if (!commande) throw new NotFoundError('Commande');

    if (req.user.type !== 'ADMIN' && commande.pharmacie.id_responsable !== req.user.id) {
      throw new ForbiddenError('Seule la pharmacie en charge peut annuler cette commande.');
    }

    if (commande.statut_commande === 'livree' || commande.statut_commande === 'annulee') {
      throw new ValidationError('Impossible d\'annuler une commande déjà livrée ou annulée.');
    }

    // Restitution des stocks atomique
    await prisma.$transaction(async (tx) => {
      for (const ligne of commande.lignes) {
        await tx.stockPharmacie.update({
          where: { id_stock: ligne.id_stock },
          data: { quantite_disponible: { increment: ligne.quantite_commandee } }
        });
      }

      await tx.commande.update({
        where: { id_commande: id },
        data: { statut_commande: 'annulee' }
      });
    });

    res.json({ success: true, message: 'Commande annulée et stocks restitués avec succès.' });
  } catch (error) {
    next(error);
  }
};

exports.getDisponiblesLivraison = async (req, res, next) => {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        type_livraison: 'livraison_domicile',
        statut_commande: 'preparee', // Prêtes à être récupérées
        id_livreur: null // Non encore assignées
      },
      include: {
        pharmacie: { select: { nom_pharmacie: true, adresse: true, latitude: true, longitude: true } }
      }
    });
    res.json({ success: true, data: commandes });
  } catch (error) {
    next(error);
  }
};

exports.assignLivreur = async (req, res, next) => {
  try {
    const { id } = req.params;

    const livreur = await prisma.livreur.findUnique({
      where: { id_utilisateur: req.user.id }
    });

    if (!livreur || livreur.statut_verification !== 'verifie') {
      throw new ForbiddenError('Votre profil livreur n\'est pas actif ou vérifié.');
    }

    const commande = await prisma.commande.findUnique({ 
      where: { id_commande: id },
      include: { patient: { include: { utilisateur: true } } }
    });
    
    if (!commande) throw new NotFoundError('Commande introuvable');
    if (commande.statut_commande !== 'preparee') throw new ValidationError('Cette commande n\'est pas encore prête');

    // Génération du PIN à 4 chiffres auto (Ex: 8492)
    const pinStr = Math.floor(1000 + Math.random() * 9000).toString();

    // Verrou Atomique (Race Condition Lock)
    const updateLock = await prisma.commande.updateMany({
      where: { 
        id_commande: id,
        id_livreur: null,
        statut_commande: 'preparee'
      },
      data: {
        id_livreur: livreur.id_livreur,
        statut_commande: 'en_livraison',
        code_validation_livraison: pinStr
      }
    });

    if (updateLock.count === 0) {
      throw new ConflictError('Trop tard ! Cette commande a déjà été acceptée par un autre coursier ou n\'est plus disponible.');
    }

    const updated = await prisma.commande.findUnique({ where: { id_commande: id } });

    // Envoi du mail au patient
    if (commande.patient && commande.patient.utilisateur && commande.patient.utilisateur.email) {
      await sendPinLivraisonEmail(
        commande.patient.utilisateur.email, 
        `${commande.patient.utilisateur.prenom} ${commande.patient.utilisateur.nom}`, 
        pinStr, 
        commande.id_commande
      );
    }

    res.json({ 
      success: true, 
      message: 'Course acceptée. Un email avec le code PIN a été envoyé au client.', 
      data: updated 
    });
  } catch (error) {
    next(error);
  }
};

exports.validerLivraison = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code_validation } = req.body;

    const commande = await prisma.commande.findUnique({ 
      where: { id_commande: id },
      include: { livreur: true }
    });

    if (!commande) throw new NotFoundError('Commande introuvable');
    if (commande.statut_commande === 'livree') throw new ValidationError('La commande est déjà livrée.');
    if (commande.code_validation_livraison !== code_validation) {
      throw new ValidationError('Code de validation incorrect.');
    }

    // Le livreur valide la course avec le code
    const updatedCommande = await prisma.$transaction(async (tx) => {
      const result = await tx.commande.update({
        where: { id_commande: id },
        data: {
          statut_commande: 'livree',
          date_livraison_effective: new Date()
        }
      });

      // Mettre à jour les stats du livreur (Gagne 1500 FCFA de prime)
      if (commande.id_livreur) {
        await tx.livreur.update({
          where: { id_livreur: commande.id_livreur },
          data: {
            total_livraisons: { increment: 1 },
            commission_totale_fcfa: { increment: 1500 }
          }
        });
      }
      return result;
    });

    res.json({ success: true, message: 'Livraison validée avec succès.', data: updatedCommande });
  } catch (error) {
    next(error);
  }
};

exports.evaluerLivraison = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note_livraison, commentaire_livraison, note_pharmacie, commentaire_pharmacie } = req.body;

    const commande = await prisma.commande.findUnique({ where: { id_commande: id } });
    
    // Seul le patient de la commande peut évaluer
    const patient = await prisma.patient.findUnique({ where: { id_utilisateur: req.user.id }});
    if (!patient || commande.id_patient !== patient.id_patient) {
      throw new ForbiddenError('Vous ne pouvez évaluer que vos propres commandes.');
    }

    if (commande.statut_commande !== 'livree') {
      throw new ValidationError('Vous ne pouvez évaluer qu\'une commande déjà livrée.');
    }

    if (commande.note_livraison !== null || commande.note_pharmacie !== null) {
      throw new ValidationError("Ceci a déjà été évalué");
    }

    const updated = await prisma.commande.update({
      where: { id_commande: id },
      data: {
        note_livraison,
        commentaire_livraison,
        note_pharmacie,
        commentaire_pharmacie
      }
    });

    // Mettre à jour la moyenne de la pharmacie et du livreur (si fourni)
    // ... Logique asynchrone non-bloquante ou triggers bd pour la moyenne réelle

    res.json({ success: true, message: 'Évaluation enregistrée.', data: updated });
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

