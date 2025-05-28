import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';
import { getUserFromToken } from './utils/auth.js';

// Load environment variables
dotenv.config();

async function startServer() {
  // Create Express app and HTTP server
  const app = express();
  const httpServer = http.createServer(app);

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (error) => {
      // Log server-side errors
      console.error(error);
      return error;
    },
  });

  // Start the Apollo server
  await server.start();

  // Apply global middleware
  app.use(express.json()); // Express built-in JSON middleware
  
  // Set up the Apollo GraphQL endpoint with its middleware
  app.use(
    '/graphql',
    cors(),
    bodyParser.json(), // body-parser JSON middleware
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Get the user token from the headers
        const authHeader = req.headers.authorization || '';
        let token = null;
        
        // Extract token from Bearer format
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
        
        // Try to retrieve a user with the token
        let user = null;
        if (token) {
          try {
            user = await getUserFromToken(token);
            if (user) {
              console.log(`Authenticated user: ${user.email}`);
            }
          } catch (error) {
            console.error('Error authenticating user:', error);
          }
        }
        
        // Add the user and token info to the context
        return { 
          user,
          isAuthenticated: !!user,
          token
        };
      },
    }),
  );

  // Start the HTTP server
  const PORT = process.env.PORT || 4000;
  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
}

// Run the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
});
