const nodemailer = require('nodemailer');
const logger = require('./logger');

const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS_EMAIL,
    },
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
    logger.error(`Erreur lors de l'envoi de l'email de vérification à ${email}:`, error);
    throw new Error("Erreur de l'envoi du mail de vérification.");
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

module.exports = {
  sendVerificationEmail,
  sendOrdonnanceNotification,
};
