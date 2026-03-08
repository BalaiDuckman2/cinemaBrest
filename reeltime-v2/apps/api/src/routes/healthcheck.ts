import { FastifyInstance } from 'fastify';

export async function healthcheckRoutes(app: FastifyInstance) {
  app.get('/healthcheck', async () => {
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  });
}
