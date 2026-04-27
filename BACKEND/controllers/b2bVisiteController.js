const { NotFoundError, UnauthorizedError, ValidationError } = require('../errors/AppError');
const { prisma } = require('../services/database');
const crypto = require('crypto');

exports.creerVisiteComposite = async (req, res, next) => {
  try {
    const { 
      numero_carnet, 
      pin_code, 
      nom_medecin_externe, 
      motif, 
      diagnostic, 
      observations,
      ordonnance 
    } = req.body;

    const id_partenaire = req.partenaire.id_partenaire;

    if (!numero_carnet || !pin_code || !nom_medecin_externe || !motif) {
      throw new ValidationError('numero_carnet, pin_code, nom_medecin_externe et motif sont obligatoires.');
    }

    // 1. Vérification du Patient
    const patient = await prisma.patient.findUnique({
      where: { numero_carnet },
      include: { carnet: true }
    });

    if (!patient || !patient.carnet) {
      throw new NotFoundError('Patient ou Carnet');
    }

    // 2. Vérification du PIN
    const pin = await prisma.pinConsentement.findFirst({
      where: {
        id_patient: patient.id_patient,
        code_pin: pin_code,
        est_actif: true,
        date_expiration: { gt: new Date() }
      }
    });

    if (!pin) {
      throw new UnauthorizedError('Code PIN invalide, expiré ou déjà utilisé.');
    }

    // 3. Transaction Atomique (Création Consultation + Ordonnance + Désactivation PIN)
    const result = await prisma.$transaction(async (tx) => {
      // Brûler le PIN
      await tx.pinConsentement.update({
        where: { id_pin: pin.id_pin },
        data: { est_actif: false }
      });

      // Créer la Consultation
      const consultation = await tx.consultation.create({
        data: {
          id_patient: patient.id_patient,
          id_carnet: patient.carnet.id_carnet,
          date_consultation: new Date(),
          motif,
          diagnostic,
          observations,
          type_consultation: 'presentiel',
          statut: 'effectuee',
          source_creation: 'b2b_api',
          id_partenaire_source: id_partenaire,
          nom_medecin_externe
        }
      });

      // Créer l'Ordonnance si fournie
      let nouvelleOrdonnance = null;
      if (ordonnance && ordonnance.lignes && ordonnance.lignes.length > 0) {
        
        // Génération d'une signature numérique "anti-fraude" pour le B2B
        const signatureBase = `${consultation.id_consultation}-${Date.now()}-${id_partenaire}`;
        const signature_numerique = crypto.createHash('sha256').update(signatureBase).digest('hex');

        nouvelleOrdonnance = await tx.ordonnance.create({
          data: {
            id_consultation: consultation.id_consultation,
            id_patient: patient.id_patient,
            date_expiration: new Date(ordonnance.date_expiration || Date.now() + 30 * 24 * 60 * 60 * 1000), // Défaut 30 jours
            signature_numerique,
            statut: 'active',
            source_creation: 'b2b_api',
            id_partenaire_source: id_partenaire,
            nom_medecin_externe,
            lignes: {
              create: ordonnance.lignes.map(l => ({
                id_medicament: l.id_medicament,
                quantite: l.quantite,
                duree_traitement_jours: l.duree_traitement_jours,
                posologie: l.posologie
              }))
            }
          },
          include: { lignes: true }
        });
      }

      return { consultation, ordonnance: nouvelleOrdonnance };
    });

    res.status(201).json({
      success: true,
      message: 'Visite médicale enregistrée avec succès dans le dossier du patient.',
      data: result
    });

  } catch (error) {
    next(error);
  }
};
