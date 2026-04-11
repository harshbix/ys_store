import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestContext, morganRequestIdToken } from './middleware/requestContext.js';

const app = express();
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'https://frontend-tau-bay-36.vercel.app',
  'https://frontend-junior-jeconias-projects.vercel.app',
  'https://frontend-harshbix-junior-jeconias-projects.vercel.app'
];

function normalizeOrigin(value) {
  return String(value || '').trim().replace(/\/+$/, '').toLowerCase();
}

function expandLoopbackVariants(origin) {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return [];

  try {
    const url = new URL(normalized);
    if (url.hostname === 'localhost') {
      const loopback = `${url.protocol}//127.0.0.1${url.port ? `:${url.port}` : ''}`;
      return [normalized, loopback];
    }

    if (url.hostname === '127.0.0.1') {
      const localhost = `${url.protocol}//localhost${url.port ? `:${url.port}` : ''}`;
      return [normalized, localhost];
    }
  } catch {
    return [normalized];
  }

  return [normalized];
}

const configuredOrigins = env.frontendUrl
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .flatMap(expandLoopbackVariants);

const allowedOrigins = new Set([...defaultAllowedOrigins, ...configuredOrigins].map(normalizeOrigin));
const useCredentialedCors = true;

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(normalizeOrigin(origin))) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: useCredentialedCors
}));
app.use(requestContext);
morgan.token('request-id', morganRequestIdToken);
app.use(morgan(':method :url :status :response-time ms req_id=:request-id'));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'healthy' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'healthy', request_id: req.requestId || null });
});

app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
