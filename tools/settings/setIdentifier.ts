import { z } from "zod";
import { setIdentifier } from "./state.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerSetIdentifierTool(server: McpServer) {
    server.registerTool(
        "settings.setIdentifier",
        {
            description: "Registers your MCP identifier for future authenticated requests.",
            inputSchema: {
                identifier: z.string().min(10).describe("Your MCP identifier (minimum 10 characters)")
            }
        },
        async ({ identifier }) => {
            setIdentifier(identifier);

            return {
                content: [
                    {
                        type: "text",
                        text: `✓ Identifier stored successfully: ${identifier}`,
                    },
                ],
            };
        }
    );
}