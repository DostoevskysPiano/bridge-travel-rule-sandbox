# Asynchronous Travel Rule Architecture: A Case Study

An interactive sandbox and architectural case study examining how stablecoin payment rails can replace synchronous, fire-and-forget compliance ingestion (`POST /v0/travel_rule_data`) with an asynchronous, intent-driven state machine (`POST /v1/transfers`).

---

## Problem Statement

Global Travel Rule frameworks—including **FATF Recommendation 16**, **FinCEN unhosted wallet rules**, and **EU TFR / MiCA**—are inherently asynchronous and multi-party. Satisfying compliance frequently requires counterparty VASP handshakes (TRISA, OpenVASP, Notabene), cryptographic self-custody proofs, or delegated identity verification across third-party vaults.

When a stablecoin API models compliance as a synchronous, fire-and-forget ingestion call (`POST /v0/travel_rule_data`), several failure modes emerge:

1. **Indefinite Black-Box Holds:** When required IVMS-101 attributes are missing or rejected downstream, transfers fall into an opaque `status: "processing"` hold with no machine-readable remediation path.
2. **Unrecoverable Schema Failures:** Integrators must guess what fields are required and build unvalidated intake forms, leading to unhandled serialization or protocol rejections (e.g., `ERR_UNHANDLED_IVMS101_SCHEMA_MISMATCH`).
3. **High-Friction Self-Custody Proofs:** Without a native challenge-response protocol for unhosted wallets, platforms fall back to Satoshi micro-transactions (forcing users to pay on-chain gas) or manual hardware-wallet photo uploads queued for 3–5 business days.
4. **Multi-Hop Identity Desync:** Non-custodial wallets (such as MetaMask) hold zero local PII and rely on external decentralized identity vaults (such as idOS). A synchronous ingestion endpoint cannot orchestrate asynchronous three-party credential grants.
5. **Manual Ops & Support Escalations:** Missing fields trigger manual compliance review queues, turning automated fintech payouts into human Zendesk escalations.

---

## Proposed Architecture: Stripe-Native State Machine

Rather than treating Travel Rule validation as a monolithic pre-flight payload, the proposed architecture models each transfer as a stateful `crypto_transfer` resource driven by `status: "requires_action"` and typed `next_action` contracts.

### State Lifecycle

```text
created ──▶ requires_action (typed next_action) ──▶ processing ──▶ succeeded
                   │                                     │
                   └─ (user declines / escalates) ───────┴─▶ under_investigation / canceled
```

### Core Resource Schema (`src/types/compliance.ts`)

* **Resource Object:** `object: "crypto_transfer"`
* **Top-Level Status:** `'created' | 'requires_action' | 'processing' | 'succeeded' | 'canceled'`
* **Typed `next_action` Descriptors:**
  * `complete_beneficiary_form` — Specifies `required_fields`, `b2b_hold_reason`, and `consequence_of_decline` for quarantined inbound funds.
  * `verify_wallet_ownership` — Issues an inline gasless `eip712_signature` challenge bound to the destination address and transfer ID.
  * `authorize_identity_credential` — Orchestrates a multi-hop token grant between a zero-PII wallet, an external identity vault (e.g., idOS), and the compliance rail.
  * `collect_missing_fields` — Surfaces the exact missing IVMS-101 attribute (e.g., `beneficiary.postal_code`) for inline programmatic remediation.
* **Embedded `travel_rule` Object:** Tracks `evaluation_rule`, `compliance_status`, `protocol`, `counterparty_vasp`, `remediation_history`, and structured `last_error` codes.
* **Event-Driven Webhooks:** Emits granular lifecycle events (`transfer.created`, `travel_rule.action_required`, `travel_rule.ownership_challenge_issued`, `travel_rule.idos_grant_authorized`, `travel_rule.cleared`, `transfer.succeeded`).

---

## Case Studies Modeled in the Sandbox

Toggle between **Current** (`POST /v0/travel_rule_data`) and **Proposal** (`POST /v1/transfers`) in the header to compare both architectures across four scenarios:

| # | Scenario | Current (`/v0`) Failure Mode | Proposed (`/v1`) Resolution |
| :--- | :--- | :--- | :--- |
| **1** | **Inbound Deposit: Unallocated Beneficiary** (`$5,000.00 USDC`) | Unvalidated manual intake form fails with HTTP 500 (`ERR_UNHANDLED_IVMS101_SCHEMA_MISMATCH`) and quarantines funds indefinitely. | Returns `requires_action` (`complete_beneficiary_form`) to collect legal name and payment purpose inline, or cleanly escalates to `under_investigation` if declined. |
| **2** | **Unhosted Wallet >$3k Key Proof** (`$10,000.00 USDC`) | No cryptographic signing protocol; forces Satoshi micro-transactions (`$11.50` ETH gas) or hardware wallet photo uploads into a 3–5 day manual review queue. | Returns `verify_wallet_ownership` with a gasless EIP-712 typed signature challenge verified in 0.5s with zero manual ops review. |
| **3** | **Delegated KYC: MetaMask & 3rd-Party Vault** (`$7,500.00 USDC`) | Assumes caller stores local PII; fails with HTTP 422 (`ERR_MULTI_HOP_DELEGATION_DESYNC`) when an external vault (idOS) handles identity. | Returns `authorize_identity_credential`, orchestrating a 3-way handshake (`MetaMask -> idOS Vault -> Compliance Rail`) via a zero-knowledge compliance pass. |
| **4** | **Missing Attribute Escalation** (`$3,500.00 USDC`) | Omitted `beneficiary.postal_code` freezes payout in an AML hold, forcing B2B platform support into manual Zendesk back-and-forth with compliance ops. | Returns `collect_missing_fields` requesting `beneficiary.postal_code` inline, clearing the counterparty VASP check automatically with zero support tickets. |

---

## Sandbox Interface

The application provides a synchronized split-screen workspace:

* **Retail Simulator (Left):** Simulates the end-user mobile experience—showing form failures, manual review queues, and support escalations in **Current** mode versus inline remediation flows in **Proposal** mode.
* **Developer Cockpit (Right):** Live inspector displaying the active endpoint (`POST /v0/travel_rule_data` vs. `POST /v1/transfers`), formatted `crypto_transfer` JSON state transitions, and a real-time **Webhooks** event log.

---

## Running Locally

### Prerequisites
* Node.js >= 18
* npm

### Installation & Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build & Lint

```bash
npm run build
npm run preview
npm run lint
```

---

## Project Structure

```text
bridge-travel-rule-sandbox/
├── src/
│   ├── types/
│   │   └── compliance.ts         # crypto_transfer, next_action, and Travel Rule schemas
│   ├── lib/
│   │   └── mockEngine.ts         # Stateful compliance state machine & webhook event bus
│   ├── components/
│   │   ├── RetailSimulator.tsx   # Mobile end-user viewport for Current vs. Proposal flows
│   │   └── DeveloperCockpit.tsx  # Live JSON resource inspector & webhook event stream
│   ├── App.tsx                   # Split-screen layout, scenario selector, and mode toggle
│   ├── main.tsx                  # React entrypoint
│   └── index.css                 # Tailwind CSS configuration
├── package.json
├── tailwind.config.js
└── vite.config.ts
```
