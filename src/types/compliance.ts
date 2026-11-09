export type StripeTransferStatus = 
  | 'created'
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'canceled';

export type TravelRuleComplianceStatus =
  | 'action_required'
  | 'under_review'
  | 'cleared'
  | 'rejected'
  | 'quarantined'
  | 'refunded'
  | 'under_investigation';

export type NextActionType = 
  | 'complete_beneficiary_form'
  | 'verify_wallet_ownership'
  | 'collect_missing_fields'
  | 'authorize_identity_credential';

export interface CounterpartyVasp {
  vasp_id: string;
  name: string;
  protocol: 'trisa' | 'openvasp' | 'notabene' | 'idos';
  jurisdiction: string;
}

export interface NextAction {
  type: NextActionType;
  complete_beneficiary_form?: {
    reason: string;
    required_fields: string[];
    b2b_hold_reason: string;
    consequence_of_decline: string;
  };
  verify_wallet_ownership?: {
    method: 'eip712_signature' | 'satoshi_test';
    challenge: string;
    address: string;
  };
  collect_missing_fields?: {
    missing_fields: string[];
    reason: string;
    counterparty_vasp?: CounterpartyVasp;
  };
  authorize_identity_credential?: {
    provider: 'idos';
    wallet_app?: string;
    hop_description?: string;
    grant_scope: string;
    credential_subject: string;
    vault_endpoint: string;
  };
}

export interface TravelRuleData {
  id: string; // trs_...
  session_id: string;
  evaluation_rule: 
    | 'B2B_BENEFICIARY_DATA_MISSING_HOLD'
    | 'UNHOSTED_WALLET_RULE'
    | 'DELEGATED_THIRD_PARTY_KYC_IDOS'
    | 'MANUAL_HUMAN_OPS_INTERVENTION';
  compliance_status: TravelRuleComplianceStatus;
  protocol: 'trisa' | 'openvasp' | 'notabene' | 'idos' | 'none';
  counterparty_vasp?: CounterpartyVasp;
  ivms101_payload?: Record<string, unknown>;
  remediation_history: Array<{
    timestamp: number;
    action: string;
    summary: string;
  }>;
  last_error?: {
    code: string;
    message: string;
    decline_code?: string;
  };
}

export interface StripeCryptoTransfer {
  id: string;
  object: 'crypto_transfer';
  amount: number;
  formatted_amount: string;
  currency: 'usdc';
  network: 'base' | 'ethereum' | 'polygon';
  status: StripeTransferStatus;
  direction: 'outbound' | 'inbound';
  source: {
    type: 'deposit_account' | 'crypto_address';
    address?: string;
    account_id?: string;
  };
  destination: {
    type: 'crypto_address' | 'deposit_account';
    address?: string;
    account_id?: string;
  };
  client_secret: string;
  livemode: false;
  created: number;
  next_action: NextAction | null;
  travel_rule: TravelRuleData;
  metadata: Record<string, string>;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  payload: Record<string, unknown>;
}

export type ScenarioType = 
  | 'unallocated_beneficiary' 
  | 'unhosted_wallet' 
  | 'delegated_kyc_idos'
  | 'manual_outreach_hell';
