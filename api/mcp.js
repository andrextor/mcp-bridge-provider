import { createMcpHandler } from "mcp-handler";
import { registerSetIdentifierTool } from "../tools/settings/setIdentifier.js";
import { registerCheckoutCreateTool } from "../tools/checkout/create.js";

const MCP_BRIDGE_URL = process.env.MCP_BRIDGE_URL;

const handler = createMcpHandler(
    (server) => {
        registerSetIdentifierTool(server);
        registerCheckoutCreateTool(server, MCP_BRIDGE_URL);
    },
    {},
    { basePath: "/api" }
);

export default async function (req, res) {
    return handler(req, res);
}