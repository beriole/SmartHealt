const { prisma } = require('./database');
const { generateRefreshToken, hashToken } = require('../utils/helpers');

// Durée de vie du refresh token (en jours).
const REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_EXPIRES_DAYS || 30);

class RefreshTokenService {
  /**
   * Émet un nouveau refresh token pour un utilisateur et stocke son hash.
   * Retourne la valeur en clair (à renvoyer au client une seule fois).
   */
  async issue(id_utilisateur, meta = {}) {
    const token = generateRefreshToken();
    const expire_le = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        id_utilisateur,
        token_hash: hashToken(token),
        expire_le,
        user_agent: meta.userAgent ? String(meta.userAgent).slice(0, 255) : null,
      },
    });

    return token;
  }

  /**
   * Effectue la rotation d'un refresh token : valide l'ancien, le révoque,
   * et en émet un nouveau. Détecte la réutilisation d'un token déjà révoqué
   * (signe de vol) et révoque alors toute la famille de l'utilisateur.
   *
   * Retourne { id_utilisateur, token } en cas de succès, sinon { error }.
   */
  async rotate(presentedToken, meta = {}) {
    const token_hash = hashToken(presentedToken);
    const existing = await prisma.refreshToken.findUnique({ where: { token_hash } });

    if (!existing) return { error: 'invalid' };

    if (existing.revoque) {
      // Token déjà utilisé/révoqué présenté à nouveau → réutilisation suspecte.
      await this.revokeAllForUser(existing.id_utilisateur);
      return { error: 'reuse' };
    }

    if (existing.expire_le < new Date()) {
      return { error: 'expired' };
    }

    await prisma.refreshToken.update({
      where: { id_token: existing.id_token },
      data: { revoque: true },
    });

    const token = await this.issue(existing.id_utilisateur, meta);
    return { id_utilisateur: existing.id_utilisateur, token };
  }

  /** Révoque un refresh token précis (déconnexion). */
  async revoke(presentedToken) {
    const token_hash = hashToken(presentedToken);
    await prisma.refreshToken.updateMany({
      where: { token_hash, revoque: false },
      data: { revoque: true },
    });
  }

  /** Révoque tous les refresh tokens actifs d'un utilisateur. */
  async revokeAllForUser(id_utilisateur) {
    await prisma.refreshToken.updateMany({
      where: { id_utilisateur, revoque: false },
      data: { revoque: true },
    });
  }
}

module.exports = new RefreshTokenService();
