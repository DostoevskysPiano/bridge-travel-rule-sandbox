import { 
  StripeCryptoTransfer, 
  WebhookLog, 
  ScenarioType,
  CounterpartyVasp
} from '@/types/compliance';

export class MockBridgeEngine {
  private mode: 'legacy' | 'intent' = 'intent';
  private transfer: StripeCryptoTransfer | null = null;
  private listeners: ((transfer: StripeCryptoTransfer | null) => void)[] = [];
  private webhookListeners: ((log: WebhookLog) => void)[] = [];

  constructor(mode: 'legacy' | 'intent' = 'intent') {
    this.mode = mode;
  }

  public getMode(): 'legacy' | 'intent' {
    return this.mode;
  }

  public setMode(mode: 'legacy' | 'intent') {
    this.mode = mode;
    this.reset();
  }

  public subscribe(cb: (transfer: StripeCryptoTransfer | null) => void) {
    this.listeners.push(cb);
    return () => { 
      this.listeners = this.listeners.filter(l => l !== cb); 
    };
  }

  public subscribeWebhooks(cb: (log: WebhookLog) => void) {
    this.webhookListeners.push(cb);
    return () => { 
      this.webhookListeners = this.webhookListeners.filter(l => l !== cb); 
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.transfer ? JSON.parse(JSON.stringify(this.transfer)) : null));
  }

  private emitWebhook(event: string, payload: Record<string, unknown>) {
    const log: WebhookLog = {
      id: `evt_${Math.random().toString(36).substring(2, 10)}`,
      timestamp: new Date().toLocaleTimeString(),
      event,
      payload
    };
    this.webhookListeners.forEach(cb => cb(log));
  }

  public initiateTransfer(scenario: ScenarioType) {
    const transferId = `tr_${Math.random().toString(36).substring(2, 12)}`;
    const sessionId = `trs_${Math.random().toString(36).substring(2, 12)}`;
    const nowSec = Math.floor(Date.now() / 1000);

    // ==========================================
    // LEGACY BRIDGE MODEL (POST /v0 Fire-and-Forget)
    // ==========================================
    if (this.mode === 'legacy') {
      const isInbound = scenario === 'unallocated_beneficiary';
      this.transfer = {
        id: transferId,
        object: 'crypto_transfer',
        amount: scenario === 'unhosted_wallet' ? 1000000 : scenario === 'manual_outreach_hell' ? 350000 : scenario === 'delegated_kyc_idos' ? 750000 : 500000,
        formatted_amount: scenario === 'unhosted_wallet' ? '$10,000.00' : scenario === 'manual_outreach_hell' ? '$3,500.00' : scenario === 'delegated_kyc_idos' ? '$7,500.00' : '$5,000.00',
        currency: 'usdc',
        network: 'base',
        status: 'processing', // Black-box indefinite freeze
        direction: isInbound ? 'inbound' : 'outbound',
        source: {
          type: isInbound ? 'crypto_address' : 'deposit_account',
          address: isInbound ? '0x8fB92...381' : undefined,
          account_id: isInbound ? undefined : 'acct_cust_88219'
        },
        destination: {
          type: isInbound ? 'deposit_account' : 'crypto_address',
          address: isInbound ? undefined : '0x4B2e8...9a1',
          account_id: isInbound ? 'b2b_client_treasury_vault' : undefined
        },
        client_secret: `${transferId}_secret_${Math.random().toString(36).substring(2, 8)}`,
        livemode: false,
        created: nowSec,
        next_action: null, // Legacy: No programmatic next_action returned
        travel_rule: {
          id: sessionId,
          session_id: sessionId,
          evaluation_rule: scenario === 'unallocated_beneficiary' 
            ? 'B2B_BENEFICIARY_DATA_MISSING_HOLD'
            : scenario === 'unhosted_wallet'
            ? 'UNHOSTED_WALLET_RULE'
            : scenario === 'delegated_kyc_idos'
            ? 'DELEGATED_THIRD_PARTY_KYC_IDOS'
            : 'MANUAL_HUMAN_OPS_INTERVENTION',
          compliance_status: scenario === 'unallocated_beneficiary' ? 'quarantined' : 'under_review',
          protocol: 'none',
          remediation_history: []
        },
        metadata: {
          legacy_endpoint: '/v0/travel_rule_data',
          ingestion_mode: 'fire_and_forget_sync',
          b2b_status: scenario === 'unallocated_beneficiary' ? 'funds_held_missing_beneficiary_data' : 'standard_hold'
        }
      };

      this.notify();
      this.emitWebhook('transfer.created', { id: transferId, status: 'processing', amount: this.transfer.formatted_amount });
      this.emitWebhook('bridge.travel_rule_data.accepted', {
        id: sessionId,
        transfer_id: transferId,
        compliance_check: 'queued_async_blackbox',
        warning: scenario === 'unallocated_beneficiary'
          ? 'B2B client lacks beneficiary KYC. Funds held in custodial quarantine. No programmatic remediation form available in /v0.'
          : scenario === 'manual_outreach_hell'
          ? 'Zero IVMS-101 attributes collected. Flagged by Stripe AML. Ticket created for manual human compliance ops outreach.'
          : 'Compliance validation failed; no client remediation handle returned.'
      });
      return;
    }

    // ==========================================
    // STRIPE-NATIVE INTENT MODEL (POST /v1 Transfers)
    // ==========================================

    // Scenario 1: Received funds, B2B client lacks info -> Holds funds & requests form
    if (scenario === 'unallocated_beneficiary') {
      this.transfer = {
        id: transferId,
        object: 'crypto_transfer',
        amount: 500000,
        formatted_amount: '$5,000.00',
        currency: 'usdc',
        network: 'base',
        status: 'requires_action',
        direction: 'inbound',
        source: {
          type: 'crypto_address',
          address: '0x8fB92...381'
        },
        destination: {
          type: 'deposit_account',
          account_id: 'b2b_client_treasury_vault'
        },
        client_secret: `${transferId}_secret_${Math.random().toString(36).substring(2, 8)}`,
        livemode: false,
        created: nowSec,
        next_action: {
          type: 'complete_beneficiary_form',
          complete_beneficiary_form: {
            reason: 'B2B platform holds funds: Incoming $5,000.00 USDC received without complete beneficiary verification.',
            b2b_hold_reason: 'Receiving institution requires beneficiary identification form to satisfy FATF Rec. 16.',
            required_fields: ['beneficiary_legal_name', 'purpose_of_payment'],
            consequence_of_decline: 'Funds remain held pending Stripe manual compliance investigation (5–7 business days)'
          }
        },
        travel_rule: {
          id: sessionId,
          session_id: sessionId,
          evaluation_rule: 'B2B_BENEFICIARY_DATA_MISSING_HOLD',
          compliance_status: 'action_required',
          protocol: 'trisa',
          remediation_history: []
        },
        metadata: {
          architecture: 'intent_session',
          b2b_hold: 'beneficiary_verification_required'
        }
      };

      this.notify();
      this.emitWebhook('transfer.created', { id: transferId, status: 'requires_action', direction: 'inbound' });
      this.emitWebhook('travel_rule.action_required', {
        session_id: sessionId,
        action_type: 'complete_beneficiary_form',
        hold_status: 'b2b_client_awaiting_user_form'
      });

    // Scenario 2: Unhosted Wallet >$3k Self-Custody Proof
    } else if (scenario === 'unhosted_wallet') {
      const unhostedAddress = '0x71C9f...a83';
      const challengeMsg = `Stripe Bridge Attestation: I confirm sole control of unhosted address ${unhostedAddress} for transfer ${transferId} at timestamp ${nowSec}`;

      this.transfer = {
        id: transferId,
        object: 'crypto_transfer',
        amount: 1000000,
        formatted_amount: '$10,000.00',
        currency: 'usdc',
        network: 'base',
        status: 'requires_action',
        direction: 'outbound',
        source: {
          type: 'deposit_account',
          account_id: 'acct_cust_88219'
        },
        destination: {
          type: 'crypto_address',
          address: unhostedAddress
        },
        client_secret: `${transferId}_secret_${Math.random().toString(36).substring(2, 8)}`,
        livemode: false,
        created: nowSec,
        next_action: {
          type: 'verify_wallet_ownership',
          verify_wallet_ownership: {
            method: 'eip712_signature',
            challenge: challengeMsg,
            address: unhostedAddress
          }
        },
        travel_rule: {
          id: sessionId,
          session_id: sessionId,
          evaluation_rule: 'UNHOSTED_WALLET_RULE',
          compliance_status: 'action_required',
          protocol: 'none',
          remediation_history: []
        },
        metadata: {
          architecture: 'intent_session',
          rule_threshold: 'fincen_unhosted_exceeds_3k'
        }
      };

      this.notify();
      this.emitWebhook('transfer.created', { id: transferId, status: 'requires_action' });
      this.emitWebhook('travel_rule.ownership_challenge_issued', {
        session_id: sessionId,
        method: 'eip712_signature',
        wallet_address: unhostedAddress
      });

    // Scenario 3: Delegated KYC via Third-Party Identity Vault (e.g. idOS)
    } else if (scenario === 'delegated_kyc_idos') {
      const idosProvider: CounterpartyVasp = {
        vasp_id: 'vasp_idos_network',
        name: 'idOS Decentralized Identity Network',
        protocol: 'idos',
        jurisdiction: 'GLOBAL_ZK'
      };

      this.transfer = {
        id: transferId,
        object: 'crypto_transfer',
        amount: 750000,
        formatted_amount: '$7,500.00',
        currency: 'usdc',
        network: 'base',
        status: 'requires_action',
        direction: 'outbound',
        source: {
          type: 'deposit_account',
          account_id: 'acct_cust_88219'
        },
        destination: {
          type: 'crypto_address',
          address: '0x5C2a...18e'
        },
        client_secret: `${transferId}_secret_${Math.random().toString(36).substring(2, 8)}`,
        livemode: false,
        created: nowSec,
        next_action: {
          type: 'authorize_identity_credential',
          authorize_identity_credential: {
            provider: 'idos',
            wallet_app: 'MetaMask',
            hop_description: 'MetaMask (Wallet) -> idOS (Third-Party Identity Vault) -> Stripe Compliance Rail',
            grant_scope: 'ivms101_compliance_attestation',
            credential_subject: 'did:idos:eth:0x8821...39',
            vault_endpoint: 'https://nodes.idos.network/v1/grant'
          }
        },
        travel_rule: {
          id: sessionId,
          session_id: sessionId,
          evaluation_rule: 'DELEGATED_THIRD_PARTY_KYC_IDOS',
          compliance_status: 'action_required',
          protocol: 'idos',
          counterparty_vasp: idosProvider,
          remediation_history: []
        },
        metadata: {
          architecture: 'intent_session',
          privacy_model: 'zero_pii_custody_delegated_kyc'
        }
      };

      this.notify();
      this.emitWebhook('transfer.created', { id: transferId, status: 'requires_action' });
      this.emitWebhook('travel_rule.identity_grant_requested', {
        session_id: sessionId,
        provider: 'idOS',
        grant_scope: 'ivms101_compliance_attestation',
        privacy: 'zero_custody'
      });

    // Scenario 4: Missing data with Manual Bridge Team Outreach vs Programmatic Remediation
    } else if (scenario === 'manual_outreach_hell') {
      const partnerVASP: CounterpartyVasp = {
        vasp_id: 'vasp_fintech_partner',
        name: 'NeoBank EU / Bitstamp Node',
        protocol: 'trisa',
        jurisdiction: 'EU'
      };

      this.transfer = {
        id: transferId,
        object: 'crypto_transfer',
        amount: 350000,
        formatted_amount: '$3,500.00',
        currency: 'usdc',
        network: 'base',
        status: 'requires_action',
        direction: 'outbound',
        source: {
          type: 'deposit_account',
          account_id: 'acct_cust_88219'
        },
        destination: {
          type: 'crypto_address',
          address: '0x99A3b...4c2'
        },
        client_secret: `${transferId}_secret_${Math.random().toString(36).substring(2, 8)}`,
        livemode: false,
        created: nowSec,
        next_action: {
          type: 'collect_missing_fields',
          collect_missing_fields: {
            missing_fields: ['beneficiary.postal_code'],
            reason: 'Zero compliance data collected upfront. Stripe AML detected missing jurisdiction postal code for counterparty handshake.',
            counterparty_vasp: partnerVASP
          }
        },
        travel_rule: {
          id: sessionId,
          session_id: sessionId,
          evaluation_rule: 'MANUAL_HUMAN_OPS_INTERVENTION',
          compliance_status: 'action_required',
          protocol: 'trisa',
          counterparty_vasp: partnerVASP,
          remediation_history: []
        },
        metadata: {
          architecture: 'intent_session',
          avoids_human_support_ticket: 'true'
        }
      };

      this.notify();
      this.emitWebhook('transfer.created', { id: transferId, status: 'requires_action' });
      this.emitWebhook('travel_rule.action_required', {
        session_id: sessionId,
        missing_fields: ['beneficiary.postal_code'],
        programmatic_resolution: 'bypasses_human_ops_queue'
      });
    }
  }

  // ==========================================
  // REMEDIATION HANDLERS
  // ==========================================

  // Scenario 1: User submits the Beneficiary Form
  public submitBeneficiaryForm(formData: { legalName: string; purpose: string }) {
    if (!this.transfer) return;
    this.transfer.status = 'processing';
    this.transfer.travel_rule.compliance_status = 'under_review';
    this.transfer.next_action = null;
    this.transfer.travel_rule.remediation_history.push({
      timestamp: Date.now(),
      action: 'complete_beneficiary_form',
      summary: `User completed beneficiary form: ${formData.legalName} (${formData.purpose})`
    });

    this.notify();
    this.emitWebhook('travel_rule.beneficiary_form_submitted', {
      session_id: this.transfer.travel_rule.id,
      beneficiary_legal_name: formData.legalName,
      purpose_of_payment: formData.purpose,
      b2b_hold_status: 'released'
    });

    setTimeout(() => {
      if (this.transfer) {
        this.transfer.status = 'succeeded';
        this.transfer.travel_rule.compliance_status = 'cleared';
        this.notify();
        this.emitWebhook('travel_rule.cleared', {
          session_id: this.transfer.travel_rule.id,
          resolution: 'b2b_hold_cleared_funds_released'
        });
        this.emitWebhook('transfer.succeeded', {
          transfer_id: this.transfer.id,
          amount: this.transfer.formatted_amount,
          direction: 'inbound',
          credited_to_balance: true
        });
      }
    }, 1200);
  }

  // Scenario 1: User says NO / declines the form -> Funds stay held for Stripe Investigation
  public declineBeneficiaryForm() {
    if (!this.transfer) return;
    this.transfer.status = 'processing';
    this.transfer.travel_rule.compliance_status = 'under_investigation';
    this.transfer.travel_rule.remediation_history.push({
      timestamp: Date.now(),
      action: 'decline_beneficiary_form',
      summary: 'User declined beneficiary identification form. Escalated to Stripe investigation.'
    });

    this.transfer.metadata.investigation_state = 'pending_stripe_compliance_investigation';
    this.transfer.metadata.estimated_investigation_days = '5-7 business days';

    this.notify();
    this.emitWebhook('travel_rule.beneficiary_form_declined', {
      session_id: this.transfer.travel_rule.id,
      action: 'escalated_to_stripe_aml_queue',
      hold_maintained: true
    });
    this.emitWebhook('stripe.compliance_investigation_queued', {
      transfer_id: this.transfer.id,
      reason: 'beneficiary_unverified_user_declined_form',
      eta: '5-7_business_days'
    });
  }

  // Allow re-opening the form if user was in investigation state
  public reopenBeneficiaryForm() {
    if (!this.transfer) return;
    this.transfer.status = 'requires_action';
    this.transfer.travel_rule.compliance_status = 'action_required';
    this.transfer.next_action = {
      type: 'complete_beneficiary_form',
      complete_beneficiary_form: {
        reason: 'B2B platform holds funds: Incoming $5,000.00 USDC received without complete beneficiary verification.',
        b2b_hold_reason: 'Receiving institution requires beneficiary identification form to satisfy FATF Rec. 16.',
        required_fields: ['beneficiary_legal_name', 'purpose_of_payment'],
        consequence_of_decline: 'Funds remain held pending Stripe manual compliance investigation (5–7 business days)'
      }
    };
    this.notify();
  }

  // Scenario 1 (Legacy): Submit janky intake form -> Fails with 500 error & downstream schema rejection
  public submitLegacyJankyForm(formData: Record<string, string>) {
    if (!this.transfer) return;
    this.transfer.status = 'processing';
    this.transfer.travel_rule.compliance_status = 'rejected';
    this.transfer.travel_rule.last_error = {
      code: 'ERR_UNHANDLED_IVMS101_SCHEMA_MISMATCH',
      message: 'Failed to deserialize payload: TR_ERR_CODE_9021. Upstream VASP rejected batch handshake. Originator / Beneficiary schema mismatch. Reference ID: req_legacy_998124.',
      decline_code: 'unhandled_protocol_exception'
    };
    this.transfer.travel_rule.remediation_history.push({
      timestamp: Date.now(),
      action: 'legacy_janky_form_failed',
      summary: 'Sync POST /v0/travel_rule_data failed: 500 Downstream schema mismatch. No remediation contract.'
    });
    this.transfer.metadata.legacy_form_stage = 'error_unhelpful';
    this.transfer.metadata.last_error = 'TR_ERR_CODE_9021';
    this.transfer.metadata.quarantined_reason = 'unhandled_schema_mismatch_no_remediation_contract';

    this.notify();
    this.emitWebhook('bridge.v0.form_submission_failed', {
      endpoint: '/v0/travel_rule_data',
      http_status: 500,
      error_code: 'ERR_UNHANDLED_IVMS101_SCHEMA_MISMATCH',
      message: 'Internal compliance engine failure: Downstream VASP rejected serialized payload. No client remediation handle provided.',
      custody_action: 'funds_quarantined_indefinitely',
      submitted_fields: formData
    });
  }

  public resetLegacyForm() {
    if (!this.transfer) return;
    this.transfer.travel_rule.compliance_status = 'quarantined';
    delete this.transfer.travel_rule.last_error;
    this.transfer.metadata.legacy_form_stage = 'pending_janky_submission';
    this.notify();
  }

  // Scenario 2 (Legacy): Submit crappy wallet proof (screenshot or Satoshi microtx) -> 3-5 day review & user drop-off
  public submitLegacyWalletForm(data: Record<string, string>) {
    if (!this.transfer) return;
    this.transfer.status = 'processing';
    this.transfer.travel_rule.compliance_status = 'under_review';
    this.transfer.travel_rule.remediation_history.push({
      timestamp: Date.now(),
      action: 'crappy_wallet_proof_submitted',
      summary: 'User submitted manual screenshot / micro-deposit hash. Queued for 3-5 day ops review.'
    });
    this.transfer.metadata.legacy_wallet_stage = 'manual_review_queued';
    this.transfer.metadata.estimated_review_sla = '3_to_5_business_days';
    this.transfer.metadata.drop_off_risk = '84% user churn';

    this.notify();
    this.emitWebhook('bridge.v0.manual_wallet_proof_queued', {
      transfer_id: this.transfer.id,
      method: data.method || 'manual_screenshot_or_microtx',
      queue_status: 'pending_compliance_analyst_review',
      estimated_sla: '3_to_5_business_days',
      drop_off_risk: '84% churn',
      warning: 'Bridge /v0 lacks cryptographic signature handle; fallback to manual human ops.'
    });
  }

  public resetLegacyWalletForm() {
    if (!this.transfer) return;
    this.transfer.metadata.legacy_wallet_stage = 'pending_crappy_submission';
    this.transfer.travel_rule.compliance_status = 'under_review';
    this.notify();
  }

  public attestSignature(sig: string) {
    if (!this.transfer) return;
    this.transfer.status = 'processing';
    this.transfer.travel_rule.compliance_status = 'under_review';
    this.transfer.next_action = null;
    this.transfer.travel_rule.remediation_history.push({
      timestamp: Date.now(),
      action: 'verify_wallet_ownership',
      summary: `EIP-712 cryptographic signature verified`
    });

    this.notify();
    this.emitWebhook('travel_rule.attestation_verified', {
      session_id: this.transfer.travel_rule.id,
      signature: sig,
      method: 'eip712_signature'
    });

    setTimeout(() => {
      if (this.transfer) {
        this.transfer.status = 'succeeded';
        this.transfer.travel_rule.compliance_status = 'cleared';
        this.notify();
        this.emitWebhook('travel_rule.cleared', {
          session_id: this.transfer.travel_rule.id,
          unhosted_verified: true
        });
        this.emitWebhook('transfer.succeeded', {
          transfer_id: this.transfer.id,
          tx_hash: '0x3c89aa1029fe...aa',
          network: 'base'
        });
      }
    }, 1000);
  }

  public remediateFields(fields: Record<string, string>) {
    if (!this.transfer) return;
    this.transfer.status = 'processing';
    this.transfer.travel_rule.compliance_status = 'under_review';
    this.transfer.next_action = null;
    this.transfer.travel_rule.remediation_history.push({
      timestamp: Date.now(),
      action: 'collect_missing_fields',
      summary: `Submitted missing fields: ${Object.keys(fields).join(', ')}`
    });

    this.notify();
    this.emitWebhook('travel_rule.remediation_submitted', {
      session_id: this.transfer.travel_rule.id,
      submitted_fields: fields
    });

    setTimeout(() => {
      if (this.transfer) {
        this.transfer.status = 'succeeded';
        this.transfer.travel_rule.compliance_status = 'cleared';
        this.notify();
        this.emitWebhook('travel_rule.cleared', {
          session_id: this.transfer.travel_rule.id,
          resolution: 'automated_inline_resolution_no_human_tickets'
        });
        this.emitWebhook('transfer.succeeded', {
          transfer_id: this.transfer.id,
          tx_hash: '0x8f2a1b9c7d4e3f...1c',
          network: 'base'
        });
      }
    }, 1200);
  }

  // Scenario 3 (Legacy): MetaMask hits /v0 without local PII -> Multi-hop desync failure
  public submitLegacyDelegatedKyc() {
    if (!this.transfer) return;
    this.transfer.status = 'processing';
    this.transfer.travel_rule.compliance_status = 'rejected';
    this.transfer.travel_rule.last_error = {
      code: 'ERR_MULTI_HOP_DELEGATION_DESYNC',
      message: 'Bridge /v0 sync endpoint rejected payload: Contracted entity (MetaMask) owns zero local PII. Third-party identity provider (idOS) asynchronous webhook callback was dropped.',
      decline_code: 'unsupported_delegated_identity'
    };
    this.transfer.travel_rule.remediation_history.push({
      timestamp: Date.now(),
      action: 'legacy_multi_hop_failed',
      summary: 'Bridge /v0 sync failure: Bridge expects local database PII from MetaMask. Third-party idOS callback cannot be mapped.'
    });
    this.transfer.metadata.legacy_kyc_stage = 'error_desync';
    this.transfer.metadata.error = 'ERR_MULTI_HOP_DELEGATION_DESYNC';

    this.notify();
    this.emitWebhook('bridge.v0.multi_hop_delegation_failed', {
      endpoint: '/v0/travel_rule_data',
      http_status: 422,
      error_code: 'ERR_MULTI_HOP_DELEGATION_DESYNC',
      wallet: 'MetaMask',
      third_party_vault: 'idOS Network',
      message: 'Bridge /v0 expects monolithic PII from contracted entity (MetaMask). Third-party identity relays cannot deliver asynchronous callbacks to synchronous /v0.',
      custody_action: 'transfer_quarantined_indefinitely'
    });
  }

  public resetLegacyDelegatedKyc() {
    if (!this.transfer) return;
    this.transfer.travel_rule.compliance_status = 'under_review';
    delete this.transfer.travel_rule.last_error;
    this.transfer.metadata.legacy_kyc_stage = 'pending_attempt';
    this.notify();
  }

  public authorizeIdosCredential() {
    if (!this.transfer) return;
    this.transfer.status = 'processing';
    this.transfer.travel_rule.compliance_status = 'under_review';
    this.transfer.next_action = null;
    this.transfer.travel_rule.remediation_history.push({
      timestamp: Date.now(),
      action: 'authorize_identity_credential',
      summary: 'MetaMask authorized third-party idOS vault to relay zero-knowledge compliance pass directly to Stripe'
    });

    this.notify();
    this.emitWebhook('wallet.metamask.hop_authorized', {
      transfer_id: this.transfer.id,
      wallet: 'MetaMask',
      third_party_provider: 'idOS Decentralized Identity Network',
      target: 'stripe_compliance_rail',
      action: 'grant_access_token',
      privacy_mode: 'zero_raw_pii_stored_by_metamask'
    });

    setTimeout(() => {
      this.emitWebhook('travel_rule.idos_grant_authorized', {
        session_id: this.transfer?.travel_rule.id,
        provider: 'idOS',
        credential_type: 'zk_ivms101_compliance_pass',
        multi_hop_route: 'MetaMask -> idOS Vault -> Stripe Rail'
      });
    }, 400);

    setTimeout(() => {
      if (this.transfer) {
        this.transfer.status = 'succeeded';
        this.transfer.travel_rule.compliance_status = 'cleared';
        this.notify();
        this.emitWebhook('travel_rule.cleared', {
          session_id: this.transfer.travel_rule.id,
          privacy_verified: 'true',
          delegated_kyc: 'cleared_via_idos',
          multi_hop_handshake: 'succeeded'
        });
        this.emitWebhook('transfer.succeeded', {
          transfer_id: this.transfer.id,
          amount: this.transfer.formatted_amount,
          tx_hash: '0x1d44bc0281...55',
          network: 'base'
        });
      }
    }, 1200);
  }

  public reset() {
    this.transfer = null;
    this.notify();
  }
}

export const mockEngine = new MockBridgeEngine('intent');
