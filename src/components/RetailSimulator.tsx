import React, { useState, useEffect } from 'react';
import { mockEngine } from '@/lib/mockEngine';
import { StripeCryptoTransfer, ScenarioType } from '@/types/compliance';
import { 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  ArrowDownLeft, 
  RotateCcw,
  Sparkles,
  MessageSquare,
  KeyRound,
  FileText,
  HelpCircle,
  XCircle,
  ChevronLeft,
  Upload,
  UserX,
  AlertTriangle
} from 'lucide-react';

interface Props {
  mode: 'legacy' | 'intent';
  scenario: ScenarioType;
}

export const RetailSimulator: React.FC<Props> = ({ mode, scenario }) => {
  const [transfer, setTransfer] = useState<StripeCryptoTransfer | null>(null);
  const [beneficiaryName, setBeneficiaryName] = useState('Elena Rostova');
  const [paymentPurpose, setPaymentPurpose] = useState('Contractor / Invoice Payment');
  const [postalCode, setPostalCode] = useState('10001');
  const [timer, setTimer] = useState(0);

  // Legacy Case 1: Janky form & unhelpful error state
  const [legacyStage, setLegacyStage] = useState<'form' | 'error' | 'explanation'>('form');
  const [legacyLegalName, setLegacyLegalName] = useState('Elena Rostova');
  const [legacyLei, setLegacyLei] = useState('5493006MHB84DD0ZWV18');
  const [legacyRoutingCode, setLegacyRoutingCode] = useState('0x4B2e8...9a1-TRISA');
  const [legacyConsent, setLegacyConsent] = useState(true);

  // Legacy Case 2: Crappy wallet proof form & user drop-off
  const [legacyWalletStage, setLegacyWalletStage] = useState<'form' | 'submitted' | 'explanation'>('form');
  const [walletProofMethod, setWalletProofMethod] = useState<'microtx' | 'screenshot'>('microtx');
  const [microTxHash, setMicroTxHash] = useState('0x4b9a22f08a9c...102');
  const [isSigningSimulated, setIsSigningSimulated] = useState(false);

  // Legacy Case 3: MetaMask & Third-Party Identity Vault multi-hop failure
  const [legacyKycStage, setLegacyKycStage] = useState<'intro' | 'error' | 'explanation'>('intro');
  const [isAuthorizingIdos, setIsAuthorizingIdos] = useState(false);

  useEffect(() => {
    setLegacyStage('form');
    setLegacyWalletStage('form');
    setLegacyKycStage('intro');
    setIsSigningSimulated(false);
    setIsAuthorizingIdos(false);
  }, [mode, scenario]);

  const handleLegacyJankySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mockEngine.submitLegacyJankyForm({
      beneficiary_legal_name: legacyLegalName,
      lei_code: legacyLei,
      vasp_routing_code: legacyRoutingCode
    });
    setLegacyStage('error');
  };

  const handleLegacyRetry = () => {
    mockEngine.resetLegacyForm();
    setLegacyStage('form');
  };

  const handleLegacyWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mockEngine.submitLegacyWalletForm({
      method: walletProofMethod === 'microtx' ? 'satoshi_micro_deposit' : 'hardware_screenshot_upload',
      tx_hash: walletProofMethod === 'microtx' ? microTxHash : 'ledger_photo_2026.png'
    });
    setLegacyWalletStage('submitted');
  };

  const handleLegacyWalletRetry = () => {
    mockEngine.resetLegacyWalletForm();
    setLegacyWalletStage('form');
  };

  const handleLegacyKycSubmit = () => {
    mockEngine.submitLegacyDelegatedKyc();
    setLegacyKycStage('error');
  };

  const handleLegacyKycRetry = () => {
    mockEngine.resetLegacyDelegatedKyc();
    setLegacyKycStage('intro');
  };

  useEffect(() => {
    const unsub = mockEngine.subscribe(setTransfer);
    return () => unsub();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (mode === 'legacy' && transfer?.status === 'processing') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, transfer]);

  const handleStart = () => {
    mockEngine.initiateTransfer(scenario);
  };

  const handleBeneficiarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiaryName) return;
    mockEngine.submitBeneficiaryForm({
      legalName: beneficiaryName,
      purpose: paymentPurpose
    });
  };

  const handleBeneficiaryDecline = () => {
    mockEngine.declineBeneficiaryForm();
  };

  const handleReopenForm = () => {
    mockEngine.reopenBeneficiaryForm();
  };

  const handleAttest = () => {
    setIsSigningSimulated(true);
    setTimeout(() => {
      mockEngine.attestSignature('0x6c9d7a8e...mock_sig');
      setIsSigningSimulated(false);
    }, 700);
  };

  const handleRemediatePostal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postalCode) return;
    mockEngine.remediateFields({ 'beneficiary.postal_code': postalCode });
  };

  const handleAuthorizeIdos = () => {
    setIsAuthorizingIdos(true);
    setTimeout(() => {
      mockEngine.authorizeIdosCredential();
      setIsAuthorizingIdos(false);
    }, 700);
  };

  const isInbound = scenario === 'unallocated_beneficiary';

  return (
    <div className="w-full max-w-[380px] mx-auto bg-white border-[7px] border-slate-200/90 rounded-[3.25rem] p-5 shadow-2xl shadow-indigo-100/80 flex flex-col h-[640px] relative select-none">
      {/* Sleek iOS Style Dynamic Island / Status Bar */}
      <div className="flex justify-between items-center px-4 py-1 text-[11px] font-semibold text-slate-800 mb-2">
        <span>9:41</span>
        <div className="w-20 h-4.5 bg-slate-900 rounded-full flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-2.5" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span>5G</span>
          <div className="w-4 h-2.5 border border-slate-800 rounded-xs p-0.5 flex items-center">
            <div className="h-full w-full bg-slate-800 rounded-[1px]" />
          </div>
        </div>
      </div>

      <div className="p-2 flex-1 flex flex-col justify-between overflow-y-auto">
        {/* State 0: Initial Screen */}
        {!transfer && (
          <div className="my-auto space-y-5 text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm transition-transform hover:scale-105 ${
              isInbound ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-[#635bff]'
            }`}>
              {isInbound ? <ArrowDownLeft className="w-8 h-8" /> : <ArrowRight className="w-8 h-8" />}
            </div>

            <div>
              <h3 className="font-bold text-xl text-slate-900 tracking-tight">
                {isInbound ? 'Incoming Deposit Simulation' : 'Withdraw USDC'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
                {scenario === 'unallocated_beneficiary' && 'Inbound deposit where the B2B platform lacks beneficiary KYC and must hold funds.'}
                {scenario === 'unhosted_wallet' && 'Withdraw $10,000 to personal self-custody cold storage.'}
                {scenario === 'delegated_kyc_idos' && 'MetaMask holds zero PII and delegates KYC to an external vault (idOS), creating an extra hop.'}
                {scenario === 'manual_outreach_hell' && 'Your retail user Alex is furious because his $3,500 USDC payout was frozen by Bridge.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-left text-xs space-y-2.5 border border-slate-100">
              <div className="flex justify-between text-slate-500">
                <span>Transfer Amount</span>
                <span className="text-slate-900 font-bold text-base">
                  {scenario === 'unhosted_wallet' ? '$10,000.00' : scenario === 'manual_outreach_hell' ? '$3,500.00' : scenario === 'delegated_kyc_idos' ? '$7,500.00' : '$5,000.00'}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Network</span>
                <span className="text-slate-700 font-medium">Base (USDC)</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{isInbound ? 'Deposit Status' : 'Counterparty Entity'}</span>
                <span className="text-[#635bff] font-semibold text-xs">
                  {scenario === 'unallocated_beneficiary' && 'B2B Client Hold (Missing Beneficiary Info)'}
                  {scenario === 'unhosted_wallet' && 'Self-Custody Address (0x71C...a83)'}
                  {scenario === 'delegated_kyc_idos' && 'MetaMask ➔ idOS 3rd-Party Vault'}
                  {scenario === 'manual_outreach_hell' && 'Escalation: PayFlow B2B ➔ Bridge Ops'}
                </span>
              </div>
            </div>

            <button 
              onClick={handleStart}
              className={`w-full py-3.5 text-white font-semibold rounded-2xl text-sm transition shadow-lg hover:shadow-xl active:scale-[0.98] ${
                isInbound 
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200' 
                  : 'bg-[#635bff] hover:bg-[#5346e0] shadow-indigo-200'
              }`}
            >
              {isInbound ? 'Simulate Inbound Deposit' : 'Confirm & Dispatch Transfer'}
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* LEGACY MODEL: Indefinite Freeze & Drop-off               */}
        {/* ======================================================== */}
        {transfer && mode === 'legacy' && (
          <div className="my-auto space-y-3.5">
            {/* Scenario 4: Funny Human Ops Zendesk Chat Overload */}
            {scenario === 'manual_outreach_hell' ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-500/10 border border-amber-200 text-amber-900 rounded-2xl text-center">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-xs text-amber-800">
                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>Retail Transfer Frozen: AML Compliance Hold</span>
                  </div>
                  <span className="text-[11px] text-slate-600 block mt-0.5 font-mono">
                    Hold Duration: {timer}s (B2B Escalation Ticket #8921)
                  </span>
                </div>

                {/* The Funny Manual Zendesk Chatbox from Business Customer Perspective */}
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-3.5 shadow-lg border border-slate-800 text-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                        G
                      </div>
                      <div>
                        <span className="font-semibold text-white block text-[11px]">Greg (Bridge Compliance Ops)</span>
                        <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online via Zendesk Partner Queue
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">Ticket #8921</span>
                  </div>

                  {/* Chat Bubbles */}
                  <div className="space-y-2 text-[11px]">
                    <div className="bg-[#635bff] p-2.5 rounded-xl rounded-tr-xs max-w-[85%] ml-auto text-white leading-snug">
                      <p className="font-semibold text-indigo-200 text-[10px] mb-0.5">You (PayFlow Platform Lead)</p>
                      Greg, our retail customer Alex is LIVID. He sent $3,500 USDC 4 days ago, his rent is overdue, and he&apos;s threatening to sue us and blow up Twitter. Why did Bridge freeze his funds?!
                    </div>

                    <div className="bg-slate-800 p-2.5 rounded-xl rounded-tl-xs max-w-[85%] text-slate-200 leading-snug">
                      <p className="font-semibold text-blue-300 text-[10px] mb-0.5">Greg (Compliance Rep)</p>
                      Hey Sarah! 👋 Yeah, your API call to POST /v0 didn&apos;t pass the recipient&apos;s physical postal code. Stripe AML flagged it. Can you email Alex, have him get his landlord&apos;s certified utility bill from the last 30 days, and email it to us?
                    </div>

                    <div className="bg-[#635bff] p-2.5 rounded-xl rounded-tr-xs max-w-[85%] ml-auto text-white leading-snug">
                      <p className="font-semibold text-indigo-200 text-[10px] mb-0.5">You (PayFlow Platform Lead)</p>
                      Are you insane?! We are an automated self-serve platform! Alex doesn&apos;t know his landlord&apos;s personal utility bill! He just closed his account and left a 1-star review. Why can&apos;t your API prompt him inline?!
                    </div>

                    <div className="bg-slate-800 p-2.5 rounded-xl rounded-tl-xs max-w-[85%] text-slate-200 leading-snug">
                      <p className="font-semibold text-blue-300 text-[10px] mb-0.5">Greg (Compliance Rep)</p>
                      Totally understand the frustration! 🙏 Bridge /v0 doesn&apos;t have an interactive client contract. Once you get those PDF attachments to us, our manual queue takes 3–5 business days. Thanks for being a Bridge partner! ✨
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl text-left space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800 text-[10px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>The B2B Platform Disaster:</span>
                  </div>
                  <ul className="text-[9.5px] text-slate-600 space-y-0.5 list-disc list-inside">
                    <li><strong>Angry Retail Customer:</strong> Alex churned, left a 1-star review, and filed a CFPB complaint.</li>
                    <li><strong>Human Support Waste:</strong> Your team spent 45 minutes playing telephone between an angry retail user and Bridge ops.</li>
                    <li><strong>Cost:</strong> ~$45/support ticket + 78% retail churn.</li>
                  </ul>
                </div>
              </div>
            ) : scenario === 'unallocated_beneficiary' ? (
              /* Case 1 Legacy: Janky Form -> Unhelpful Error -> Explanation State */
              <div className="space-y-3">
                {/* 1. Janky Intake Form */}
                {legacyStage === 'form' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-slate-800 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">
                          FORM TR-409B (v0.8.2-DEPRECATED)
                        </span>
                        <span className="text-[10px] font-mono text-amber-700 font-bold">SYNC HOLD</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 mt-1.5">Manual Beneficiary Intake</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        B2B client must collect raw IVMS-101 attributes to attempt synchronous submission to Bridge /v0.
                      </p>
                    </div>

                    <form onSubmit={handleLegacyJankySubmit} className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
                      <div>
                        <label className="text-[10px] font-mono text-slate-600 block mb-1">
                          1.1 BENEFICIARY_LEGAL_NAME:
                        </label>
                        <input 
                          type="text" 
                          value={legacyLegalName}
                          onChange={(e) => setLegacyLegalName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-600 block mb-1">
                          1.2 LEGAL ENTITY IDENTIFIER (LEI) / TAX ID:
                        </label>
                        <input 
                          type="text" 
                          value={legacyLei}
                          onChange={(e) => setLegacyLei(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-600 block mb-1">
                          3.4b INTERMEDIARY VASP PROTOCOL HEX:
                        </label>
                        <input 
                          type="text" 
                          value={legacyRoutingCode}
                          onChange={(e) => setLegacyRoutingCode(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-500"
                          required
                        />
                      </div>

                      <div className="flex items-start gap-1.5 pt-0.5">
                        <input 
                          type="checkbox" 
                          id="legacy-consent"
                          checked={legacyConsent}
                          onChange={(e) => setLegacyConsent(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-slate-700 cursor-pointer"
                        />
                        <label htmlFor="legacy-consent" className="text-[9px] text-slate-500 leading-tight">
                          I certify payload conforms to downstream VASP schema without validation handle.
                        </label>
                      </div>

                      <button 
                        type="submit"
                        className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono font-medium rounded-lg text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                      >
                        <span>Submit to Bridge POST /v0</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      </button>
                    </form>

                    <div className="p-2 bg-amber-50/80 border border-amber-200/80 rounded-xl text-left">
                      <span className="text-[10px] text-amber-800 leading-tight block">
                        ⚠️ <strong>Note:</strong> Bridge /v0 is a synchronous fire-and-forget sync endpoint with zero bidirectional error recovery.
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Unhelpful Error State */}
                {legacyStage === 'error' && (
                  <div className="space-y-3 text-center my-auto py-2">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
                      <XCircle className="w-7 h-7" />
                    </div>

                    <div>
                      <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-800 font-mono text-[9px] font-bold rounded-full mb-1">
                        HTTP 500 INTERNAL_SYNC_FAIL
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">Compliance Sync Rejected</h3>
                    </div>

                    {/* Monospace Error Box */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left font-mono text-[10px] space-y-1 shadow-md">
                      <div className="flex items-center justify-between text-rose-400 font-semibold border-b border-slate-800 pb-1 text-[9px]">
                        <span>ERR_CODE: TR_ERR_CODE_9021</span>
                        <span>Trace: req_legacy_998124</span>
                      </div>
                      <p className="text-slate-300 leading-tight">
                        Failed to deserialize IVMS-101 payload: Downstream VASP rejected batch handshake. Schema mismatch at element Beneficiary.IntermediaryVasp.
                      </p>
                      <p className="text-slate-500 text-[8px] pt-0.5">
                        Action: Terminal drop. No client remediation contract returned.
                      </p>
                    </div>

                    <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl text-left text-xs text-slate-600 space-y-0.5">
                      <span className="text-[10px] font-bold text-rose-800 block">Funds Status: Quarantined Indefinitely</span>
                      <p className="text-[10px] leading-snug">
                        Your $5,000.00 USDC deposit remains locked in custodial hold. Please do not re-submit. An ops ticket has been placed into the manual backlog.
                      </p>
                    </div>

                    {/* Button to bring up the Explanation State */}
                    <div className="space-y-2 pt-1">
                      <button 
                        type="button"
                        onClick={() => setLegacyStage('explanation')}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <HelpCircle className="w-4 h-4 text-white" />
                        <span>Why did this fail? (Explain Error)</span>
                      </button>

                      <button 
                        type="button"
                        onClick={handleLegacyRetry}
                        className="text-[10px] text-slate-500 hover:text-slate-800 underline underline-offset-2 transition"
                      >
                        Retry Form Submission
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Explanation State */}
                {legacyStage === 'explanation' && (
                  <div className="space-y-2.5 text-left py-1">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <button 
                        type="button"
                        onClick={() => setLegacyStage('error')}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Back to Error
                      </button>
                      <span className="text-[9px] font-mono text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        ARCHITECTURAL ANALYSIS
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-xs text-slate-900">Why Bridge /v0 Broke Down</h3>
                      <p className="text-[10px] text-slate-500">
                        Root cause of legacy compliance API failure
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {/* Breakdown 1 */}
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                        <span className="font-bold text-[10px] text-slate-800 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px]">1</span>
                          Disconnected Ad-Hoc Intake
                        </span>
                        <p className="text-[9.5px] text-slate-600 leading-normal pl-4.5">
                          Because `/v0` lacks a machine-readable `next_action` descriptor, the B2B platform had to guess and cobble together an unvalidated form with zero schema alignment.
                        </p>
                      </div>

                      {/* Breakdown 2 */}
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                        <span className="font-bold text-[10px] text-slate-800 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px]">2</span>
                          Fire-and-Forget Protocol Blindness
                        </span>
                        <p className="text-[9.5px] text-slate-600 leading-normal pl-4.5">
                          `/v0/travel_rule_data` is a synchronous one-way POST. When counterparty VASPs differ in schema (TRISA vs Notabene), Bridge cannot negotiate or prompt the user for specific fixes—it crashes with an opaque 500.
                        </p>
                      </div>

                      {/* Breakdown 3 */}
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                        <span className="font-bold text-[10px] text-slate-800 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px]">3</span>
                          Permanent Custodial Deadlock
                        </span>
                        <p className="text-[9.5px] text-slate-600 leading-normal pl-4.5">
                          Without Stripe&apos;s intent state machine (`status: &quot;requires_action&quot;`), errors are terminal. Funds stay locked in quarantine, requiring manual human ops tickets.
                        </p>
                      </div>
                    </div>

                    <div className="p-2 bg-indigo-50 border border-indigo-200/80 rounded-xl text-left">
                      <span className="text-[10px] font-bold text-[#635bff] block">
                        ✨ The Stripe /v1 Solution:
                      </span>
                      <span className="text-[9.5px] text-slate-600 leading-normal block mt-0.5">
                        Toggle <strong>Proposal</strong> in the top header to see how Stripe&apos;s Next Action engine replaces this broken flow with 1.2s inline remediation.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : scenario === 'unhosted_wallet' ? (
              /* Scenario 2 Legacy: Crappy Wallet Form -> Manual 3-5 Day Queue & Drop-off -> Explanation */
              <div className="space-y-3">
                {/* 1. Crappy Form */}
                {legacyWalletStage === 'form' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-xl text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                          WALLET OWNERSHIP INTAKE (MANUAL OPS)
                        </span>
                        <span className="text-[10px] font-mono text-rose-700 font-bold">&gt;$3K HOLD</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 mt-1.5">Self-Custody Ownership Proof</h4>
                      <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                        Bridge /v0 mandates proof of key ownership for <span className="font-mono text-[9px] font-semibold text-slate-800">0x71C9...a83</span>, but provides no Web3 signing protocol. Please complete a manual method below.
                      </p>
                    </div>

                    <form onSubmit={handleLegacyWalletSubmit} className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
                      {/* Method Switcher Tabs */}
                      <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-[10px] font-semibold text-slate-700">
                        <button
                          type="button"
                          onClick={() => setWalletProofMethod('microtx')}
                          className={`flex-1 py-1 rounded-md transition ${
                            walletProofMethod === 'microtx' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          Option A: Satoshi Microtx
                        </button>
                        <button
                          type="button"
                          onClick={() => setWalletProofMethod('screenshot')}
                          className={`flex-1 py-1 rounded-md transition ${
                            walletProofMethod === 'screenshot' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          Option B: Photo Upload
                        </button>
                      </div>

                      {walletProofMethod === 'microtx' ? (
                        <div className="space-y-2 bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                          <p className="text-[10px] leading-snug">
                            Send exactly <strong className="text-slate-900">0.00341 ETH</strong> (~$11.50 in gas fees) from your wallet to Bridge review address:
                          </p>
                          <div className="font-mono text-[9px] bg-slate-100 p-1.5 rounded border border-slate-200 text-slate-800 break-all select-all">
                            0x992Ba109Fe8813B41C902aa
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-slate-600 block mb-0.5">
                              Paste On-Chain Transaction Hash:
                            </label>
                            <input
                              type="text"
                              value={microTxHash}
                              onChange={(e) => setMicroTxHash(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none"
                              required
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                          <p className="text-[10px] leading-snug">
                            Photograph your physical Ledger / Trezor screen showing the address next to a handwritten note with today&apos;s date:
                          </p>
                          <div className="border border-dashed border-slate-300 rounded-lg p-2.5 text-center bg-slate-50">
                            <Upload className="w-5 h-5 text-slate-400 mx-auto mb-0.5" />
                            <span className="text-[10px] font-medium text-slate-700 block">hardware_wallet_photo.jpg</span>
                            <span className="text-[9px] text-emerald-600 font-semibold">Attached (1.8 MB)</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full mt-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-mono font-medium rounded-lg text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                      >
                        <span>Submit for Compliance Review</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      </button>
                    </form>

                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-left">
                      <span className="text-[10px] text-rose-800 leading-tight block">
                        ⚠️ <strong>Friction Alert:</strong> Company lacks Web3 signing APIs and forces manual Satoshi tests or screenshots. 84% of retail customers abandon the withdrawal at this step.
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Submitted & High Drop-off State */}
                {legacyWalletStage === 'submitted' && (
                  <div className="space-y-3 text-center my-auto py-2">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                      <Clock className="w-7 h-7 animate-pulse" />
                    </div>

                    <div>
                      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 font-mono text-[9px] font-bold rounded-full mb-1">
                        PENDING MANUAL REVIEW (3–5 DAYS)
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">$10,000.00 Transfer Frozen</h3>
                    </div>

                    {/* Monospace Queue Card */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left font-mono text-[10px] space-y-1 shadow-md">
                      <div className="flex items-center justify-between text-amber-400 font-semibold border-b border-slate-800 pb-1 text-[9px]">
                        <span>QUEUE POSITION: #742</span>
                        <span>SLA: 3–5 BUSINESS DAYS</span>
                      </div>
                      <p className="text-slate-300 leading-tight">
                        Method: {walletProofMethod === 'microtx' ? 'Satoshi Micro-Deposit Verification' : 'Hardware Wallet Photo Review'}
                      </p>
                      <p className="text-slate-500 text-[8px] pt-0.5">
                        Hold: Awaiting human compliance ops analyst manual approval.
                      </p>
                    </div>

                    {/* The Retail Drop-off Card */}
                    <div className="p-2.5 bg-rose-50 border border-rose-200/90 rounded-xl text-left text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800 text-[10px]">
                        <UserX className="w-3.5 h-3.5 text-rose-600" />
                        <span>Retail Customer Drop-Off (84% Churn)</span>
                      </div>
                      <p className="text-[10px] leading-snug">
                        The user closed the app and abandoned the transfer. Forcing retail customers to pay gas fees on micro-deposits or wait 5 business days for manual photo review breaks crypto conversion.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1">
                      <button 
                        type="button"
                        onClick={() => setLegacyWalletStage('explanation')}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <HelpCircle className="w-4 h-4 text-white" />
                        <span>Why Bridge /v0 Causes Drop-Off (API Breakdown)</span>
                      </button>

                      <button 
                        type="button"
                        onClick={handleLegacyWalletRetry}
                        className="text-[10px] text-slate-500 hover:text-slate-800 underline underline-offset-2 transition"
                      >
                        Retry Verification Form
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Architectural Explanation State */}
                {legacyWalletStage === 'explanation' && (
                  <div className="space-y-2.5 text-left py-1">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <button 
                        type="button"
                        onClick={() => setLegacyWalletStage('submitted')}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Back to Queue
                      </button>
                      <span className="text-[9px] font-mono text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        ARCHITECTURAL ANALYSIS
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-xs text-slate-900">The Missing Web3 Attestation Layer in /v0</h3>
                      <p className="text-[10px] text-slate-500">
                        Why Bridge&apos;s legacy API forces companies into manual review hell
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                        <span className="font-bold text-[10px] text-slate-800 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px]">1</span>
                          Bridge Demands Timestamp Without Tooling
                        </span>
                        <p className="text-[9.5px] text-slate-600 leading-normal pl-4.5">
                          Bridge `/v0` mandates an ISO timestamp `wallet_attested_ownership_at`, but provides zero challenge-response protocol or cryptographic signature endpoints.
                        </p>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                        <span className="font-bold text-[10px] text-slate-800 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px]">2</span>
                          Companies Are Forced to Improvise
                        </span>
                        <p className="text-[9.5px] text-slate-600 leading-normal pl-4.5">
                          Because engineering teams don&apos;t have weeks to build full Web3 signature infra, companies fall back to clunky Satoshi tests and manual photo uploads.
                        </p>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                        <span className="font-bold text-[10px] text-slate-800 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px]">3</span>
                          Total Retail Drop-off
                        </span>
                        <p className="text-[9.5px] text-slate-600 leading-normal pl-4.5">
                          A 3–5 day manual review queue destroys real-time crypto off-ramping, causing 84% user churn and huge customer support overhead.
                        </p>
                      </div>
                    </div>

                    <div className="p-2 bg-indigo-50 border border-indigo-200/80 rounded-xl text-left">
                      <span className="text-[10px] font-bold text-[#635bff] block">
                        ✨ The Stripe /v1 Solution:
                      </span>
                      <span className="text-[9.5px] text-slate-600 leading-normal block mt-0.5">
                        Toggle <strong>Proposal</strong> in the top header to see how Stripe replaces this entire nightmare with a 1-click branded attestation component.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Scenario 3 Legacy: MetaMask Multi-Hop Delegated KYC Failure */
              <div className="space-y-3">
                {/* 1. Multi-Hop Dilemma Screen */}
                {legacyKycStage === 'intro' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 border border-purple-200/90 rounded-xl text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200">
                          METAMASK DELEGATED ROUTING
                        </span>
                        <span className="text-[10px] font-mono text-rose-700 font-bold">ZERO LOCAL PII</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 mt-1.5">Third-Party KYC Multi-Hop Dilemma</h4>
                      <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                        MetaMask does not store your KYC in a database. Your identity credential is held externally with <strong>idOS Network</strong>.
                      </p>
                    </div>

                    {/* Multi-Hop Diagram Card */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-left">
                      <span className="text-[10px] font-semibold text-slate-700 block">The Additional Hop Architecture:</span>
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-[9px]">
                        <div className="text-center">
                          <span className="block font-bold text-slate-800">🦊 MetaMask</span>
                          <span className="text-[8px] text-slate-500">Zero PII</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <div className="text-center">
                          <span className="block font-bold text-purple-700">🛡️ idOS Vault</span>
                          <span className="text-[8px] text-purple-600">3rd-Party KYC</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
                        <div className="text-center">
                          <span className="block font-bold text-rose-700">⚠️ Bridge /v0</span>
                          <span className="text-[8px] text-rose-600">Sync Failure</span>
                        </div>
                      </div>
                      <p className="text-[9.5px] text-slate-500 leading-snug">
                        Bridge /v0 expects MetaMask to pass raw local database PII. Because Bridge has no asynchronous webhook handle for third-party relays, attempting this hop causes a protocol desync.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleLegacyKycSubmit}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-mono font-medium rounded-lg text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <span>Attempt Third-Party idOS Relay (/v0)</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    </button>

                    <div className="p-2 bg-amber-50/80 border border-amber-200/80 rounded-xl text-left">
                      <span className="text-[10px] text-amber-800 leading-tight block">
                        ⚠️ <strong>Limitation:</strong> Bridge /v0 is a synchronous fire-and-forget endpoint that cannot receive callbacks from external identity vaults.
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Multi-Hop Desync Failure Screen */}
                {legacyKycStage === 'error' && (
                  <div className="space-y-3 text-center my-auto py-2">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
                      <XCircle className="w-7 h-7" />
                    </div>

                    <div>
                      <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-800 font-mono text-[9px] font-bold rounded-full mb-1">
                        HTTP 422 UNPROCESSABLE_HOP
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">Multi-Hop Delegation Desync</h3>
                    </div>

                    {/* Monospace Error Box */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left font-mono text-[10px] space-y-1 shadow-md">
                      <div className="flex items-center justify-between text-rose-400 font-semibold border-b border-slate-800 pb-1 text-[9px]">
                        <span>ERR_MULTI_HOP_DELEGATION_DESYNC</span>
                        <span>HTTP 422</span>
                      </div>
                      <p className="text-slate-300 leading-tight">
                        Bridge /v0 rejected sync payload: Expected direct local PII from contracted entity (MetaMask). Third-party identity vault (idOS) asynchronous webhook callback was dropped.
                      </p>
                      <p className="text-slate-500 text-[8px] pt-0.5">
                        Status: Transfer quarantined indefinitely. Zero remediation contract.
                      </p>
                    </div>

                    <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl text-left text-xs text-slate-600 space-y-0.5">
                      <span className="text-[10px] font-bold text-rose-800 block">Funds Status: Quarantined Indefinitely</span>
                      <p className="text-[10px] leading-snug">
                        Your $7,500.00 USDC transfer is frozen. Because MetaMask cannot custody user PII, the compliance handshake failed.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1">
                      <button 
                        type="button"
                        onClick={() => setLegacyKycStage('explanation')}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <HelpCircle className="w-4 h-4 text-white" />
                        <span>Why the Multi-Hop Failed (API Breakdown)</span>
                      </button>

                      <button 
                        type="button"
                        onClick={handleLegacyKycRetry}
                        className="text-[10px] text-slate-500 hover:text-slate-800 underline underline-offset-2 transition"
                      >
                        Retry Multi-Hop Relay
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Architectural Analysis Screen */}
                {legacyKycStage === 'explanation' && (
                  <div className="space-y-2.5 text-left py-1">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <button 
                        type="button"
                        onClick={() => setLegacyKycStage('error')}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Back to Error
                      </button>
                      <span className="text-[9px] font-mono text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        ARCHITECTURAL ANALYSIS
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-xs text-slate-900">The Non-Custodial Multi-Hop Crisis</h3>
                      <p className="text-[10px] text-slate-500">
                        Why Bridge /v0 cannot handle modern Web3 wallet architectures
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                        <span className="font-bold text-[10px] text-slate-800 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px]">1</span>
                          MetaMask Owns Zero User PII
                        </span>
                        <p className="text-[9.5px] text-slate-600 leading-normal pl-4.5">
                          Consensys/MetaMask is strictly non-custodial. Storing user passports in a local database violates GDPR and decentralized design principles.
                        </p>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                        <span className="font-bold text-[10px] text-slate-800 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px]">2</span>
                          The Mandatory &quot;Extra Hop&quot;
                        </span>
                        <p className="text-[9.5px] text-slate-600 leading-normal pl-4.5">
                          In Web3, identity lives in external vaults (like idOS). Completing the Travel Rule requires a 3-way asynchronous handshake: MetaMask &harr; idOS &harr; Payment Rail.
                        </p>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                        <span className="font-bold text-[10px] text-slate-800 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px]">3</span>
                          Bridge /v0 Monolithic Blindness
                        </span>
                        <p className="text-[9.5px] text-slate-600 leading-normal pl-4.5">
                          Bridge `/v0` assumes the API client is a traditional custodial entity with a local SQL database. It cannot receive asynchronous third-party callbacks, resulting in a permanent sync timeout.
                        </p>
                      </div>
                    </div>

                    <div className="p-2 bg-indigo-50 border border-indigo-200/80 rounded-xl text-left">
                      <span className="text-[10px] font-bold text-[#635bff] block">
                        ✨ The Stripe /v1 Solution:
                      </span>
                      <span className="text-[9.5px] text-slate-600 leading-normal block mt-0.5">
                        Toggle <strong>Proposal</strong> in the top header to see how Stripe&apos;s Next Action engine orchestrates this 3-way handshake seamlessly in 1.2s.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* INTENT MODEL: Stripe-Native Proposal next_action          */}
        {/* ======================================================== */}
        {transfer && mode === 'intent' && (
          <div className="space-y-4 my-auto">
            {/* Action 1: Inbound Deposit - B2B Beneficiary Verification Form */}
            {transfer.status === 'requires_action' && transfer.next_action?.type === 'complete_beneficiary_form' && (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 text-indigo-900 rounded-2xl">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#635bff] mb-1">
                    <FileText className="w-4 h-4 text-[#635bff]" /> Funds on Hold: Form Required
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Your platform received an inbound deposit of $5,000.00 USDC, but does not have your beneficiary information on file. Please complete the form below to release the funds.
                  </p>
                </div>

                <form onSubmit={handleBeneficiarySubmit} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Beneficiary Full Legal Name:
                    </label>
                    <input 
                      type="text"
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Purpose of Transfer:
                    </label>
                    <select
                      value={paymentPurpose}
                      onChange={(e) => setPaymentPurpose(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff]"
                    >
                      <option>Contractor / Invoice Payment</option>
                      <option>Personal Remittance / Family Support</option>
                      <option>B2B Trade Settlement</option>
                      <option>Software Licensing Fee</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#635bff] hover:bg-[#5346e0] text-white font-semibold rounded-xl text-xs transition shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Submit Form &amp; Release Funds
                  </button>

                  <div className="pt-1 text-center">
                    <button 
                      type="button"
                      onClick={handleBeneficiaryDecline}
                      className="text-[11px] text-slate-500 hover:text-rose-600 transition underline underline-offset-2"
                    >
                      I Decline / I don&apos;t have this info
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Scenario 1 SUB-STATE: User Declined Form -> Under Stripe Investigation */}
            {transfer.travel_rule.compliance_status === 'under_investigation' && (
              <div className="space-y-4 my-auto text-center py-4">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                  <HelpCircle className="w-9 h-9" />
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900">Held for Stripe Investigation</h4>
                  <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold mt-1">
                    Manual AML Queue (5–7 Business Days)
                  </span>
                </div>

                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 text-left text-xs text-slate-600 space-y-1.5">
                  <p className="font-semibold text-slate-800">Why are my funds held?</p>
                  <p className="text-[11px] leading-relaxed">
                    Because beneficiary verification was declined, the B2B platform cannot release the funds automatically under FATF regulations. The deposit has been forwarded to Stripe’s compliance investigation team.
                  </p>
                </div>

                <button 
                  onClick={handleReopenForm}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-indigo-400" /> Changed your mind? Re-open Form
                </button>
              </div>
            )}

            {/* Action 2: Stripe Branded 1-Click Wallet Ownership Attestation */}
            {transfer.status === 'requires_action' && transfer.next_action?.type === 'verify_wallet_ownership' && (
              <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-indigo-100 shadow-md text-left">
                {/* Stripe Header Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-[#635bff] text-white rounded-md flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">Stripe Attestation</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-indigo-50 text-[#635bff] px-2 py-0.5 rounded-full border border-indigo-100">
                    EIP-712 SECURE
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">Confirm Wallet Ownership</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    Stripe requires cryptographic proof of private key control before disbursing $10,000.00 USDC to self-custody.
                  </p>
                </div>

                {/* Transfer Info Card */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Destination:</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-800">
                      {transfer.destination.address || '0x71C9f...a83'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Amount:</span>
                    <span className="font-semibold text-slate-900">$10,000.00 USDC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Method:</span>
                    <span className="text-emerald-700 font-semibold text-[11px]">EIP-712 Gasless (0.5s)</span>
                  </div>
                </div>

                {/* Challenge Preview */}
                <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl text-[10px] font-mono leading-tight border border-slate-800">
                  <span className="text-slate-500 block mb-0.5">// EIP-712 Typed Signature Challenge</span>
                  &quot;Stripe Attestation: I confirm sole control of unhosted address {transfer.destination.address || '0x71C9f...a83'} for transfer {transfer.id}&quot;
                </div>

                {/* 1-Click Button */}
                <button 
                  onClick={handleAttest}
                  disabled={isSigningSimulated}
                  className="w-full py-3 bg-[#635bff] hover:bg-[#5346e0] disabled:bg-indigo-400 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  {isSigningSimulated ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Cryptographic Signature...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sign with Wallet (1-Click Attestation)</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-400">
                  ⚡ Mathematically verified in 0.5s &bull; Zero manual ops review
                </p>
              </div>
            )}

            {/* Action 3: Delegated KYC via MetaMask & idOS (Multi-Hop Native) */}
            {transfer.status === 'requires_action' && transfer.next_action?.type === 'authorize_identity_credential' && (
              <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-purple-100 shadow-md text-left">
                {/* Header Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-purple-600 text-white rounded-md flex items-center justify-center">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">MetaMask Delegated Identity</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">
                    MULTI-HOP NATIVE
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">Authorize Identity Vault Hop</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    MetaMask holds zero PII. Authorize third-party idOS Vault to communicate with Stripe to clear your $7,500.00 USDC transfer.
                  </p>
                </div>

                {/* 3-Node Architecture Flow Diagram */}
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                  <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">
                    Multi-Party Handshake:
                  </span>
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 text-[10px]">
                    <div className="text-center flex-1">
                      <span className="block text-xs">🦊</span>
                      <span className="font-bold text-slate-800 block text-[9.5px]">MetaMask</span>
                      <span className="text-[8px] text-slate-400">Zero PII</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    <div className="text-center flex-1">
                      <span className="block text-xs">🛡️</span>
                      <span className="font-bold text-purple-700 block text-[9.5px]">idOS Vault</span>
                      <span className="text-[8px] text-purple-600">3rd-Party KYC</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#635bff] animate-pulse" />
                    <div className="text-center flex-1">
                      <span className="block text-xs">⚡</span>
                      <span className="font-bold text-[#635bff] block text-[9.5px]">Stripe Rail</span>
                      <span className="text-[8px] text-slate-400">Direct Grant</span>
                    </div>
                  </div>
                </div>

                {/* Detail summary */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Identity Provider:</span>
                    <span className="font-semibold text-purple-700">idOS Decentralized Network</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">MetaMask PII Storage:</span>
                    <span className="font-semibold text-emerald-700">0 KB (Zero Local Custody)</span>
                  </div>
                </div>

                {/* Button */}
                <button 
                  onClick={handleAuthorizeIdos}
                  disabled={isAuthorizingIdos}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-purple-100 flex items-center justify-center gap-2"
                >
                  {isAuthorizingIdos ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Orchestrating Multi-Hop Token Grant...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Authorize idOS to Release Pass to Stripe</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-400">
                  🔒 Zero-Knowledge Compliance Pass &bull; Clears multi-hop in 1.2s
                </p>
              </div>
            )}

            {/* Action 4: Missing Fields (Zero Human Tickets / B2B Perspective) */}
            {transfer.status === 'requires_action' && transfer.next_action?.type === 'collect_missing_fields' && (
              <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-blue-100 shadow-md text-left">
                {/* Header Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-blue-600 text-white rounded-md flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">Zero Support Tickets</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                    PROGRAMMATIC REMEDIATION
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">Automated Retail Proposal Flow</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    Instead of your retail user Alex screaming at your support team, Stripe&apos;s API requests the missing compliance attribute inline.
                  </p>
                </div>

                <form onSubmit={handleRemediatePostal} className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Counterparty Beneficiary Postal Code:
                    </label>
                    <input 
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 10001"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-blue-100 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Resolve &amp; Settle in 1.2s
                  </button>
                </form>

                <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-emerald-800 block">
                    🎉 B2B Business Customer Outcome:
                  </span>
                  <span className="text-[9.5px] text-slate-600 leading-normal block mt-0.5">
                    Alex gets his funds instantly. Zero support tickets opened. Zero Twitter complaints. Cost: $0 in manual compliance outreach.
                  </span>
                </div>
              </div>
            )}

            {/* In-Flight Processing */}
            {transfer.status === 'processing' && transfer.travel_rule.compliance_status !== 'under_investigation' && (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 border-3 border-[#635bff] border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Validating Compliance Attestation</h4>
                  <p className="text-xs text-slate-500 mt-1">Releasing funds from hold...</p>
                </div>
              </div>
            )}

            {/* Settled Succeeded */}
            {transfer.status === 'succeeded' && (
              <div className="text-center py-8 space-y-3.5">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {transfer.direction === 'inbound' ? 'Deposit Released & Credited' : 'Transfer Cleared & Settled'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Compliance criteria satisfied. Funds available in balance.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5" /> Hold Released in 1.2s (Zero Manual Review)
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reset Link */}
        {transfer && (
          <button 
            onClick={() => mockEngine.reset()}
            className="w-full py-2.5 text-slate-400 hover:text-slate-700 text-xs font-medium border-t border-slate-100 transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Session
          </button>
        )}
      </div>
    </div>
  );
};
