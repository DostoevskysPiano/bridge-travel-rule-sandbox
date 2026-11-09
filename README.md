# Bridge Travel Rule Intent Sandbox (Stripe-Native Architecture)

An interactive demonstration artifact designed for technical cold outreach to product and engineering leadership at **Bridge** and **Stripe**.

This sandbox demonstrates why Bridge's legacy fire-and-forget compliance ingestion (`POST /v0/travel_rule_data`) breaks down for retail crypto fintechs, and how adopting a Stripe-native `Transfer` state machine with `status: "requires_action"` and explicit `next_action` descriptors eliminates indefinite transaction freezes and enables automated, inline remediation.

---

## Key Features

1. **Stripe-Native Resource Schema**:
   - Mirrors Stripe's authentic resource design:
     - `object: "crypto_transfer"`
     - `status: "requires_action" | "processing" | "succeeded" | "canceled"`
     - Stateful `next_action` contracts (`collect_missing_fields`, `verify_wallet_ownership`, `quarantine_resolution`)
     - Embedded `travel_rule` compliance object with IVMS-101 payloads, protocol tracking (TRISA / OpenVASP), and remediation audit history.
2. **Four Real-World Compliance Scenarios**:
   - **EU MiCA / TFR (Outbound)**: Zero-threshold rule requires recipient Date of Birth for Bitstamp Europe transfers.
   - **Unhosted Wallet (Outbound)**: FinCEN/TFR >$3k threshold triggers an inline cryptographic EIP-712 challenge signature.
   - **Counterparty VASP Rejection (Outbound)**: Coinbase Germany sanctions/account block triggers a 1-click programmatic balance refund.
   - **Inbound Quarantine (Inbound)**: Inbound deposit from Kraken US withheld due to missing originator IVMS-101 attestation, offering 1-click attestation or programmatic Return-to-Sender (RTS).
3. **Split-Screen Interactive Experience**:
   - **Retail Viewport**: Shows the consumer mobile journey, comparing the painful drop-off in legacy mode against seamless remediation in proposal mode.
   - **Developer Cockpit**: Live Stripe state machine inspector, formatted JSON resource viewer, and real-time webhook event bus.

---

## Getting Started

### Prerequisites
- Node.js >= 18
- npm

### Installation & Run

```bash
cd bridge-travel-rule-sandbox
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## Project Structure

```
bridge-travel-rule-sandbox/
├── src/
│   ├── types/
│   │   └── compliance.ts       # Stripe crypto transfer & travel rule schema definitions
│   ├── lib/
│   │   └── mockEngine.ts       # Stateful mock compliance engine & event bus
│   ├── components/
│   │   ├── RetailSimulator.tsx # Consumer mobile viewport & remediation forms
│   │   └── DeveloperCockpit.tsx# State inspector, JSON viewer, & webhook bus
│   ├── App.tsx                 # Master split-screen layout & scenario controls
│   ├── main.tsx                # React entrypoint
│   └── index.css               # Tailwind CSS styles
├── tailwind.config.js
├── vite.config.ts
└── package.json
```
