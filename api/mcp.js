// api/mcp.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const MCP_BRIDGE_URL = process.env.MCP_BRIDGE_URL;

// Estado en memoria
let storedIdentifier = null;

// Schemas de validación
const SetIdentifierSchema = z.object({
    identifier: z.string().min(10, "Identifier must be at least 10 characters"),
});

const CheckoutCreateSchema = z.object({
    amount: z.number().positive("Amount must be positive"),
    currency: z.string().length(3, "Currency must be 3 characters (e.g., USD)"),
    description: z.string().optional(),
});

// Instancia única del servidor
let serverInstance = null;

function getServer() {
    if (!serverInstance) {
        serverInstance = new McpServer({
            name: "mcp-bridge-provider",
            version: "1.0.0",
        });

        // Registrar herramienta: settings.setIdentifier
        serverInstance.registerTool(
            "settings.setIdentifier",
            {
                description: "Registers your MCP identifier for future authenticated requests.",
                inputSchema: {
                    identifier: z.string().min(10).describe("Your MCP identifier (minimum 10 characters)")
                }
            },
            async ({ identifier }) => {
                storedIdentifier = identifier;
                return {
                    content: [
                        {
                            type: "text",
                            text: `✓ Identifier stored successfully: ${storedIdentifier}`,
                        },
                    ],
                };
            }
        );

        // Registrar herramienta: checkout.create
        serverInstance.registerTool(
            "checkout.create",
            {
                description: "Creates a new checkout session in MCP Bridge",
                inputSchema: {
                    amount: z.number().positive().describe("Amount to charge (must be positive)"),
                    currency: z.string().length(3).describe("Currency code (3 characters, e.g., USD)"),
                    description: z.string().optional().describe("Optional description for the checkout")
                }
            },
            async (args) => {
                if (!storedIdentifier) {
                    throw new Error(
                        "Identifier not set. Please use settings.setIdentifier first."
                    );
                }

                // Llamada a la API de MCP Bridge
                const response = await fetch(`${MCP_BRIDGE_URL}/checkout/create`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${storedIdentifier}`,
                    },
                    body: JSON.stringify(args),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(
                        `API Error (${response.status}): ${errorData.message || response.statusText}`
                    );
                }

                const data = await response.json();

                return {
                    content: [
                        {
                            type: "text",
                            text: `✓ Checkout created successfully:\n\n${JSON.stringify(data, null, 2)}`,
                        },
                    ],
                };
            }
        );
    }

    return serverInstance;
}

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

    // Manejar preflight OPTIONS
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const server = getServer();

    try {
        // Endpoint GET para conexión SSE (Server-Sent Events)
        if (req.method === "GET") {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache, no-transform");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("X-Accel-Buffering", "no");

            // Enviar evento de conexión inicial
            res.write('data: {"jsonrpc":"2.0","method":"connected"}\n\n');

            // Mantener conexión viva con keepalive cada 30 segundos
            const keepAlive = setInterval(() => {
                res.write(":keepalive\n\n");
            }, 30000);

            // Limpiar cuando el cliente cierre la conexión
            req.on("close", () => {
                clearInterval(keepAlive);
            });

            return;
        }

        // Endpoint POST para mensajes JSON-RPC
        if (req.method === "POST") {
            const request = req.body;

            // Validar formato JSON-RPC
            if (!request || !request.jsonrpc || request.jsonrpc !== "2.0") {
                return res.status(400).json({
                    jsonrpc: "2.0",
                    error: {
                        code: -32600,
                        message: "Invalid Request: Must be JSON-RPC 2.0",
                    },
                    id: null,
                });
            }

            // Manejar inicialización del protocolo MCP
            if (request.method === "initialize") {
                return res.status(200).json({
                    jsonrpc: "2.0",
                    result: {
                        protocolVersion: "2024-11-05",
                        capabilities: {
                            tools: {},
                        },
                        serverInfo: {
                            name: "mcp-bridge-provider",
                            version: "1.0.0",
                        },
                    },
                    id: request.id,
                });
            }

            // Listar herramientas disponibles
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

            // Ejecutar herramientas
            if (request.method === "tools/call") {
                const { name, arguments: args } = request.params;

                try {
                    let result;

                    if (name === "settings.setIdentifier") {
                        const validation = SetIdentifierSchema.safeParse(args);
                        if (!validation.success) {
                            throw new Error(`Invalid arguments: ${validation.error.message}`);
                        }
                        storedIdentifier = validation.data.identifier;
                        result = {
                            content: [
                                {
                                    type: "text",
                                    text: `✓ Identifier stored successfully: ${storedIdentifier}`,
                                },
                            ],
                        };
                    } else if (name === "checkout.create") {
                        const validation = CheckoutCreateSchema.safeParse(args);
                        if (!validation.success) {
                            throw new Error(`Invalid arguments: ${validation.error.message}`);
                        }

                        if (!storedIdentifier) {
                            throw new Error(
                                "Identifier not set. Please use settings.setIdentifier first."
                            );
                        }

                        const response = await fetch(`${MCP_BRIDGE_URL}/checkout/create`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${storedIdentifier}`,
                            },
                            body: JSON.stringify(validation.data),
                        });

                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            throw new Error(
                                `API Error (${response.status}): ${errorData.message || response.statusText}`
                            );
                        }

                        const data = await response.json();
                        result = {
                            content: [
                                {
                                    type: "text",
                                    text: `✓ Checkout created successfully:\n\n${JSON.stringify(data, null, 2)}`,
                                },
                            ],
                        };
                    } else {
                        throw new Error(`Unknown tool: ${name}`);
                    }

                    return res.status(200).json({
                        jsonrpc: "2.0",
                        result: result,
                        id: request.id,
                    });
                } catch (error) {
                    console.error(`Error executing ${name}:`, error);
                    return res.status(200).json({
                        jsonrpc: "2.0",
                        error: {
                            code: -32603,
                            message: error.message,
                        },
                        id: request.id,
                    });
                }
            }

            // Método no encontrado
            return res.status(200).json({
                jsonrpc: "2.0",
                error: {
                    code: -32601,
                    message: `Method not found: ${request.method}`,
                },
                id: request.id,
            });
        }

        // Método HTTP no permitido
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

// Configuración de la API de Vercel
export const config = {
    api: {
        bodyParser: true,
    },
};