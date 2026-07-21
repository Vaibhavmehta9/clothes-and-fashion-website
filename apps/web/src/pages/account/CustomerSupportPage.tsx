import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiMessageSquare, FiSend, FiPlus, FiAlertCircle, FiClock, FiCheckSquare } from 'react-icons/fi';
import { useAuthStore } from '@/store';

interface MessageType {
  _id: string;
  sender: {
    _id: string;
    name: string;
  };
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

interface TicketType {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  messages: MessageType[];
  createdAt: string;
}

const CustomerSupportPage: React.FC = () => {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [replyMessage, setReplyMessage] = useState('');

  const fetchMyTickets = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/support-tickets/my');
      setTickets(data.data || []);
    } catch {
      toast.error('Failed to load support enquiries.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketDetails = async (id: string) => {
    try {
      const { data } = await api.get(`/support-tickets/${id}`);
      setSelectedTicket(data.data);
    } catch {
      toast.error('Failed to load enquiry details.');
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 5 || description.trim().length < 20) {
      toast.error('Subject must be at least 5 chars and Description at least 20 chars.');
      return;
    }

    try {
      const { data } = await api.post('/support-tickets', {
        subject,
        description,
        priority,
      });
      toast.success('Support enquiry submitted successfully.');
      setSubject('');
      setDescription('');
      setPriority('medium');
      setShowCreateForm(false);
      fetchMyTickets();
      // Auto-select the newly created ticket
      setSelectedTicket(data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit enquiry.');
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      const { data } = await api.post(`/support-tickets/${selectedTicket._id}/reply`, {
        message: replyMessage,
      });
      setSelectedTicket(data.data);
      setReplyMessage('');
      toast.success('Reply submitted.');
      fetchMyTickets();
    } catch {
      toast.error('Failed to submit message.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <FiMessageSquare /> Support Enquiries
        </h2>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            if (!showCreateForm) setSelectedTicket(null);
          }}
          className="btn-primary flex items-center gap-2 text-xs py-2 px-4 rounded-xl"
        >
          <FiPlus /> {showCreateForm ? 'Back to Tickets' : 'New Enquiry'}
        </button>
      </div>

      {showCreateForm ? (
        /* Create Ticket Form */
        <form onSubmit={handleCreateTicket} className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-4 max-w-xl shadow-sm">
          <h3 className="font-bold text-sm text-gold uppercase tracking-wider mb-2">Submit New Enquiry</h3>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Subject</label>
            <input
              type="text"
              placeholder="e.g. Need assistance with refund"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-background border border-input rounded-xl px-3.5 py-2.5 text-sm focus:ring-1 focus:ring-gold"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="bg-background border border-input rounded-xl px-3.5 py-2.5 text-sm focus:ring-1 focus:ring-gold"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Description (Minimum 20 characters)</label>
            <textarea
              placeholder="Please describe your enquiry in detail so our support staff can help you."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background border border-input rounded-xl px-3.5 py-2.5 text-sm focus:ring-1 focus:ring-gold h-32 resize-none"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-gold text-white font-semibold py-2.5 rounded-xl hover:bg-gold/90 transition-all text-sm mt-2 shadow-sm self-start px-6"
          >
            Submit Ticket
          </button>
        </form>
      ) : (
        /* Tickets View / Chat View Split */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
          {/* Ticket list side */}
          <div className="md:col-span-1 border border-border bg-card rounded-2xl flex flex-col overflow-hidden h-full shadow-sm">
            <div className="p-4 border-b border-border font-semibold text-sm bg-muted/15">
              Enquiry History
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-14 bg-muted animate-pulse rounded-xl"></div>
                  <div className="h-14 bg-muted animate-pulse rounded-xl"></div>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground">No enquiries submitted yet.</div>
              ) : (
                tickets.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => fetchTicketDetails(t._id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex flex-col gap-1 ${selectedTicket?._id === t._id ? 'border-gold bg-gold/5' : 'border-border bg-card hover:bg-muted/10'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-muted-foreground font-bold">{t.ticketNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${t.status === 'open' ? 'bg-yellow-100 text-yellow-800' : t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : t.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="font-semibold truncate text-sm">{t.subject}</h4>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {new Date(t.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Ticket thread details side */}
          <div className="md:col-span-2 border border-border bg-card rounded-2xl flex flex-col overflow-hidden h-full shadow-sm">
            {selectedTicket ? (
              <div className="flex flex-col h-full">
                {/* Details header */}
                <div className="p-4 border-b border-border bg-muted/10 flex justify-between items-start shrink-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono text-muted-foreground">{selectedTicket.ticketNumber}</span>
                    <h3 className="font-bold text-sm">{selectedTicket.subject}</h3>
                    <span className="text-[10px] text-muted-foreground">
                      Status: <span className="font-semibold capitalize">{selectedTicket.status.replace('_', ' ')}</span> | Priority: <span className="font-semibold capitalize">{selectedTicket.priority}</span>
                    </span>
                  </div>
                  {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                    <button
                      onClick={async () => {
                        try {
                          const { data } = await api.put(`/support-tickets/${selectedTicket._id}/close`, { status: 'resolved' });
                          setSelectedTicket(data.data);
                          toast.success('Ticket marked as resolved.');
                          fetchMyTickets();
                        } catch {
                          toast.error('Failed to resolve ticket.');
                        }
                      }}
                      className="bg-green-50 text-green-600 hover:bg-green-100 text-xs px-3 py-1 rounded-lg font-semibold transition-all"
                    >
                      Mark as Resolved
                    </button>
                  )}
                </div>

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-muted/5">
                  {selectedTicket.messages.map((m, idx) => (
                    <div
                      key={m._id || idx}
                      className={`flex flex-col max-w-[85%] ${m.isAdmin ? 'self-start items-start' : 'self-end items-end'}`}
                    >
                      <span className="text-[9px] text-muted-foreground mb-0.5 px-1 font-semibold">
                        {m.isAdmin ? 'StyleVerse Support Agent' : user?.name} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div
                        className={`p-3.5 rounded-xl text-xs ${m.isAdmin ? 'bg-muted border border-border text-foreground rounded-tl-none' : 'bg-gold text-white rounded-tr-none'}`}
                      >
                        <p className="whitespace-pre-line leading-relaxed">{m.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply bar */}
                {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' ? (
                  <form onSubmit={handleReplySubmit} className="p-3 border-t border-border bg-card flex gap-2 shrink-0">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Send message to support representative..."
                      className="flex-1 bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-gold"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-gold text-white p-3 rounded-xl hover:bg-gold/90 transition-all flex items-center justify-center shadow-sm"
                    >
                      <FiSend size={14} />
                    </button>
                  </form>
                ) : (
                  <div className="p-3 border-t border-border bg-muted/10 text-center text-xs text-muted-foreground shrink-0">
                    This ticket is resolved or closed. Submit a new ticket if you need further help.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 p-6">
                <FiAlertCircle size={24} className="text-muted-foreground/45" />
                <span className="text-xs">Select a support ticket from the list or create a new enquiry above.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSupportPage;
