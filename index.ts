import "dotenv/config";
import http from "node:http";
import fetch from "node-fetch";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerSetIdentifierTool } from "./tools/settings/setIdentifier.js";
import { registerCheckoutCreateTool } from "./tools/checkout/create.js";
// -----------------------------
// ENV VARS
// -----------------------------
const MCP_BRIDGE_URL = process.env.MCP_BRIDGE_URL;
const MCP_IDENTIFIER = process.env.MCP_IDENTIFIER;

if (!MCP_BRIDGE_URL || !MCP_IDENTIFIER) {
    console.error("❌ Missing MCP_BRIDGE_URL or MCP_IDENTIFIER in .env");
    process.exit(1);
}

// -----------------------------
// MCP SERVER
// -----------------------------
const server = new McpServer({
    name: "mcp-bridge-provider",
    version: "1.0.0",
});

// -----------------------------
// TOOL
// -----------------------------
registerSetIdentifierTool(server);
registerCheckoutCreateTool(server, MCP_BRIDGE_URL);

// -----------------------------
// START SERVER (HTTP MCP)
// -----------------------------
const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
});

const httpServer = http.createServer(async (req, res) => {
    if (req.url === "/mcp") {
        await transport.handleRequest(req, res);
    } else {
        res.writeHead(404);
        res.end("Not MCP");
    }
});

await server.connect(transport);

httpServer.listen(4000, () => {
    console.log("🚀 MCP Bridge provider listening on http://localhost:4000/mcp");
});