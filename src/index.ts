import express from 'express';
import { config } from 'dotenv';
import {
  CopilotRequestContextProperties,
  CopilotRuntime,
  CreateCopilotRuntimeServerOptions,
  ExperimentalEmptyAdapter,
  getCommonConfig
} from '@copilotkit/runtime';
import { 
  createYoga, YogaInitialContext } from 'graphql-yoga';
import { createAuthContext } from './create-auth-context.js'
import { clerkMiddleware, requireAuth } from '@clerk/express';

// Load environment variables
config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const REMOTE_URL = process.env.REMOTE_URL || 'https://your-remote-endpoint.com';

// Get environment variables with type safety

// Create Express app
const app = express();

// Add Clerk middleware globally
app.use(clerkMiddleware());

// Create service adapter
const serviceAdapter = new ExperimentalEmptyAdapter();

// Create runtime instance
const runtime = new CopilotRuntime({
  remoteEndpoints: [
    { url: REMOTE_URL },
  ],
  middleware: {
    onBeforeRequest: (options) => {
      
      console.log(options)
    }
  }
});

const properties: CopilotRequestContextProperties = {}
const options: CreateCopilotRuntimeServerOptions = {
  endpoint: '/copilotkit',
  properties,
  runtime,
  serviceAdapter,
}

const commonConfig = getCommonConfig(options)
commonConfig.context = (ctx: YogaInitialContext) => createAuthContext(ctx, options, commonConfig.logging, properties)

// Create the handler function
const runtimeMiddleware = createYoga({
  ...commonConfig,
  graphqlEndpoint: '/copilotkit',
});

// Apply the handler as Express middleware with Clerk authentication
app.use('/copilotkit', requireAuth(), runtimeMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`Copilot Runtime server listening at http://localhost:${PORT}/copilotkit`);
  console.log(process.env.REMOTE_URL);
}); 