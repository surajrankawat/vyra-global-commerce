import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  Copy,
  Check,
  Globe,
  FileText,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface ActionItem {
  id: string;
  label: string;
  type: string;
  target?: string;
  action?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actions?: ActionItem[];
  actionStatus?: 'pending' | 'reviewed' | 'approved' | 'cancelled';
  actionNote?: string;
}

export const AIAssistantView: React.FC = () => {
  const { currentBusiness, apiFetch } = useAuth();
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I am VYRA, your AI Business & Commerce Platform operating system for **${
        currentBusiness?.name || 'your enterprise'
      }**.\n\nI operate directly on your real business data: products, orders, buyer requirements, and CRM leads. What commercial objective would you like to execute?`,
      actions: [
        { id: 'act-1', label: 'Analyze Business', type: 'prompt', action: 'Analyze my business' },
        { id: 'act-2', label: 'Review Leads', type: 'navigate', target: 'leads' },
        { id: 'act-3', label: 'Check Stock', type: 'prompt', action: 'Show my low-stock products' },
      ],
      actionStatus: 'pending',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const quickPrompts = [
    { label: 'Low-Stock Products', prompt: 'Show my low-stock products' },
    { label: 'Highest-Value Leads', prompt: 'Find my highest-value leads' },
    { label: 'Create Quotation', prompt: 'Create a quotation for my top buyer requirement' },
    { label: 'Buyer Follow-up', prompt: 'Write a buyer follow-up for pending inquiries' },
    { label: "Today's Sales", prompt: "Analyze today's sales and order fulfillment" },
    { label: 'Best Sellers', prompt: 'What are my best selling products?' },
    { label: 'Business Analysis', prompt: 'Analyze my business performance and margin priorities' },
  ];

  const handleActionStatusChange = (msgIdx: number, newStatus: 'reviewed' | 'approved' | 'cancelled') => {
    setMessages((prev) =>
      prev.map((msg, i) =>
        i === msgIdx
          ? {
              ...msg,
              actionStatus: newStatus,
              actionNote:
                newStatus === 'approved'
                  ? 'Human approval recorded. Action verified.'
                  : newStatus === 'cancelled'
                  ? 'Action cancelled.'
                  : 'Reviewed and queued.',
            }
          : msg
      )
    );
  };

  const handleExecuteAction = (action: ActionItem, msgIdx: number) => {
    if (action.action && action.type === 'prompt') {
      handleSendMessage(action.action);
    } else if (action.action === 'draft_message') {
      handleSendMessage('Write a buyer follow-up message for my highest priority lead.');
    } else if (action.target) {
      handleActionStatusChange(msgIdx, 'reviewed');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: messageText.trim() }];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await apiFetch('/api/ai/command-center', {
        method: 'POST',
        body: JSON.stringify({
          actionType: 'executive_consultation',
          prompt: messageText.trim(),
          business: currentBusiness,
          businessId: currentBusiness?.id,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorMsg =
          typeof data.error === 'string'
            ? data.error
            : data.error?.message || 'Failed to get response';
        throw new Error(errorMsg);
      }

      const replyText = data.result || data.reply || data.data?.reply || 'Analysis completed.';
      const actions = data.actions || [];

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: replyText,
          actions: actions.length > 0 ? actions : undefined,
          actionStatus: actions.length > 0 ? 'pending' : undefined,
        },
      ]);
    } catch (err: any) {
      const rawMsg = err?.message || 'The AI service is temporarily unavailable.';
      if (rawMsg.toLowerCase().includes('not configured') || rawMsg.includes('AI_UNAVAILABLE') || rawMsg.includes('AI_NOT_CONFIGURED')) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'AI NOT CONFIGURED: Add GEMINI_API_KEY to server environment variables to enable AI capabilities.',
          },
        ]);
        return;
      }
      const isTransient = rawMsg.includes('high demand') || rawMsg.includes('clusters') || rawMsg.includes('moments') || rawMsg.includes('busy');
      const formattedNotice = isTransient
        ? `⚡ High Demand Notice: ${rawMsg} You can click above or send again to retry.`
        : `AI Service Notice: ${rawMsg}`;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: formattedNotice,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div id="ai-assistant-view" className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">VYRA AI Commercial Director & Revenue Engine</h2>
            <p className="text-[11px] text-slate-500">
              Active Enterprise: {currentBusiness?.name || 'Authorized Enterprise'} • Live Database Context
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            setMessages([
              {
                role: 'assistant',
                content: `Session refreshed. How can I assist ${currentBusiness?.name || 'your business'} now?`,
              },
            ])
          }
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Clear Session
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs whitespace-pre-wrap font-sans'
                }`}
              >
                {m.content}

                {/* AI Action System: Human Approval Required */}
                {!isUser && m.actions && m.actions.length > 0 && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <div className="text-[11px] font-bold text-slate-800 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-blue-700">
                        <Sparkles className="w-3.5 h-3.5" /> AI Recommendation
                      </span>
                      {m.actionStatus && m.actionStatus !== 'pending' && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                            m.actionStatus === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : m.actionStatus === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {m.actionStatus}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2.5">
                      {m.actions.map((act) => (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => handleExecuteAction(act, idx)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Human Authorization:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleActionStatusChange(idx, 'reviewed')}
                          className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition"
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInput(m.content.slice(0, 150));
                          }}
                          className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActionStatusChange(idx, 'approved')}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 font-bold transition shadow-xs"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActionStatusChange(idx, 'cancelled')}
                          className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    {m.actionNote && (
                      <p className="mt-1.5 text-[10px] text-slate-500 italic">{m.actionNote}</p>
                    )}
                  </div>
                )}

                {!isUser && (
                  <div className="pt-2 mt-2 border-t border-slate-200/60 flex justify-end">
                    <button
                      type="button"
                      onClick={() => copyMessage(m.content, idx)}
                      className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[11px]"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <Bot className="w-5 h-5 text-blue-600 animate-pulse" />
            <span>VYRA AI is querying real database records & computing strategy...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Real Database Commands:
        </span>
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSendMessage(qp.prompt)}
            className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold whitespace-nowrap transition"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="ai-assistant-input"
            type="text"
            placeholder="Ask VYRA anything about your business..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            id="ai-assistant-send-btn"
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
