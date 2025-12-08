import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSetIdentifierTool } from "../tools/settings/setIdentifier.js";
import { registerCheckoutCreateTool } from "../tools/checkout/create.js";

const MCP_BRIDGE_URL = process.env.MCP_BRIDGE_URL;

// Instancia única del servidor
let serverInstance = null;

function getServer() {
    if (!serverInstance) {
        serverInstance = new McpServer({
            name: "mcp-bridge-provider",
            version: "1.0.0",
        });

        // Registrar todas las herramientas de forma modular
        registerSetIdentifierTool(serverInstance);
        registerCheckoutCreateTool(serverInstance, MCP_BRIDGE_URL);
    }

    return serverInstance;
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const server = getServer();

    try {
        if (req.method === "GET") {
            return res.status(400).json({ jsonrpc: "2.0", error: { message: "Not valid http method" }, id: null });
        }

        if (req.method === "POST") {
            const request = req.body;

            if (!request || !request.jsonrpc || request.jsonrpc !== "2.0") {
                return res.status(400).json({
                    jsonrpc: "2.0",
                    error: { code: -32600, message: "Invalid Request: Must be JSON-RPC 2.0" },
                    id: null,
                });
            }

            if (request.method === "initialize") {
                return res.status(200).json({
                    jsonrpc: "2.0",
                    result: {
                        protocolVersion: "2024-11-05",
                        capabilities: { tools: {} },
                        serverInfo: {
                            name: "mcp-bridge-provider",
                            version: "1.0.0",
                        },
                    },
                    id: request.id,
                });
            }

            if (request.method === "tools/list") {
                return res.status(200).json({
                    jsonrpc: "2.0",
                    result: {
                        tools: [
                            {
                                name: "settings.setIdentifier",
                                description: "Registers your MCP identifier for future authenticated requests.",
                                inputSchema: {
                                    type: "object",
                                    properties: {
                                        identifier: {
                                            type: "string",
                                            description: "Your MCP identifier (minimum 10 characters)",
                                            minLength: 10,
                                        },
                                    },
                                    required: ["identifier"],
                                },
                            },
                            {
                                name: "checkout.create",
                                description: "Creates a new checkout session in MCP Bridge",
                                inputSchema: {
                                    type: "object",
                                    properties: {
                                        amount: {
                                            type: "number",
                                            description: "Amount to charge (must be positive)",
                                        },
                                        currency: {
                                            type: "string",
                                            description: "Currency code (3 characters, e.g., USD)",
                                            minLength: 3,
                                            maxLength: 3,
                                        },
                                        description: {
                                            type: "string",
                                            description: "Optional description for the checkout",
                                        },
                                    },
                                    required: ["amount", "currency"],
                                },
                            },
                        ],
                    },
                    id: request.id,
                });
            }

            if (request.method === "tools/call") {
                const { name, arguments: args } = request.params;

                try {
                    const toolHandlers = server._tools;
                    const tool = toolHandlers?.get(name);

                    if (!tool) {
                        throw new Error(`Unknown tool: ${name}`);
                    }

                    const result = await tool.execute(args);

                    return res.status(200).json({
                        jsonrpc: "2.0",
                        result: result,
                        id: request.id,
                    });
                } catch (error) {
                    console.error(`Error executing ${name}:`, error);
                    return res.status(200).json({
                        jsonrpc: "2.0",
                        error: { code: -32603, message: error.message },
                        id: request.id,
                    });
                }
            }

            return res.status(200).json({
                jsonrpc: "2.0",
                error: { code: -32601, message: `Method not found: ${request.method}` },
                id: request.id,
            });
        }

        return res.status(405).json({
            error: "Method not allowed",
            allowed: ["GET", "POST", "OPTIONS"],
        });

    } catch (error) {
        console.error("MCP Handler Error:", error);

        if (!res.headersSent) {
            return res.status(500).json({
                jsonrpc: "2.0",
                error: {
                    code: -32603,
                    message: "Internal server error",
                    data: process.env.NODE_ENV === "development" ? error.stack : undefined,
                },
                id: null,
            });
        }
    }
}

export const config = {
    api: {
        bodyParser: true,
    },
};