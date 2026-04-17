import { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import helmetMiddleware from 'helmet';
import { existsSync } from 'node:fs';
import sirv from 'sirv';
import { IMMICH_SERVER_START, excludePaths, serverVersion } from 'src/constants';
import { MaintenanceWorkerService } from 'src/maintenance/maintenance-worker.service';
import { WebSocketAdapter } from 'src/middleware/websocket.adapter';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { bootstrapTelemetry } from 'src/repositories/telemetry.repository';
import { ApiService } from 'src/services/api.service';
import { useSwagger } from 'src/utils/misc';

export function configureTelemetry() {
  const { telemetry } = new ConfigRepository().getEnv();
  if (telemetry.metrics.size > 0) {
    bootstrapTelemetry(telemetry.apiPort);
  }
}

const SUSPENSION_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Account Suspended – PrivoHub Photos</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8f8f8;
      color: #222;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,.08);
      max-width: 480px;
      width: 100%;
      padding: 48px 40px;
      text-align: center;
    }
    h1 { font-size: 1.5rem; font-weight: 700; color: #b91c1c; margin-bottom: 12px; }
    p  { color: #555; line-height: 1.6; margin-bottom: 12px; }
    a  {
      display: inline-block;
      margin-top: 24px;
      padding: 12px 28px;
      background: #2563eb;
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
    }
    a:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Your PrivoHub Photos account is suspended</h1>
    <p>Your storage quota has been exceeded or a payment is overdue.</p>
    <p>Please visit the management portal to resolve this before your photos become inaccessible.</p>
    <a href="https://privohub.com/portal">Manage my account</a>
  </div>
</body>
</html>`;

export async function configureExpress(
  app: NestExpressApplication,
  {
    permitSwaggerWrite = true,
    ssr,
  }: {
    /**
     * Whether to allow swagger module to write to the specs.json
     * This is not desirable when the API is not available
     * @default true
     */
    permitSwaggerWrite?: boolean;
    /**
     * Service to use for server-side rendering
     */
    ssr: typeof ApiService | typeof MaintenanceWorkerService;
  },
) {
  const configRepository = app.get(ConfigRepository);
  const { environment, host, port, helmet, resourcePaths, network } = configRepository.getEnv();

  if (process.env.PRIVOHUB_SUSPENDED === 'true') {
    app.use((_req: Request, res: Response) => {
      res.status(402).send(SUSPENSION_HTML);
    });
  }

  const logger = await app.resolve(LoggingRepository);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  app.set('trust proxy', ['loopback', ...network.trustedProxies]);
  app.set('etag', 'strong');

  if (helmet.config) {
    app.use(helmetMiddleware(helmet.config));
    logger.log('Initialized helmet middleware');
  }

  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));

  if (configRepository.isDev()) {
    app.enableCors();
  }

  app.setGlobalPrefix('api', { exclude: excludePaths });
  app.useWebSocketAdapter(new WebSocketAdapter(app));

  useSwagger(app, { write: configRepository.isDev() && permitSwaggerWrite });

  if (existsSync(resourcePaths.web.root)) {
    // copied from https://github.com/sveltejs/kit/blob/679b5989fe62e3964b9a73b712d7b41831aa1f07/packages/adapter-node/src/handler.js#L46
    // provides serving of precompressed assets and caching of immutable assets
    app.use(
      sirv(resourcePaths.web.root, {
        etag: true,
        gzip: true,
        brotli: true,
        extensions: [],
        setHeaders: (res, pathname) => {
          if (pathname.startsWith(`/_app/immutable`) && res.statusCode === 200) {
            res.setHeader('cache-control', 'public,max-age=31536000,immutable');
          }
        },
      }),
    );
  }

  app.use(app.get(ssr).ssr(excludePaths));
  app.use(compression());

  const server = await (host ? app.listen(port, host) : app.listen(port));
  server.requestTimeout = 24 * 60 * 60 * 1000;

  logger.log(`${IMMICH_SERVER_START} on ${await app.getUrl()} [v${serverVersion}] [${environment}] `);
}
