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
const allowedOrigins = env.frontendUrl.split(',').map((s) => s.trim()).filter(Boolean);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
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
