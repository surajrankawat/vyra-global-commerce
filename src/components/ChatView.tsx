import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Paperclip,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  User,
  Clock,
  Search,
} from 'lucide-react';
import { Conversation, ConversationMessage } from '../types';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  createConversation,
} from '../lib/db';
import { useAuth } from '../context/AuthContext';

interface ChatViewProps {
  initialSellerId?: string;
  initialSellerName?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ initialSellerId, initialSellerName }) => {
  const { currentBusiness, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!currentBusiness) return;
    const load = async () => {
      setLoading(true);
      try {
        const convs = await fetchConversations(currentBusiness.id);
        setConversations(convs);

        if (initialSellerId && !convs.some((c) => c.buyer_id === initialSellerId)) {
          // Initialize new conversation
          const newC = await createConversation({
            business_id: currentBusiness.id,
            buyer_id: initialSellerId,
            buyer_name: initialSellerName || 'Trade Buyer',
            buyer_company: 'Verified Partner',
            last_message: 'Inquiry started',
            status: 'active',
          });
          setConversations([newC, ...convs]);
          setActiveConv(newC);
        } else if (convs.length > 0) {
          setActiveConv(convs[0]);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentBusiness, initialSellerId, initialSellerName]);

  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      return;
    }
    const loadMsgs = async () => {
      const msgs = await fetchMessages(activeConv.id);
      setMessages(msgs);
      scrollToBottom();
    };
    loadMsgs();
  }, [activeConv]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !inputMessage.trim() || sending) return;

    setSending(true);
    try {
      const newMsg = await sendMessage({
        conversation_id: activeConv.id,
        sender_id: user?.id || 'current_user',
        sender_role: 'seller',
        sender_name: currentBusiness?.name || 'Seller Representative',
        message: inputMessage.trim(),
      });

      setMessages((prev) => [...prev, newMsg]);
      setInputMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleAiDraftReply = async () => {
    if (!activeConv || messages.length === 0) return;
    setAiDrafting(true);
    try {
      const lastClientMsg = messages.filter((m) => m.sender_role === 'buyer').slice(-1)[0]?.message || 'Can you provide quotation and technical lead time?';
      const res = await fetch('/api/ai/command-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'draft_chat_reply',
          prompt: `Draft a professional, authoritative B2B response to this buyer message: "${lastClientMsg}". Confirm production capability, inquire about required port of destination, and offer official proforma invoice.`,
          business: currentBusiness,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setInputMessage(data.result.trim());
      } else {
        const errorText = data.error?.message || data.error || 'The AI service is currently busy. Please try again.';
        setInputMessage(`[Notice: ${errorText}]`);
      }
    } catch (err: any) {
      console.error('AI draft error:', err);
      setInputMessage('[Notice: AI service unavailable temporarily. Please try again in a few moments.]');
    } finally {
      setAiDrafting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[750px]">
      {/* Conversations Sidebar */}
      <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Commercial Messages</span>
            </h2>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
              {conversations.length}
            </span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading inbox...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No active buyer messages yet.</div>
          ) : (
            conversations.map((conv) => {
              const isSelected = activeConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full text-left p-3.5 transition-all flex items-start gap-3 ${
                    isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-white'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {conv.buyer_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 truncate">
                        {conv.buyer_name}
                      </h3>
                      <span className="text-[10px] text-slate-400">
                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium block truncate">
                      {conv.buyer_company || 'Trade Partner'}
                    </span>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      {conv.last_message || 'Inquiry initiated'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation Window */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {activeConv.buyer_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{activeConv.buyer_name}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </h3>
                <span className="text-[10px] text-slate-500">
                  {activeConv.buyer_company} • Direct Commercial Line
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAiDraftReply}
                disabled={aiDrafting}
                className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>{aiDrafting ? 'Drafting...' : 'AI Draft Reply'}</span>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Send a message to initiate trade negotiations.
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_role === 'seller';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] text-slate-400 mb-1 px-1">
                      {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div
                      className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <textarea
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Type message or contract clarification (Enter to send)..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />

            <button
              type="submit"
              disabled={sending || !inputMessage.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400 text-xs">
          Select a conversation from the sidebar to open messages.
        </div>
      )}
    </div>
  );
};
