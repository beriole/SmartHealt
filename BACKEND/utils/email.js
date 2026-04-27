const nodemailer = require('nodemailer');
const logger = require('./logger');

const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS_EMAIL,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const sendVerificationEmail = async (email, token, nom_utilisateur) => {
  try {
    const transporter = getTransporter();

    // URL de vérification : l'API elle-même ou un lien frontend qui tapera l'API
    // Vu que le frontend est pour l'instant vide, on peut pointer vers l'API directement pour simplifier
    const verificationUrl = `http://localhost:${process.env.PORT || 3000}/api/auth/verify-email/${token}`;

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME || 'SmartHealth'}" <${process.env.EMAIL}>`,
      to: email,
      subject: 'Vérification de votre compte SmartHealth',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bienvenue sur SmartHealth, ${nom_utilisateur} !</h2>
          <p>Merci de vous être inscrit sur notre plateforme. Pour finaliser la création de votre compte, veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Vérifier mon compte
            </a>
          </div>
          <p>Ou copiez et collez ce lien dans votre navigateur : <br> <a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>Ce lien expirera dans 24 heures.</p>
          <hr style="border-top: 1px solid #ddd;" />
          <p style="font-size: 12px; color: #888;">Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email de vérification envoyé à ${email} : ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Erreur détaillée email :", error);
    logger.error(`Erreur lors de l'envoi de l'email de vérification à ${email}: ${error.message}`);
    throw new Error(`Erreur email: ${error.message}`);
  }
};

