import * as userRepository from '../repositories/userRepository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwtUtils.js';
import type { RegisterInput, LoginInput } from '../schemas/authSchema.js';

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) {
    throw new AuthError(
      'EMAIL_ALREADY_EXISTS',
      'Un compte existe deja avec cet email',
    );
  }

  const passwordHash = await hashPassword(input.password);

  const user = await userRepository.create({
    email: input.email,
    passwordHash,
    name: input.name,
  });

  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
  });
  const refreshToken = generateRefreshToken({ userId: user.id });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await userRepository.findByEmail(input.email);
  if (!user) {
    throw new AuthError(
      'INVALID_CREDENTIALS',
      'Email ou mot de passe incorrect',
    );
  }

  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new AuthError(
      'INVALID_CREDENTIALS',
      'Email ou mot de passe incorrect',
    );
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
  });
  const refreshToken = generateRefreshToken({ userId: user.id });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
  };
}

export async function deleteAccount(userId: string): Promise<void> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AuthError('NOT_FOUND', 'Utilisateur introuvable');
  }
  await userRepository.deleteWithCascade(userId);
}

export async function refresh(
  token: string,
): Promise<{ accessToken: string }> {
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AuthError(
      'TOKEN_EXPIRED',
      'Le token de rafraichissement est expire ou invalide',
    );
  }

  const user = await userRepository.findById(payload.userId);
  if (!user) {
    throw new AuthError('TOKEN_EXPIRED', 'Utilisateur introuvable');
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
  });

  return { accessToken };
}
