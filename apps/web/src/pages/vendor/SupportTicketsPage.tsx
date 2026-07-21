import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiMessageSquare, FiSend, FiUser, FiInfo, FiCheckSquare, FiAlertCircle } from 'react-icons/fi';
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
  user: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
  };
  messages: MessageType[];
  createdAt: string;
}

const SupportTicketsPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const url = statusFilter ? `/support-tickets?status=${statusFilter}` : '/support-tickets';
      const { data } = await api.get(url);
      setTickets(data.data || []);
    } catch {
      toast.error('Failed to load support tickets.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketDetails = async (id: string) => {
    try {
      const { data } = await api.get(`/support-tickets/${id}`);
      setSelectedTicket(data.data);
    } catch {
      toast.error('Failed to load ticket details.');
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      const { data } = await api.post(`/support-tickets/${selectedTicket._id}/reply`, {
        message: replyMessage,
      });
      setSelectedTicket(data.data);
      setReplyMessage('');
      toast.success('Reply sent.');
      fetchTickets();
    } catch {
      toast.error('Failed to send reply.');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const { data } = await api.put(`/support-tickets/${id}`, { status });
      if (selectedTicket?._id === id) {
        setSelectedTicket(data.data);
      }
      toast.success(`Ticket marked as ${status}.`);
      fetchTickets();
    } catch {
      toast.error('Failed to update ticket status.');
    }
  };

  const handleAssignToSelf = async (id: string) => {
    try {
      const { data } = await api.put(`/support-tickets/${id}`, { assignedTo: currentUser?.id });
      if (selectedTicket?._id === id) {
        setSelectedTicket(data.data);
      }
      toast.success('Ticket assigned to you.');
      fetchTickets();
    } catch {
      toast.error('Failed to assign ticket.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)]">
      {/* Tickets List */}
      <div className="lg:col-span-1 bg-card border border-border rounded-3xl flex flex-col overflow-hidden shadow-sm h-full">
        <div className="p-6 border-b border-border flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FiMessageSquare /> Customer Enquiries
            </h3>
            <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full font-semibold">
              {tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length} Active
            </span>
          </div>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-gold"
          >
            <option value="">All Tickets</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-20 bg-muted animate-pulse rounded-2xl"></div>
              <div className="h-20 bg-muted animate-pulse rounded-2xl"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">No tickets found.</div>
          ) : (
            tickets.map((t) => (
              <button
                key={t._id}
                onClick={() => fetchTicketDetails(t._id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 ${selectedTicket?._id === t._id ? 'border-gold bg-gold/5 shadow-sm' : 'border-border bg-card hover:bg-muted/10'}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-mono font-bold text-muted-foreground">{t.ticketNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${t.status === 'open' ? 'bg-yellow-100 text-yellow-800' : t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : t.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="font-semibold text-sm line-clamp-1">{t.subject}</h4>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                  <span>By: {t.user?.name}</span>
                  <span className={`font-bold capitalize ${t.priority === 'high' ? 'text-red-500' : t.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {t.priority} priority
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Ticket Details / Chat View */}
      <div className="lg:col-span-2 bg-card border border-border rounded-3xl flex flex-col overflow-hidden shadow-sm h-full">
        {selectedTicket ? (
          <div className="flex flex-col h-full">
            {/* Header info */}
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10 shrink-0">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{selectedTicket.ticketNumber}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className={`text-xs font-bold capitalize ${selectedTicket.priority === 'high' ? 'text-red-500' : selectedTicket.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {selectedTicket.priority} Priority
                  </span>
                </div>
                <h3 className="font-bold text-base">{selectedTicket.subject}</h3>
                <span className="text-xs text-muted-foreground">Owner: {selectedTicket.user?.name} ({selectedTicket.user?.email})</span>
              </div>

              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                  {/* Status update select */}
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(selectedTicket._id, e.target.value)}
                    className="bg-background border border-input rounded-xl px-2.5 py-1 text-xs font-semibold focus:ring-1 focus:ring-gold"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  {/* Assign to Self button */}
                  {(!selectedTicket.assignedTo || selectedTicket.assignedTo._id !== currentUser?.id) ? (
                    <button
                      onClick={() => handleAssignToSelf(selectedTicket._id)}
                      className="bg-gold text-white font-semibold px-3 py-1 rounded-xl text-xs hover:bg-gold/90 transition-all shadow-sm"
                    >
                      Assign to Me
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold px-2">
                      <FiCheckSquare /> Assigned to you
                    </span>
                  )}
                </div>
                {selectedTicket.assignedTo && selectedTicket.assignedTo._id !== currentUser?.id && (
                  <span className="text-[10px] text-muted-foreground">Assigned to: {selectedTicket.assignedTo.name}</span>
                )}
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-muted/5">
              {selectedTicket.messages.map((m, idx) => {
                const isCurrentUserSender = m.sender?._id === currentUser?.id;
                return (
                  <div
                    key={m._id || idx}
                    className={`flex flex-col max-w-[80%] ${m.isAdmin ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    <span className="text-[10px] text-muted-foreground mb-1 px-1">
                      {m.sender?.name || 'User'} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div
                      className={`p-4 rounded-2xl text-sm ${m.isAdmin ? 'bg-gold text-white rounded-tr-none' : 'bg-card border border-border text-foreground rounded-tl-none'}`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{m.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Form */}
            {selectedTicket.status !== 'closed' ? (
              <form onSubmit={handleReplySubmit} className="p-4 border-t border-border bg-card flex gap-3 shrink-0">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type support reply or update detail..."
                  className="flex-1 bg-background border border-input rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold h-14 resize-none"
                  required
                />
                <button
                  type="submit"
                  className="bg-gold text-white font-bold p-4 rounded-2xl hover:bg-gold/90 transition-all flex items-center justify-center shadow-sm"
                >
                  <FiSend size={18} />
                </button>
              </form>
            ) : (
              <div className="p-4 border-t border-border bg-muted/10 text-center text-xs text-muted-foreground shrink-0">
                This support ticket has been closed. Change status to reopen.
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <FiInfo size={32} className="text-muted-foreground/50" />
            <p className="text-sm">Select an enquiry from the left to reply or update details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTicketsPage;
