import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSetIdentifierTool } from "./tools/settings/setIdentifier";
import { registerCheckoutCreateTool } from "./tools/checkout/create";

const MCP_BRIDGE_URL = process.env.MCP_BRIDGE_URL!;

const server = new McpServer({
    name: "mcp-bridge-provider",
    version: "1.0.0",
});

let initialized = false;
let transport: StreamableHTTPServerTransport;

export default async function handler(req: any, res: any) {
    if (!initialized) {
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => crypto.randomUUID(),
        });

        registerSetIdentifierTool(server);
        registerCheckoutCreateTool(server, MCP_BRIDGE_URL);
        await server.connect(transport);

        initialized = true;
    }

    
    return transport.handleRequest(req, res);
}