# Copilot Runtime Express Server

A self-hosted Copilot Runtime server built with Express and TypeScript.

## Prerequisites

- Node.js (v16+)
- pnpm

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   pnpm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env` (or edit the existing `.env` file)
   - Set the correct values for `PORT` and `REMOTE_URL`

## Development

To run the server in development mode with hot-reloading:

```
pnpm dev
```

## Production

Build the project:

```
pnpm build
```

Start the server:

```
pnpm start
```

## API Endpoint

Once running, the Copilot Runtime endpoint will be available at:

```
http://localhost:{PORT}/copilotkit
```

Where `{PORT}` is the port number configured in your `.env` file (default: 3000).
