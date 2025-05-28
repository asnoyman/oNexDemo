import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { UserResolver } from './graphql/resolvers/UserResolver';
import { AuthResolver } from './graphql/resolvers/AuthResolver';
import { pool } from './db/db';
import { authMiddleware } from './middleware/auth';
import { createContext } from './graphql/context';

async function bootstrap() {
  // Create Express server
  const app = express();
  
  // Configure CORS for Apollo Studio and local development
  const corsOptions = {
    origin: ['http://localhost:3000', 'https://studio.apollographql.com'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Apollo-Require-Preflight']
  };
  
  // Apply middleware
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(authMiddleware);
  
  // Build GraphQL schema
  const schema = await buildSchema({
    resolvers: [UserResolver, AuthResolver],
    emitSchemaFile: true,
    validate: false,
  });
  
  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    context: ({ req, res }: any) => createContext({ req, res }),
  });
  
  // Start Apollo Server
  await server.start();
  
  // Apply middleware to Express with type casting to avoid compatibility issues
  server.applyMiddleware({ 
    app: app as any, // Use explicit 'any' type to bypass type checking issues
    cors: false // Disable Apollo's CORS handling as we're using the cors package
  });
  
  // Define port
  const PORT = process.env.PORT || 4000;
  
  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🔍 GraphQL Playground available at http://localhost:${PORT}${server.graphqlPath}`);
  });
  
  // Handle shutdown
  const shutdown = async () => {
    console.log('Shutting down server...');
    await pool.end();
    process.exit(0);
  };
  
  // Handle graceful shutdown
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Start the server
bootstrap().catch(err => {
  console.error('Error starting server:', err);
});
