import "dotenv/config";
import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { registerSetIdentifierTool } from "./tools/settings/setIdentifier.js";
import { registerCheckoutCreateTool } from "./tools/checkout/create.js";

// ----------------------------------------
// ENV VARS
// ----------------------------------------
const MCP_BRIDGE_URL = process.env.MCP_BRIDGE_URL ?? '';
if (!MCP_BRIDGE_URL) {
    console.error("❌ Missing MCP_BRIDGE_URL in environment variables");
    process.exit(1);
}

// ----------------------------------------
// MCP SERVER INSTANCE
// ----------------------------------------
const server = new McpServer({
    name: "mcp-bridge-provider",
    version: "1.0.0",
});

let initialized = false;
let transport: StreamableHTTPServerTransport;

// ----------------------------------------
// INITIALIZE MCP SERVER (SHARED BETWEEN LOCAL + VERCEL)
// ----------------------------------------
async function initMcp() {
    if (initialized) return;

    transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
    });

    registerSetIdentifierTool(server);
    registerCheckoutCreateTool(server, MCP_BRIDGE_URL);

    await server.connect(transport);
    initialized = true;
}

// ----------------------------------------
// HANDLER FOR VERCEL (serverless)
// ----------------------------------------
export default async function handler(req: any, res: any) {
    await initMcp();
    return transport.handleRequest(req, res);
}

// ----------------------------------------
// LOCAL DEV SERVER (only runs if executed directly)
// ----------------------------------------
if (process.env.VERCEL !== "1") {
    // Running locally (not on Vercel)
    initMcp().then(() => {
        const httpServer = http.createServer(async (req, res) => {
            if (req.url === "/mcp") {
                await transport.handleRequest(req, res);
            } else {
                res.writeHead(404);
                res.end("Not MCP");
            }
        });

        httpServer.listen(4000, () => {
            console.log("🚀 MCP Bridge provider running locally at:");
            console.log("👉 http://localhost:4000/mcp");
        });
    });
}