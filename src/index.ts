import express from 'express';
import { config } from 'dotenv';
import {
  CopilotRequestContextProperties,
  CopilotRuntime,
  CreateCopilotRuntimeServerOptions,
  ExperimentalEmptyAdapter,
  getCommonConfig,
} from '@copilotkit/runtime';
import { 
  createYoga, LogLevel, YogaInitialContext } from 'graphql-yoga';
import {pino as createPinoLogger} from "pino";
import pretty from "pino-pretty";

// Load environment variables
config();

const logLevel = (process.env.LOG_LEVEL as LogLevel) || "error";

export function createLogger(options?: { level?: LogLevel; component?: string }) {
  const { level, component } = options || {};
  const stream = pretty({ colorize: true });

  const logger = createPinoLogger(
    {
      level: process.env.LOG_LEVEL || level || "error",
      redact: {
        paths: ["pid", "hostname"],
        remove: true,
      },
    },
    stream,
  );

  if (component) {
    return logger.child({ component });
  } else {
    return logger;
  }
}

const logger = createLogger();
export type GraphQLContext = YogaInitialContext & {
  _copilotkit: CreateCopilotRuntimeServerOptions;
  properties: CopilotRequestContextProperties;
  logger: any;
};

// Get environment variables with type safety
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const REMOTE_URL = process.env.REMOTE_URL || 'https://your-remote-endpoint.com';

// Create Express app
const app = express();

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

const options = {
  endpoint: '/copilotkit',
  properties: {},
  runtime,
  serviceAdapter,
}

export async function createContext(
  initialContext: YogaInitialContext,
  copilotKitContext: CreateCopilotRuntimeServerOptions,
  contextLogger: typeof logger,
  properties: CopilotRequestContextProperties = {},
): Promise<Partial<GraphQLContext>> {
  console.log({ copilotKitContext }, "Creating GraphQL context");
  console.log(initialContext);
  const ctx: GraphQLContext = {
    ...initialContext,
    _copilotkit: {
      ...copilotKitContext,
    },
    properties: { ...properties },
    logger: contextLogger,
  };
  return ctx;
}



const commonConfig = getCommonConfig(options)
const contextLogger = createLogger({ level: logLevel });
commonConfig.context = (ctx: YogaInitialContext): Promise<Partial<GraphQLContext>> =>
  createContext(ctx, options, contextLogger, options.properties)
// Create the handler function
const runtimeMiddleware = createYoga({
  ...commonConfig,
  graphqlEndpoint: '/copilotkit',
});

// Apply the handler as Express middleware
app.use('/copilotkit', runtimeMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`Copilot Runtime server listening at http://localhost:${PORT}/copilotkit`);
  console.log(process.env.REMOTE_URL);
}); 