const { NotFoundError, ForbiddenError, ValidationError, ConflictError } = require('../errors/AppError');
const { prisma } = require('../services/database');
const { sendCommandeNotification, sendPinLivraisonEmail } = require('../utils/email');
const { logAction } = require('../services/auditService');
const fapshiService = require('../services/fapshiService');

// Enregistre un mouvement de stock dans la transaction courante (traçabilité)
async function tracerMouvement(tx, { id_stock, type_mouvement, quantite, quantite_avant, motif, id_utilisateur }) {
  const direction = ['sortie', 'vente', 'peremption'].includes(type_mouvement) ? -1 : 1;
  await tx.mouvementStock.create({
    data: {
      id_stock,
      type_mouvement,
      quantite,
      quantite_avant,
      quantite_apres: quantite_avant + direction * quantite,
      motif,
      id_utilisateur,
    },
  });
}
exports.tracerMouvement = tracerMouvement;

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, id_patient, id_pharmacie, statut_commande } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (id_patient) where.id_patient = id_patient;
    if (id_pharmacie) where.id_pharmacie = id_pharmacie;
    if (statut_commande) where.statut_commande = statut_commande;

    // Cloisonnement par rôle : chacun ne voit que ses commandes
    if (req.user.type === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { id_utilisateur: req.user.id } });
      where.id_patient = patient ? patient.id_patient : '__aucun__';
    } else if (req.user.type === 'PHARMACIEN') {
      const pharmacies = await prisma.pharmacie.findMany({ where: { id_responsable: req.user.id }, select: { id_pharmacie: true } });
      where.id_pharmacie = { in: pharmacies.map(p => p.id_pharmacie) };
    } else if (req.user.type === 'LIVREUR') {
      const livreur = await prisma.livreur.findUnique({ where: { id_utilisateur: req.user.id } });
      where.id_livreur = livreur ? livreur.id_livreur : '__aucun__';
    }

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
    // Whitelist explicite : seuls ces champs sont acceptés du client.
    // Le montant, le statut et le paiement sont calculés côté serveur.
    const {
      lignes, type_livraison, id_pharmacie, photo_ordonnance_url,
      adresse_livraison, latitude_livraison, longitude_livraison, mode_paiement,
    } = req.body;
    const commandeData = { adresse_livraison, latitude_livraison, longitude_livraison, mode_paiement };

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

        // Décrémentation du stock + traçabilité du mouvement
        await tx.stockPharmacie.update({
          where: { id_stock: ligne.id_stock },
          data: { quantite_disponible: { decrement: ligne.quantite_commandee } }
        });
        await tracerMouvement(tx, {
          id_stock: ligne.id_stock,
          type_mouvement: 'vente',
          quantite: ligne.quantite_commandee,
          quantite_avant: stock.quantite_disponible,
          motif: `Commande ${commande.id_commande}`,
          id_utilisateur: req.user.id,
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
        await tracerMouvement(tx, {
          id_stock: stock.id_stock,
          type_mouvement: 'vente',
          quantite: ligneOrd.quantite,
          quantite_avant: stock.quantite_disponible,
          motif: `Commande ${commande.id_commande} (ordonnance ${id_ordonnance})`,
          id_utilisateur: req.user.id,
        });

        // Traitement de l'ordonnance : la ligne est servie par cette pharmacie
        await tx.ligneOrdonnance.update({
          where: { id_ligne: ligneOrd.id_ligne },
          data: { servi: true },
        });
      }

      // Mise à jour du statut de l'ordonnance (servie / partiellement servie)
      const lignesRestantes = await tx.ligneOrdonnance.count({
        where: { id_ordonnance, servi: false },
      });
      await tx.ordonnance.update({
        where: { id_ordonnance },
        data: { statut: lignesRestantes === 0 ? 'servie' : 'partiellement_servie' },
      });

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
        throw new ForbiddenError('Impossible de préparer cette commande : le paiement n\'est pas finalisé.');
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

    // Restitution des stocks atomique + traçabilité
    await prisma.$transaction(async (tx) => {
      for (const ligne of commande.lignes) {
        const stock = await tx.stockPharmacie.update({
          where: { id_stock: ligne.id_stock },
          data: { quantite_disponible: { increment: ligne.quantite_commandee } }
        });
        await tracerMouvement(tx, {
          id_stock: ligne.id_stock,
          type_mouvement: 'retour',
          quantite: ligne.quantite_commandee,
          quantite_avant: stock.quantite_disponible - ligne.quantite_commandee,
          motif: `Annulation commande ${id}`,
          id_utilisateur: req.user.id,
        });
      }

      await tx.commande.update({
        where: { id_commande: id },
        data: { statut_commande: 'annulee' }
      });
    });

    logAction({ id_utilisateur: req.user.id, action: 'ANNULATION_COMMANDE', ressource: 'commande', id_ressource: id, req });

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

    // Seul le livreur assigné à CETTE commande (ou le patient destinataire, ou un admin)
    // peut la valider — un autre livreur ne doit pas pouvoir clôturer la course.
    if (req.user.type === 'LIVREUR') {
      const livreurConnecte = await prisma.livreur.findUnique({ where: { id_utilisateur: req.user.id } });
      if (!livreurConnecte || commande.id_livreur !== livreurConnecte.id_livreur) {
        throw new ForbiddenError('Vous n\'êtes pas le livreur assigné à cette commande.');
      }
    } else if (req.user.type === 'PATIENT') {
      const patientConnecte = await prisma.patient.findUnique({ where: { id_utilisateur: req.user.id } });
      if (!patientConnecte || commande.id_patient !== patientConnecte.id_patient) {
        throw new ForbiddenError('Cette commande ne vous appartient pas.');
      }
    }

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

/**
 * Attribution automatique d'un livreur : choisit le livreur vérifié et disponible
 * le plus proche de la pharmacie (distance de Haversine).
 * Déclenchée par la pharmacie ou un admin quand la commande est "preparee".
 */
exports.attribuerLivreurAuto = async (req, res, next) => {
  try {
    const { id } = req.params;

    const commande = await prisma.commande.findUnique({
      where: { id_commande: id },
      include: {
        pharmacie: true,
        patient: { include: { utilisateur: true } },
      },
    });

    if (!commande) throw new NotFoundError('Commande');
    if (req.user.type !== 'ADMIN' && commande.pharmacie.id_responsable !== req.user.id) {
      throw new ForbiddenError('Seule la pharmacie en charge peut attribuer un livreur.');
    }
    if (commande.statut_commande !== 'preparee') throw new ValidationError('La commande doit être préparée avant l\'attribution.');
    if (commande.id_livreur) throw new ConflictError('Un livreur est déjà assigné à cette commande.');
    if (commande.type_livraison !== 'livraison_domicile') throw new ValidationError('Cette commande est en retrait en pharmacie.');

    const livreursDisponibles = await prisma.livreur.findMany({
      where: {
        disponible: true,
        statut_verification: 'verifie',
        utilisateur: { statut_compte: 'actif' },
      },
    });

    if (livreursDisponibles.length === 0) {
      return res.status(404).json({ success: false, message: 'Aucun livreur vérifié et disponible actuellement.' });
    }

    // Distance de Haversine (km) entre la pharmacie et la dernière position connue du livreur
    const haversine = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    };

    const classes = livreursDisponibles
      .map(l => ({
        livreur: l,
        distance_km: (l.latitude_actuelle != null && l.longitude_actuelle != null)
          ? haversine(commande.pharmacie.latitude, commande.pharmacie.longitude, l.latitude_actuelle, l.longitude_actuelle)
          : Number.MAX_SAFE_INTEGER, // sans position connue → dernier recours
      }))
      .sort((a, b) => a.distance_km - b.distance_km);

    const choisi = classes[0].livreur;
    const pinStr = Math.floor(1000 + Math.random() * 9000).toString();

    const updateLock = await prisma.commande.updateMany({
      where: { id_commande: id, id_livreur: null, statut_commande: 'preparee' },
      data: {
        id_livreur: choisi.id_livreur,
        statut_commande: 'en_livraison',
        code_validation_livraison: pinStr,
      },
    });

    if (updateLock.count === 0) {
      throw new ConflictError('La commande a changé d\'état pendant l\'attribution. Réessayez.');
    }

    if (commande.patient?.utilisateur?.email) {
      sendPinLivraisonEmail(
        commande.patient.utilisateur.email,
        `${commande.patient.utilisateur.prenom} ${commande.patient.utilisateur.nom}`,
        pinStr,
        commande.id_commande
      );
    }

    logAction({ id_utilisateur: req.user.id, action: 'ATTRIBUTION_AUTO_LIVREUR', ressource: 'commande', id_ressource: id, details: { id_livreur: choisi.id_livreur }, req });

    res.json({
      success: true,
      message: 'Livreur attribué automatiquement (le plus proche de la pharmacie).',
      data: {
        id_commande: id,
        id_livreur: choisi.id_livreur,
        distance_km: classes[0].distance_km === Number.MAX_SAFE_INTEGER ? null : Number(classes[0].distance_km.toFixed(2)),
      },
    });
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

    // Recalcul des notes moyennes (pharmacie et livreur)
    if (note_pharmacie != null) {
      const aggPharma = await prisma.commande.aggregate({
        where: { id_pharmacie: commande.id_pharmacie, note_pharmacie: { not: null } },
        _avg: { note_pharmacie: true },
      });
      await prisma.pharmacie.update({
        where: { id_pharmacie: commande.id_pharmacie },
        data: { note_moyenne: aggPharma._avg.note_pharmacie || 0 },
      });
    }
    if (note_livraison != null && commande.id_livreur) {
      const aggLivreur = await prisma.commande.aggregate({
        where: { id_livreur: commande.id_livreur, note_livraison: { not: null } },
        _avg: { note_livraison: true },
      });
      await prisma.livreur.update({
        where: { id_livreur: commande.id_livreur },
        data: { note_moyenne: aggLivreur._avg.note_livraison || 0 },
      });
    }

    res.json({ success: true, message: 'Évaluation enregistrée.', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Initie un paiement Mobile Money via Fapshi (Direct Pay) : une demande de
 * paiement est poussée directement sur le téléphone du client. Le statut final
 * est ensuite obtenu par polling (/payment-status) ou par webhook.
 */
exports.initiatePayment = async (req, res, next) => {
  try {
    if (!fapshiService.isConfigured()) {
      return res.status(503).json({ success: false, message: 'Le module de paiement Fapshi n\'est pas configuré.' });
    }

    const { phone, medium } = req.body;
    if (!phone) throw new ValidationError('Le numéro de téléphone Mobile Money est requis.');

    const commande = await prisma.commande.findUnique({
      where: { id_commande: req.params.id },
      include: { patient: { include: { utilisateur: true } } }
    });

    if (!commande) throw new NotFoundError('Commande');

    // Seul le patient propriétaire peut payer sa commande
    if (req.user.type === 'PATIENT' && commande.patient.id_utilisateur !== req.user.id) {
      throw new ForbiddenError('Cette commande ne vous appartient pas.');
    }

    if (commande.statut_paiement === 'paye') {
      return res.status(400).json({ success: false, message: 'Cette commande est déjà payée.' });
    }

    const u = commande.patient.utilisateur;
    const result = await fapshiService.directPay({
      amount: Number(commande.montant_total_fcfa),
      phone,
      medium,
      name: `${u.prenom} ${u.nom}`,
      email: u.email || undefined,
      externalId: commande.id_commande,
      message: `Commande SmartHealth #${commande.id_commande.substring(0, 8)}`,
    });

    await prisma.commande.update({
      where: { id_commande: commande.id_commande },
      data: { reference_paiement: result.transId, mode_paiement: 'mobile_money' },
    });

    logAction({ id_utilisateur: req.user.id, action: 'INITIATION_PAIEMENT', ressource: 'commande', id_ressource: commande.id_commande, details: { transId: result.transId }, req });

    res.json({
      success: true,
      message: 'Paiement initié. Validez la demande reçue sur votre téléphone.',
      data: { transId: result.transId, statut_paiement: 'en_attente' },
    });
  } catch (error) {
    if (error.response?.data) {
      console.error('Erreur API Fapshi (direct-pay):', error.response.data);
      return next(new ValidationError(error.response.data.message || 'Échec de l\'initiation du paiement.'));
    }
    next(error);
  }
};

/**
 * Vérifie l'état d'un paiement Fapshi pour une commande (polling depuis le client)
 * et synchronise le statut de paiement en base.
 */
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id_commande: req.params.id },
    });
    if (!commande) throw new NotFoundError('Commande');

    if (req.user.type === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { id_utilisateur: req.user.id } });
      if (!patient || commande.id_patient !== patient.id_patient) {
        throw new ForbiddenError('Cette commande ne vous appartient pas.');
      }
    }

    if (!commande.reference_paiement) {
      return res.json({ success: true, data: { statut_paiement: commande.statut_paiement, status: null } });
    }

    const status = await fapshiService.getStatus(commande.reference_paiement);
    const statut_paiement = fapshiService.mapStatut(status.status);

    if (statut_paiement !== commande.statut_paiement) {
      await prisma.commande.update({
        where: { id_commande: commande.id_commande },
        data: { statut_paiement },
      });
    }

    res.json({ success: true, data: { statut_paiement, status: status.status } });
  } catch (error) {
    if (error.response?.data) {
      return next(new ValidationError(error.response.data.message || 'Impossible de vérifier le paiement.'));
    }
    next(error);
  }
};

/**
 * Webhook Fapshi : reçu quand un paiement passe à SUCCESSFUL/FAILED/EXPIRED.
 * Le payload reprend la structure de /payment-status. Authentifié par l'en-tête x-wh-secret.
 */
exports.webhookFapshi = async (req, res) => {
  try {
    const secret = process.env.FAPSHI_WEBHOOK_SECRET;
    if (secret && req.headers['x-wh-secret'] !== secret) {
      return res.status(401).send('Signature invalide');
    }

    const event = req.body;
    if (event && event.transId && event.status) {
      const statut_paiement = fapshiService.mapStatut(event.status);
      // externalId = id_commande (prioritaire), sinon ciblage par reference_paiement
      const where = event.externalId
        ? { id_commande: event.externalId }
        : { reference_paiement: event.transId };
      await prisma.commande.updateMany({ where, data: { statut_paiement } });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Erreur webhook Fapshi:', error);
    res.status(500).send('Erreur interne webhook');
  }
};