const sendOrdonnanceNotification = async (email, nomPatient, signatureOrdonnance, dateExpiration, idOrdonnance) => {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME || 'SmartHealth'}" <${process.env.EMAIL}>`,
      to: email,
      subject: 'Nouvelle Ordonnance Médicale - SmartHealth',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <h2 style="color: #007bff;">Nouvelle Ordonnance Médicale</h2>
          <p>Bonjour <strong>${nomPatient}</strong>,</p>
          <p>Votre médecin vient de vous délivrer une nouvelle ordonnance électronique via SmartHealth.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Référence de l'ordonnance :</strong> ${idOrdonnance}</p>
            <p style="margin: 10px 0 0 0;"><strong>Valide jusqu'au :</strong> ${new Date(dateExpiration).toLocaleDateString('fr-FR')}</p>
          </div>

          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #b8daff;">
            <p style="margin: 0; font-size: 12px; color: #004085; word-break: break-all;">
              <strong>Signature Numérique Anti-Fraude :</strong><br/>
              ${signatureOrdonnance}
            </p>
          </div>

          <p>Vous pouvez consulter le détail de cette prescription et commander vos médicaments directement depuis votre espace patient SmartHealth.</p>
          <hr style="border-top: 1px solid #ddd; margin-top: 30px;" />
          <p style="font-size: 12px; color: #888; text-align: center;">Ce message est généré automatiquement par le système SmartHealth.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Notification d'ordonnance envoyée à ${email} : ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de la notification d'ordonnance à ${email}:`, error);
    // On ne jette pas l'erreur pour ne pas bloquer la transaction principale, 
    // mais on retourne false pour le savoir
    return false;
  }
};

const sendCommandeNotification = async (email, commande) => {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME || 'SmartHealth'}" <${process.env.EMAIL}>`,
      to: email,
      subject: 'Confirmation de Commande - SmartHealth',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <h2 style="color: #28a745;">Commande Confirmée !</h2>
          <p>Votre commande <strong>#${commande.id_commande}</strong> a bien été enregistrée par la pharmacie <strong>${commande.pharmacie.nom_pharmacie}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Montant Total :</strong> ${commande.montant_total_fcfa} FCFA</p>
            <p style="margin: 10px 0 0 0;"><strong>Mode de livraison :</strong> ${commande.type_livraison === 'livraison_domicile' ? 'Livraison à domicile' : 'Retrait en pharmacie'}</p>
          </div>

          <h3>Détail de vos médicaments :</h3>
          <ul>
            ${commande.lignes.map(l => `
              <li>${l.stock.medicament.nom_commercial} (x${l.quantite_commandee}) - ${l.sous_total_fcfa} FCFA</li>
            `).join('')}
          </ul>

          ${commande.photo_ordonnance_url ? `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeeba; margin-top: 20px;">
              <p style="margin: 0; color: #856404;"><strong>Note :</strong> Votre commande contient des médicaments sur ordonnance. Un pharmacien va vérifier la photo de votre ordonnance avant l'expédition.</p>
            </div>
          ` : ''}

          <p>Vous recevrez une nouvelle notification dès que votre commande sera prête.</p>
          <hr style="border-top: 1px solid #ddd; margin-top: 30px;" />
          <p style="font-size: 12px; color: #888; text-align: center;">SmartHealth - Votre santé, notre priorité.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Notification de commande envoyée à ${email} : ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de la notification de commande à ${email}:`, error);
    return false;
  }
};

const sendB2bValidationEmail = async (email, nomStructure, clientId, clientSecret) => {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME || 'SmartHealth B2B'}" <${process.env.EMAIL}>`,
      to: email,
      subject: 'Agrément SmartHealth B2B Validé - Vos Clés API',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <h2 style="color: #28a745;">Félicitations, ${nomStructure} !</h2>
          <p>Votre demande de partenariat avec la plateforme SmartHealth a été <strong>validée</strong>.</p>
          <p>Vous pouvez désormais interconnecter vos systèmes avec notre API B2B.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
            <p style="margin: 0; color: #dc3545;"><strong>ATTENTION : CONSERVEZ CES CLÉS EN SÉCURITÉ</strong></p>
            <p style="margin: 10px 0;">Le Client Secret ci-dessous n'est affiché qu'une seule fois. Si vous le perdez, vous devrez demander une nouvelle clé.</p>
            <p style="margin: 15px 0 5px 0;"><strong>Client ID :</strong> <code>${clientId}</code></p>
            <p style="margin: 0;"><strong>Client Secret :</strong> <code>${clientSecret}</code></p>
          </div>

          <p>L'URL de notre Gateway OAuth2 M2M est : <code>/api/b2b/oauth/token</code></p>
          <hr style="border-top: 1px solid #ddd; margin-top: 30px;" />
          <p style="font-size: 12px; color: #888; text-align: center;">SmartHealth B2B Security</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email de validation B2B envoyé à ${email} : ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de la validation B2B à ${email}:`, error);
    return false;
  }
};

const sendB2bRejectionEmail = async (email, nomStructure) => {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME || 'SmartHealth B2B'}" <${process.env.EMAIL}>`,
      to: email,
      subject: 'Mise à jour de votre demande d\'agrément SmartHealth',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc3545;">Mise à jour concernant votre dossier</h2>
          <p>Bonjour ${nomStructure},</p>
          <p>Après examen de vos documents légaux, nous avons le regret de vous informer que votre demande de partenariat B2B a été <strong>refusée</strong>.</p>
          <p>Si vous pensez qu'il s'agit d'une erreur ou s'il manquait des pièces justificatives, veuillez contacter notre support.</p>
          <hr style="border-top: 1px solid #ddd; margin-top: 30px;" />
          <p style="font-size: 12px; color: #888; text-align: center;">SmartHealth B2B Security</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email de refus B2B envoyé à ${email} : ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Erreur lors de l'envoi du refus B2B à ${email}:`, error);
    return false;
  }
};

const sendPinLivraisonEmail = async (email, nomPatient, codePin, commandeId) => {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME || 'SmartHealth Express'}" <${process.env.EMAIL}>`,
      to: email,
      subject: '📦 Votre commande est en route - Code PIN requis',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <h2 style="color: #17a2b8;">Votre livreur est en route !</h2>
          <p>Bonjour <strong>${nomPatient}</strong>,</p>
          <p>Un coursier vient de récupérer votre commande (Réf: ${commandeId.substring(0,8)}) à la pharmacie.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #555;">Votre Code de Sécurité (À remettre au livreur)</p>
            <h1 style="margin: 10px 0; font-size: 36px; letter-spacing: 5px; color: #343a40;">${codePin}</h1>
          </div>

          <p style="color: #dc3545; font-weight: bold;">Attention : Ne communiquez ce code au livreur QUE lorsqu'il vous a physiquement remis le colis.</p>
          <p>Ce code garantit que vos médicaments ne peuvent pas être volés.</p>
          <hr style="border-top: 1px solid #ddd; margin-top: 30px;" />
          <p style="font-size: 12px; color: #888; text-align: center;">L'équipe Logistique SmartHealth</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email Code PIN envoyé à ${email} : ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Erreur lors de l'envoi du PIN à ${email}:`, error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendOrdonnanceNotification,
  sendCommandeNotification,
  sendB2bValidationEmail,
  sendB2bRejectionEmail,
  sendPinLivraisonEmail,
};
