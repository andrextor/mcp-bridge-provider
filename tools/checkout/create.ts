import { z } from "zod";
import { getIdentifier } from "../settings/state.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerCheckoutCreateTool(server: McpServer, bridgeUrl: string) {
    server.registerTool(
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
            const identifier = getIdentifier();

            if (!identifier) {
                throw new Error("Identifier not set. Please use settings.setIdentifier first.");
            }

            const response = await fetch(`${bridgeUrl}/checkout/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${identifier}`,
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