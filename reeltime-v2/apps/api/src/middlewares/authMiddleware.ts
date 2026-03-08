import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../utils/jwtUtils.js';
import { prisma } from '../lib/prisma.js';

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: "Token d'authentification requis",
      },
    });
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyAccessToken(token);
    request.user = { userId: payload.userId, email: payload.email };
  } catch {
    return reply.status(401).send({
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token expire ou invalide',
      },
    });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // requireAuth must run first (sets request.user)
  await requireAuth(request, reply);
  if (reply.sent) return;

  const user = await prisma.user.findUnique({
    where: { id: request.user!.userId },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return reply.status(403).send({
      error: {
        code: 'FORBIDDEN',
        message: 'Accès réservé aux administrateurs',
      },
    });
  }

  request.user!.isAdmin = true;
}
