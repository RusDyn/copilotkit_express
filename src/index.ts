import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import {
  CopilotRequestContextProperties,
  CopilotRuntime,
  CreateCopilotRuntimeServerOptions,
  ExperimentalEmptyAdapter,
  getCommonConfig,
} from '@copilotkit/runtime';
import { createYoga, YogaInitialContext } from 'graphql-yoga';
import { createContext as createCopilotContext } from '@copilotkit/runtime';
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
    'sec-ch-ua-platform',
  ],
};

// Add CORS middleware first
app.use(cors(corsOptions));

// Create service adapter
const serviceAdapter = new ExperimentalEmptyAdapter();

// Create runtime instance
const runtime = new CopilotRuntime({
  remoteEndpoints: [{ url: REMOTE_URL }],
  middleware: {
    onBeforeRequest: ({ properties, threadId }) => {
      const { userId, sessionId, orgId } = properties;
      console.log(userId, sessionId, orgId, threadId);
      // here we can check if the user is authorized to access the thread
    },
  },
});

const properties: CopilotRequestContextProperties = {};
const options: CreateCopilotRuntimeServerOptions = {
  endpoint: '/copilotkit',
  properties,
  runtime,
  serviceAdapter,
};

// Get common config
const commonConfig = getCommonConfig(options);

// Create the Yoga handler
const yoga = createYoga({
  ...commonConfig,
  graphqlEndpoint: '/copilotkit',
  graphiql: false,
  context: async (ctx: YogaInitialContext) => {
    const auth: { userId: string; sessionId: string; orgId: string } = (ctx.request as any).bodyInit
      ?.auth;

    const enhancedProperties: CopilotRequestContextProperties = {
      ...properties,
      userId: auth?.userId || '',
      sessionId: auth?.sessionId || '',
      organization: auth?.orgId || '',
    };
    return createCopilotContext(ctx, options, commonConfig.logging, enhancedProperties);
  },
});

// Create a router for the protected endpoint
const router = express.Router();

router.use(clerkMiddleware());
router.use(requireAuth());

// Add Yoga after Clerk middleware
router.use(yoga);

// Mount the router at /copilotkit
app.use('/copilotkit', router);

// Start server
app.listen(PORT, () => {
  console.log(`Copilot Runtime server listening at http://localhost:${PORT}/copilotkit`);
  console.log(process.env.REMOTE_URL);
});
