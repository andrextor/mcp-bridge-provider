import "dotenv/config";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSetIdentifierTool } from "../tools/settings/setIdentifier";
import { registerCheckoutCreateTool } from "../tools/checkout/create";


const MCP_BRIDGE_URL = process.env.MCP_BRIDGE_URL;

if (!MCP_BRIDGE_URL) {
    throw new Error("Missing MCP_BRIDGE_URL");
}

export const config = {
    runtime: "nodejs20.x",
};

// SINGLETONS (persist across serverless cold starts)
let initialized = false;
let server: McpServer;
let transport: StreamableHTTPServerTransport;

// The Vercel handler
export default async function handler(req: any, res: any) {
    if (!initialized) {
        server = new McpServer({
            name: "mcp-bridge-provider",
            version: "1.0.0",
        });

        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => crypto.randomUUID(),
            enableJsonResponse: false,
        });

        registerSetIdentifierTool(server);
        registerCheckoutCreateTool(server, MCP_BRIDGE_URL ?? '');

        await server.connect(transport);

        initialized = true;
        console.error("🚀 MCP Bridge provider initialized (Vercel)");
    }

    return transport.handleRequest(req, res);
}