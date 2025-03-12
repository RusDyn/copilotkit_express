import { CreateCopilotRuntimeServerOptions } from "@copilotkit/runtime";
import { CopilotRequestContextProperties } from "@copilotkit/runtime";
import { YogaInitialContext } from "graphql-yoga";
import { createContext as createCopilotContext } from "@copilotkit/runtime";
import { getAuth } from '@clerk/express';
import { Logger } from "pino";

export async function createAuthContext(
    initialContext: YogaInitialContext,
    copilotKitContext: CreateCopilotRuntimeServerOptions,
    contextLogger: Logger<never, boolean>,
    properties: CopilotRequestContextProperties = {},
  ) {
    let enhancedProperties: CopilotRequestContextProperties = properties;
    try {
      // Get auth data from Clerk
      // @ts-ignore - We know this is an Express request
      const auth = getAuth(initialContext.request);
      
      // Add user data to properties, ensuring non-null values
      enhancedProperties = {
        ...properties,
        userId: auth.userId || '',
        sessionId: auth.sessionId || '',
        organization: auth.orgId || '',
      };

      console.log("Auth Context:", {
        userId: auth.userId,
        sessionId: auth.sessionId,
        organization: auth.orgId
      });
    } catch (error) {
      console.error("Error getting auth context:", error);
      
    }

    // Return context without auth properties if there's an error
    return createCopilotContext(
      initialContext,
      copilotKitContext,
      contextLogger,
      enhancedProperties
    );
  }
  