# CircleChain Developer & API Integration Guide 🔌

This guide provides technical specifications and code examples for interacting with the CircleChain protocol programmatically.

---

## 1. Network Configuration

| Environment | Soroban RPC Endpoint | Horizon Endpoint | Network Passphrase |
|---|---|---|---|
| **Stellar Testnet** | `https://soroban-testnet.stellar.org` | `https://horizon-testnet.stellar.org` | `Test SDF Network ; September 2015` |
| **Stellar Futurenet** | `https://rpc-futurenet.stellar.org` | `https://horizon-futurenet.stellar.org` | `Test SDF Future Network ; October 2022` |

---

## 2. Wallet Connection & Transaction Signing

### 2.1 Freighter Wallet Integration (TypeScript)

```typescript
import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api';

// 1. Check if user has Freighter installed
const connected = await isConnected();
if (!connected) {
  throw new Error('Please install Freighter extension');
}

// 2. Request user public key
const userPublicKey = await getPublicKey();
console.log('Connected user:', userPublicKey);

// 3. Prompt user signature for an XDR transaction envelope
const signedXdr = await signTransaction(xdrString, {
  networkPassphrase: 'Test SDF Network ; September 2015',
});
```

---

## 3. Backend REST API Endpoints

### 3.1 Fetch Active Circles
```http
GET /api/circles HTTP/1.1
Host: localhost:4000
Accept: application/json
```
**Response (200 OK)**:
```json
{
  "success": true,
  "circles": [
    {
      "circle_id": 1,
      "name": "Tech Founders Ajo Pool",
      "contribution_amount": 200,
      "interval_days": 30,
      "member_count": 5,
      "collateral_required": 100,
      "payout_mode": "Fixed",
      "status": "Active"
    }
  ]
}
```

### 3.2 Fetch Saver Profile & Reputation
```http
GET /api/profiles/GABC1234567890WXYZ1234567890TESTNETSAVER01 HTTP/1.1
Host: localhost:4000
```
**Response (200 OK)**:
```json
{
  "success": true,
  "profile": {
    "wallet_address": "GABC1234567890WXYZ1234567890TESTNETSAVER01",
    "username": "tech_founder_lagos",
    "display_name": "Amara K.",
    "reputation_score": 98,
    "circles_completed": 4,
    "punctual_contributions": 32
  }
}
```

### 3.3 Health & Diagnostic Probes
```http
GET /health/liveness HTTP/1.1  -> 200 OK: {"status": "alive", "uptime": 1420}
GET /health/readiness HTTP/1.1 -> 200 OK: {"status": "ready", "database": "healthy"}
```
