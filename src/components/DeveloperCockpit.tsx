import React, { useState, useEffect } from 'react';
import { mockEngine } from '@/lib/mockEngine';
import { StripeCryptoTransfer, WebhookLog } from '@/types/compliance';
import { Terminal, Activity, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  mode: 'legacy' | 'intent';
}

export const DeveloperCockpit: React.FC<Props> = ({ mode }) => {
  const [transfer, setTransfer] = useState<StripeCryptoTransfer | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [activeTab, setActiveTab] = useState<'payload' | 'webhooks'>('payload');
  const [copied, setCopied] = useState(false);
  const [expandedWebhookId, setExpandedWebhookId] = useState<string | null>(null);

  useEffect(() => {
    const unsubSession = mockEngine.subscribe(setTransfer);
    const unsubWebhooks = mockEngine.subscribeWebhooks((log) => {
      setWebhooks(prev => [log, ...prev].slice(0, 10));
    });
    return () => {
      unsubSession();
      unsubWebhooks();
    };
  }, []);

  const copyPayload = () => {
    if (!transfer) return;
    navigator.clipboard.writeText(JSON.stringify(transfer, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const status = transfer?.status;

  // Simple syntax-colored JSON formatter for Stripe-like polish
  const renderFormattedJson = (data: unknown) => {
    const json = JSON.stringify(data, null, 2);
    const lines = json.split('\n');

    return lines.map((line, idx) => {
      const keyMatch = line.match(/^(\s*)(".*?"):(.*)$/);
      if (keyMatch) {
        const indent = keyMatch[1];
        const key = keyMatch[2];
        const val = keyMatch[3];

        let valColor = 'text-slate-800';
        if (val.includes('"')) {
          valColor = 'text-emerald-700';
        } else if (val.trim() === 'true' || val.trim() === 'false') {
          valColor = 'text-amber-700 font-semibold';
        } else if (!isNaN(Number(val.trim().replace(',', '')))) {
          valColor = 'text-sky-700';
        }

        return (
          <div key={idx} className="leading-5">
            <span className="whitespace-pre">{indent}</span>
            <span className="text-[#635bff] font-semibold">{key}</span>
            <span className="text-slate-500">:</span>
            <span className={valColor}>{val}</span>
          </div>
        );
      }

      return (
        <div key={idx} className="text-slate-600 leading-5 whitespace-pre">
          {line}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200/90 rounded-[2rem] overflow-hidden shadow-xl shadow-indigo-100/50">
      {/* Top Cockpit Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50/80 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-xs ${
            mode === 'legacy' ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              mode === 'legacy' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
            }`} />
            <span className={`text-xs font-mono font-semibold ${
              mode === 'legacy' ? 'text-rose-700' : 'text-slate-800'
            }`}>
              {mode === 'legacy' ? 'POST /v0/travel_rule_data' : 'POST /v1/transfers'}
            </span>
          </div>

          {status && (
            <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              status === 'succeeded' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              status === 'requires_action' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              status === 'canceled' ? 'bg-indigo-50 text-[#635bff] border-indigo-200' :
              transfer?.travel_rule.compliance_status === 'under_investigation' ? 'bg-amber-100 text-amber-900 border-amber-300' :
              'bg-sky-50 text-sky-700 border-sky-200'
            }`}>
              {transfer?.travel_rule.compliance_status === 'under_investigation' 
                ? 'UNDER_INVESTIGATION' 
                : status.toUpperCase()}
            </span>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-200/60 p-1 rounded-full text-xs font-medium">
            <button
              onClick={() => setActiveTab('payload')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === 'payload' 
                  ? 'bg-white text-slate-900 shadow-sm font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-[#635bff]" /> API Object
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === 'webhooks' 
                  ? 'bg-white text-slate-900 shadow-sm font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-purple-600" /> Webhooks {webhooks.length > 0 && `(${webhooks.length})`}
            </button>
          </div>

          {activeTab === 'payload' && transfer && (
            <button 
              onClick={copyPayload}
              title="Copy JSON"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-auto p-5 bg-[#f6f9fc] font-mono text-[11px]">
        {activeTab === 'payload' ? (
          transfer ? (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              {renderFormattedJson(transfer)}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 font-sans text-xs">
              Click &quot;Confirm &amp; Transfer&quot; on the phone to generate the Stripe transfer object.
            </div>
          )
        ) : (
          <div className="space-y-2 font-sans">
            {webhooks.length === 0 ? (
              <div className="text-slate-400 text-center py-12 text-xs">
                No webhooks emitted yet. Trigger a transfer to watch real-time events.
              </div>
            ) : (
              webhooks.map((log) => (
                <div 
                  key={log.id} 
                  onClick={() => setExpandedWebhookId(expandedWebhookId === log.id ? null : log.id)}
                  className="p-3 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {expandedWebhookId === log.id ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full text-[11px] border border-purple-100">
                        {log.event}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px] font-mono">{log.timestamp}</span>
                  </div>

                  {expandedWebhookId === log.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 font-mono text-[11px] text-slate-600 overflow-x-auto bg-slate-50 p-2.5 rounded-xl">
                      <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
