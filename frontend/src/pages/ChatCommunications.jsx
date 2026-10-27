import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/api';

export default function ChatCommunications({ currentUser }) {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (activeContact) {
      loadMessages(activeContact.user_id);

      const interval = setInterval(() => {
        loadMessages(activeContact.user_id);
        loadContacts();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [activeContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadContacts = async () => {
    try {
      const list = await chatService.getContacts();
      const contactList = Array.isArray(list) ? list : (list?.items || []);
      setContacts(contactList);
      if (!activeContact && contactList && contactList.length > 0) {
        setActiveContact(contactList[0]);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const msgs = await chatService.getConversation(userId);
      setMessages(Array.isArray(msgs) ? msgs : (msgs?.items || []));
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact || sending) return;

    setSending(true);
    try {
      const sent = await chatService.sendMessage(activeContact.user_id, newMessage);
      setMessages((prev) => [...prev, sent]);
      setNewMessage('');
      loadContacts();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const myUserId = currentUser?.user_id || currentUser?.id;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Direct Communications & Messaging</h2>
        <p className="text-xs text-slate-500 mt-1">Direct employee-to-manager communication channel with audit trail</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs h-[600px] flex overflow-hidden">
        {/* Left Contacts List */}
        <div className="w-80 border-r border-slate-200 bg-slate-50/60 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team Colleagues</h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {contacts.map((c) => {
              const isSelected = activeContact?.user_id === c.user_id;
              return (
                <button
                  key={c.user_id}
                  onClick={() => setActiveContact(c)}
                  className={`w-full p-4 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-100/70'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 relative">
                    {c.full_name ? c.full_name[0] : 'U'}
                    {c.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                        {c.unread_count}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">{c.full_name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold">
                        {c.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {c.last_message || 'No messages yet.'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Chat Pane */}
        {activeContact ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">
                  {activeContact.full_name ? activeContact.full_name[0] : 'U'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{activeContact.full_name}</h4>
                  <p className="text-[10px] text-slate-400">{activeContact.email} • {activeContact.role}</p>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No messages yet. Send a message to start the conversation!
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender_id === myUserId;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs ${
                          isMine
                            ? 'bg-[#1a56db] text-white rounded-br-none shadow-xs'
                            : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-xs'
                        }`}
                      >
                        <p className="leading-relaxed">{m.message}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1">
                        {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 flex items-center gap-2 bg-white">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${activeContact.full_name}...`}
                className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2.5 bg-[#1a56db] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            Select a contact to view conversation.
          </div>
        )}
      </div>
    </div>
  );
}
