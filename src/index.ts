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
    onBeforeRequest: () => {
      //console.log(options);
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
    console.log('--------------------------------');
    console.log('Body init:', (ctx.request as any).bodyInit);
    console.log('Auth:', (ctx.request as any).bodyInit?.auth);

    // Try to access auth from different possible locations
    const expressReq = (ctx.request as any).raw;
    console.log('Auth from raw:', expressReq?.auth);

    const enhancedProperties: CopilotRequestContextProperties = {
      ...properties,
      userId: expressReq?.auth?.userId || '',
      sessionId: expressReq?.auth?.sessionId || '',
      organization: expressReq?.auth?.orgId || '',
    };

    console.log('Auth Context:', {
      userId: expressReq?.auth?.userId,
      sessionId: expressReq?.auth?.sessionId,
      organization: expressReq?.auth?.orgId,
    });

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
