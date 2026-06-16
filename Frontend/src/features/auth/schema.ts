import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
  mot_de_passe: z.string().min(1, 'Mot de passe requis'),
});

export type LoginForm = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
});

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const registerSchema = z
  .object({
    prenom: z.string().trim().min(1, 'Le prénom est requis'),
    nom: z.string().trim().min(1, 'Le nom est requis'),
    email: z.string().min(1, 'Email requis').email('Email invalide'),
    telephone: z
      .string()
      .trim()
      .min(8, 'Numéro de téléphone invalide'),
    sexe: z.enum(['M', 'F', 'AUTRE'], {
      message: 'Veuillez sélectionner votre sexe',
    }),
    mot_de_passe: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmation: z.string().min(1, 'Veuillez confirmer le mot de passe'),
  })
  .refine(data => data.mot_de_passe === data.confirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmation'],
  });

export type RegisterForm = z.infer<typeof registerSchema>;

export const resetPasswordSchema = z
  .object({
    mot_de_passe: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmation: z.string().min(1, 'Veuillez confirmer le mot de passe'),
  })
  .refine(data => data.mot_de_passe === data.confirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmation'],
  });

export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
