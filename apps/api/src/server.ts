import 'dotenv/config';
import app from './app';
import connectDB from './config/db';
import env from './config/env';

const PORT = parseInt(env.PORT, 10);

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log('║        ✦ STYLEVERSE API SERVER ✦       ║');
      console.log('╠════════════════════════════════════════╣');
      console.log(`║  Environment: ${env.NODE_ENV.padEnd(24)}║`);
      console.log(`║  Port:        ${String(PORT).padEnd(24)}║`);
      console.log(`║  Base URL:    /api/v1${' '.repeat(18)}║`);
      console.log(`║  Client URL:  ${env.CLIENT_URL.padEnd(24)}║`);
      console.log('╚════════════════════════════════════════╝');
      console.log('');
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        const mongoose = await import('mongoose');
        await mongoose.default.connection.close();
        console.log('✅ Server and DB connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      console.error('❌ Unhandled Rejection:', err.message);
      server.close(() => process.exit(1));
    });

    // Uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      console.error('❌ Uncaught Exception:', err.message);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
