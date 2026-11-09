import { useState } from 'react';
import { mockEngine } from '@/lib/mockEngine';
import { RetailSimulator } from '@/components/RetailSimulator';
import { DeveloperCockpit } from '@/components/DeveloperCockpit';
import { ScenarioType } from '@/types/compliance';
import { Layers } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<'legacy' | 'intent'>('intent');
  const [scenario, setScenario] = useState<ScenarioType>('unallocated_beneficiary');

  const handleModeChange = (newMode: 'legacy' | 'intent') => {
    setMode(newMode);
    mockEngine.setMode(newMode);
  };

  const handleScenarioChange = (newScenario: ScenarioType) => {
    setScenario(newScenario);
    mockEngine.reset();
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans relative overflow-x-hidden selection:bg-[#635bff] selection:text-white">
      {/* Stripe-style Ambient Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 py-3.5 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#635bff] text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-slate-900">Bridge &times; Stripe</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                Travel Rule Sandbox
              </span>
            </div>
          </div>

          {/* Scenario Selector & Mode Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Scenario Picker */}
            <select 
              value={scenario}
              onChange={(e) => handleScenarioChange(e.target.value as ScenarioType)}
              className="bg-white border border-slate-200 shadow-xs rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#635bff]/20 cursor-pointer transition"
            >
              <option value="unallocated_beneficiary">1. Inbound Deposit: Unallocated Beneficiary</option>
              <option value="unhosted_wallet">2. Unhosted Wallet (&gt;$3k Key Proof)</option>
              <option value="delegated_kyc_idos">3. Delegated KYC: MetaMask &amp; 3rd-Party Vault</option>
              <option value="manual_outreach_hell">4. Support Hell: Angry Retail Escalation</option>
            </select>

            {/* Mode Switch (Stripe Bubbly Pill Toggle) */}
            <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/80 text-xs shadow-inner">
              <button
                onClick={() => handleModeChange('legacy')}
                className={`px-3.5 py-1 rounded-full transition-all font-semibold ${
                  mode === 'legacy' 
                    ? 'bg-white text-rose-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Current
              </button>
              <button
                onClick={() => handleModeChange('intent')}
                className={`px-3.5 py-1 rounded-full transition-all font-semibold ${
                  mode === 'intent' 
                    ? 'bg-[#635bff] text-white shadow-sm shadow-indigo-200' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Proposal
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Phone Simulator (Expanded Width) */}
        <div className="lg:col-span-5 flex justify-center">
          <RetailSimulator mode={mode} scenario={scenario} />
        </div>

        {/* Right Column: Unified Developer Cockpit */}
        <div className="lg:col-span-7 h-[640px]">
          <DeveloperCockpit mode={mode} />
        </div>
      </div>
    </main>
  );
}
