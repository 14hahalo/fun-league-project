import express, { Application } from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// CORS - React frontend'den gelen isteklere izin ver
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (en sonda olmalı)
app.use(errorHandler);

export default app;