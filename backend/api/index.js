import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import your existing server setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import and use your existing routes
// Note: You'll need to adapt your existing server/routes.ts for serverless
import('../server/routes.js').then(({ default: routes }) => {
  app.use('/api', routes);
});

export default app;
