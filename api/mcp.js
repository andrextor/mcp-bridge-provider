// api/mcp.js - Handler mejorado y modular
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSetIdentifierTool } from "../tools/settings/setIdentifier.js";
import { registerCheckoutCreateTool } from "../tools/checkout/create.js";
import { readFileSync } from "fs";
import { join } from "path";

const baseUrl = 'https://mcp-bridge-api.onrender.com/api/v1/mcp/execute';

const mcpConfig = JSON.parse(
    readFileSync(join(process.cwd(), "mcp.json"), "utf-8")
);

const toolRegistry = new Map();

let serverInstance = null;

function getServer() {
    if (!serverInstance) {
        serverInstance = new McpServer({
            name: mcpConfig.name,
            version: mcpConfig.version,
        });

        // Registrar todas las herramientas de forma modular
        const setIdTool = registerSetIdentifierTool(serverInstance);
        toolRegistry.set("settings.setIdentifier", setIdTool);
        const checkoutTool = registerCheckoutCreateTool(serverInstance, baseUrl);

        toolRegistry.set("checkout.create", checkoutTool);
    }

    return serverInstance;
}

// Extraer información de tools desde mcp.json
function getToolsMetadata() {
    return Object.entries(mcpConfig.tools || {}).map(([name, config]) => ({
        name,
        description: config.description,
        inputSchema: config.input_schema,
    }));
}

// Manejadores de métodos JSON-RPC
const methodHandlers = {
    initialize: (request, server) => ({
        jsonrpc: "2.0",
        result: {
            protocolVersion: "2024-11-05",
            capabilities: mcpConfig.capabilities || { tools: {} },
            serverInfo: {
                name: mcpConfig.name,
                version: mcpConfig.version,
                description: mcpConfig.description,
            },
        },
        id: request.id,
    }),

    "tools/list": (request) => ({
        jsonrpc: "2.0",
        result: {
            tools: getToolsMetadata(),
        },
        id: request.id,
    }),

    "tools/call": async (request, server) => {
        const { name, arguments: args } = request.params;

        const tool = toolRegistry.get(name);

        if (!tool || !tool.enabled) {
            throw new Error(`Unknown tool: ${name}`);
        }

        const result = await tool.handler(args ?? {}, {
            request,
            sessionId: "",
            server: server.server,
        });

        return {
            jsonrpc: "2.0",
            result,
            id: request.id,
        };
    },
};

// Handler principal
export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

    // Preflight
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // Solo aceptar POST
    if (req.method !== "POST") {
        return res.status(405).json({
            jsonrpc: "2.0",
            error: {
                code: -32000,
                message: "Method not allowed. Use POST for JSON-RPC requests.",
            },
            id: null,
        });
    }

    const server = getServer();

    try {
        const request = req.body;

        // Validar JSON-RPC 2.0
        if (!request || !request.jsonrpc || request.jsonrpc !== "2.0") {
            return res.status(400).json({
                jsonrpc: "2.0",
                error: {
                    code: -32600,
                    message: "Invalid Request: Must be JSON-RPC 2.0",
                },
                id: request?.id || null,
            });
        }

        // Buscar y ejecutar el handler del método
        const methodHandler = methodHandlers[request.method];

        if (!methodHandler) {
            return res.status(200).json({
                jsonrpc: "2.0",
                error: {
                    code: -32601,
                    message: `Method not found: ${request.method}`,
                },
                id: request.id,
            });
        }

        // Ejecutar el handler
        try {
            const response = await methodHandler(request, server);
            return res.status(200).json(response);
        } catch (error) {
            console.error(`Error executing ${request.method}:`, error);
            return res.status(200).json({
                jsonrpc: "2.0",
                error: {
                    code: -32603,
                    message: error.message,
                    data: process.env.NODE_ENV === "development" ? {
                        stack: error.stack,
                        method: request.method,
                    } : undefined,
                },
                id: request.id,
            });
        }

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
        responseLimit: false,
    },
};