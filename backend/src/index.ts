
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import routes from './routes';
import { connectDB } from './db';

const app = express();

// Basic security
app.use(helmet());

// Simple CORS setup
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging in development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Test endpoint
app.get('/api/v1/test', (req, res) => {
    res.json({ message: 'Backend working', timestamp: new Date().toISOString() });
});



// Routes
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
const startServer = async () => {
    try {
        await connectDB();
        
        app.listen(config.port, () => {
            console.log(`🚀 Server is successfully running on port ${config.port}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        process.exit(1);
    }
};

startServer();
