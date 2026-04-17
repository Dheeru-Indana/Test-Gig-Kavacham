import dotenv from 'dotenv'
dotenv.config()
import express from 'express';
import cors from 'cors';
import mlRoutes from './routes/mlRoutes';
import simulateRoutes from './routes/simulateRoutes';
import { initAutoTrigger } from './services/autoTriggerService';

const app = express();
app.use(cors());
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});

export default app;
