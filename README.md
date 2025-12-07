# MCP Bridge Provider

**MCP Bridge Provider** is an MCP (Model Context Protocol) server designed to connect LLMs with the **MCP Bridge API**, enabling secure execution of:

- Checkout API actions  
- Gateway API actions (future)  
- REST Gateway extensions  
- User-specific environment & site resolution  
- Cryptographically authenticated requests

This provider is meant to be used by tools like **ChatGPT MCP Web Connectors**, enabling natural-language automation of PlacetoPay integrations.

---

## 🌐 What This Provider Does

Once connected to ChatGPT (via an MCP-compatible client), your LLM can:

### ✔️ Register your MCP Identifier

```ts
settings.setIdentifier
checkout.create
```

Automatically validates payloads:
 • PaymentRequest
 • SubscriptionRequest

and routes the call to your backend with the correct site, environment, and credentials.

```bash
mcp-bridge-provider/
│
├── index.ts                     # MCP server initialization
├── mcp.json                     # Provider manifest
├── tools/
│   ├── settings/
│   │   └── setIdentifier.ts     # Stores MCP identifier
│   └── checkout/
│       └── create.ts            # checkout.create tool
│
├── schemas/
│   ├── buyer.schema.ts
│   ├── baseRequest.schema.ts
│   ├── payment.schema.ts
│   ├── subscription.schema.ts
│   ├── payload.schema.ts
│   └── site.schema.ts
│
├── package.json
└── README.md
```

## Running Locally

Install dependencies:

```bash
npm install
```

Create a .env:

```bash
MCP_BRIDGE_URL=https://your-bridge-api.com
```

Start the MCP provider:

```bash
npm run dev
```

You will see:

```bash
🚀 MCP Bridge provider listening on http://localhost:4000/mcp
```

This URL is what ChatGPT Web uses to connect to your MCP provider.

## Tools

Your provider currently exposes two tools.

1. settings.setIdentifier
Stores the user-specific identifier that the backend uses to validate signed MCP requests.

```json
{
  "identifier": "abc123xyz..."
}
```

If you don’t set this, checkout.create will not work.

2. checkout.create

Creates a checkout session in your backend.

Supports:

Payment Request

```json
{
  "environment": "TEST",
  "site": { "id": 24 },
  "payload": {
    "locale": "es_CO",
    "ipAddress": "181.50.20.1",
    "returnUrl": "https://example.com/return",
    "userAgent": "MCP",
    "buyer": {
      "name": "Mario",
      "surname": "Lopez",
      "email": "mario@example.com",
      "document": "123456",
      "documentType": "CC",
      "mobile": 3105550000
    },
    "payment": {
      "reference": "Ref-2025-123",
      "description": "Pago por servicio",
      "amount": { "currency": "COP", "total": 25000 },
      "subscribe": false
    },
    "paymentMethod": null
  }
}
```

Subscription Request

```json
{
  "environment": "TEST",
  "site": { "country": "colombia" },
  "payload": {
    "subscription": {
      "reference": "plan-001",
      "description": "Plan mensual"
    }
  }
}
```


## Full MCP Provider Flow

 1. User adds the MCP provider URL into ChatGPT Web , CLoude, etc..
 2. ChatGPT loads your mcp.json
 3. User calls:

 ```bash
 settings.setIdentifier
 ```

  4. User calls:

```bash
checkout.create
```

 5. Provider sends a structured request to your backend
 6. Backend resolves:
 • site
 • environment
 • userId
 • credentials
 7. Backend performs the actual PlacetoPay API call
 8. Response flows back to ChatGPT

## Testing Your Deployment

Once deployed:

```bash
curl https://your-domain.com/api/mcp -H "Content-Type: application/json"
```

Expected response (initialization):

```json
{
  "jsonrpc": "2.0",
  "id": "...",
  "result": { "capabilities": { ... } }
}
```

## License

MIT
