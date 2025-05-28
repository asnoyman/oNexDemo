import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { UserResolver } from './graphql/resolvers/UserResolver';
import { pool } from './db/db';

async function bootstrap() {
  // Create Express server
  const app = express();
  
  // Build GraphQL schema
  const schema = await buildSchema({
    resolvers: [UserResolver],
    emitSchemaFile: true,
    validate: false,
  });
  
  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res }),
  });
  
  // Start Apollo Server
  await server.start();
  
  // Apply middleware to Express
  server.applyMiddleware({ app: app as any });
  
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
