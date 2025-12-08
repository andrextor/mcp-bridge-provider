import { z } from "zod";
import { setIdentifier } from "./state.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerSetIdentifierTool(server: McpServer) {
    server.registerTool(
        "settings.setIdentifier",
        {
            description: "Registers your MCP identifier for future authenticated requests.",
            inputSchema: z.object({
                identifier: z.string().min(10, "Identifier must be valid"),
            }),
        },
        async ({ identifier }) => {
            setIdentifier(identifier);

            return {
                content: [
                    {
                        type: "text",
                        text: `Identifier stored: ${identifier}`,
                    },
                ],
            };
        }
    );
}