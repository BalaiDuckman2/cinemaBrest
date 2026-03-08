import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function requestLoggerPlugin(fastify: FastifyInstance) {
  fastify.addHook('onResponse', (request, reply, done) => {
    // Skip /metrics to reduce log noise
    if (request.url === '/metrics') {
      done();
      return;
    }

    const duration = Math.round(reply.elapsedTime);

    request.log.info(
      {
        method: request.method,
        path: request.url,
        statusCode: reply.statusCode,
        duration,
        userId: request.user?.userId,
      },
      'request completed',
    );

    done();
  });

  fastify.addHook('onError', (request, _reply, error, done) => {
    request.log.error(
      {
        method: request.method,
        path: request.url,
        userId: request.user?.userId,
        err: error,
      },
      'request error',
    );
    done();
  });
}

export default fp(requestLoggerPlugin, { name: 'request-logger' });
