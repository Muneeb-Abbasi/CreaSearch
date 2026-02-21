import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { apiRateLimit } from "./middleware/rateLimit";
import { logger } from "./utils/logger";

const app = express();

// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'https://creasearch.com', 'https://www.creasearch.com'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    if (allowedOrigins.some(allowed => origin === allowed || origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Apply rate limiting to API routes
app.use('/api', apiRateLimit);

// Health check endpoint (required for Railway)
app.get('/health', (_, res) => res.send('ok'));

// Request logging with secure logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

(async () => {
  const httpServer = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    logger.error('Request error', { status, message, stack: err.stack });
    res.status(status).json({ message });
  });

  // 404 handler for unknown routes
  app.use('*', (req, res) => {
    res.status(404).json({ message: "Not Found" });
  });

  const port = parseInt(process.env.PORT || '5000', 10);
  httpServer.listen({
    port,
    host: "0.0.0.0",
  }, async () => {
    logger.info(`Backend server running on port ${port}`);

    // Initialize cron jobs for background verification updates
    try {
      const { initializeCronJobs } = await import('./services/cron');
      initializeCronJobs();
    } catch (error) {
      logger.error('Failed to initialize cron jobs', { error });
    }
  });
})();
