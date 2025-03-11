import express from 'express';
import { config } from 'dotenv';
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNodeHttpEndpoint
} from '@copilotkit/runtime';

// Load environment variables
config();

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
      console.log(options.properties)
    }
  }
});

// Create the handler function
const runtimeMiddleware = copilotRuntimeNodeHttpEndpoint({
  endpoint: '/copilotkit',
  runtime,
  serviceAdapter,
});

// Apply the handler as Express middleware
app.use('/copilotkit', runtimeMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`Copilot Runtime server listening at http://localhost:${PORT}/copilotkit`);
  console.log(process.env.REMOTE_URL);
}); 