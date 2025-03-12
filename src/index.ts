import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
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

// Create Express app
const app = express();

// Configure CORS for Express
const corsOptions = {
  origin: true, // Allow any origin
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'accept',
    'authorization',
    'content-type',
    'x-copilotkit-runtime-client-gql-version',
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'sec-ch-ua-platform'
  ],
};

// Add CORS middleware first
app.use(cors(corsOptions));

// Create a router for the /copilotkit endpoint
const router = express.Router();

// Add Clerk middleware to the router
router.use(clerkMiddleware());
router.use(requireAuth());

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
  graphiql: false, // Disable GraphiQL in production
});

// Add the Yoga middleware last
router.use(runtimeMiddleware);

// Mount the router at /copilotkit
app.use('/copilotkit', router);

// Start server
app.listen(PORT, () => {
  console.log(`Copilot Runtime server listening at http://localhost:${PORT}/copilotkit`);
  console.log(process.env.REMOTE_URL);
}); 