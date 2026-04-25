import dotenv from 'dotenv'
dotenv.config()

// PRODUCTION ENV VALIDATION
const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'OPENWEATHER_API_KEY'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
    console.error(`[FATAL] Missing required production environment variables: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') process.exit(1);
}
import express from 'express';
import cors from 'cors';
import mlRoutes from './routes/mlRoutes';
import simulateRoutes from './routes/simulateRoutes';
import { initAutoTrigger } from './services/autoTriggerService';

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());

// Registration of ML Routes as requested
app.use('/api/v1/ai', mlRoutes);
app.use('/api', simulateRoutes);

initAutoTrigger();

app.get('/', (req, res) => {
    res.json({
        message: 'GigKavacham Node.js Backend is running',
        version: '1.0.0',
        api_root: '/api/v1'
    });
});

const ML_BASE = process.env.VITE_ML_URL || 'http://localhost:5001';

const PORT = process.env.PORT || 3001;

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Global Error Handler]:', err);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Internal Server Error'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server listening on 0.0.0.0:${PORT}`);
});

export default app;
