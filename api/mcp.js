import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { registerSetIdentifierTool } from "../tools/settings/setIdentifier.js";
import { registerCheckoutCreateTool } from "../tools/checkout/create.js";

const MCP_BRIDGE_URL = process.env.MCP_BRIDGE_URL;

// Crear servidor una sola vez (fuera del handler para reutilizar)
let serverInstance = null;

function getServer() {
    if (!serverInstance) {
        serverInstance = new Server(
            {
                name: "mcp-bridge-provider",
                version: "1.0.0",
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        // Registrar las herramientas
        registerSetIdentifierTool(serverInstance);
        registerCheckoutCreateTool(serverInstance, MCP_BRIDGE_URL);
    }
    return serverInstance;
}

export default async function handler(req, res) {
    // Manejar CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // Manejar GET para SSE
    if (req.method === 'GET') {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Accel-Buffering', 'no');

        const server = getServer();
        const transport = new SSEServerTransport("/api/mcp", res);

        await server.connect(transport);

        // Mantener la conexión abierta
        req.on('close', () => {
            transport.close();
        });

        return;
    }

    // Manejar POST para mensajes
    if (req.method === 'POST') {
        try {
            const server = getServer();

            // Procesar mensaje del cliente
            const message = req.body;

            // Aquí deberías procesar el mensaje según tu lógica
            // Este es un ejemplo básico
            res.status(200).json({
                success: true,
                message: "Message received"
            });
        } catch (error) {
            console.error('Error processing message:', error);
            res.status(500).json({
                error: error.message
            });
        }
        return;
    }

    // Método no permitido
    res.status(405).json({ error: 'Method not allowed' });
}

export const config = {
    api: {
        bodyParser: true,
    },
};