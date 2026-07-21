import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { SupportTicket } from '../models/SupportTicket.model';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

// @route   GET /api/v1/support-tickets
export const getAllTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, priority, assignedTo } = req.query;
  const filter: Record<string, unknown> = {};

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;

  const tickets = await SupportTicket.find(filter)
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .populate('assignedTo', 'name email');

  res.status(200).json({ success: true, data: tickets });
});

// @route   GET /api/v1/support-tickets/my
export const getMyTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tickets = await SupportTicket.find({ user: req.user!.id })
    .sort({ createdAt: -1 })
    .populate('assignedTo', 'name email');

  res.status(200).json({ success: true, data: tickets });
});

// @route   POST /api/v1/support-tickets
export const createTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subject, description, priority, order } = req.body;

  const ticket = await SupportTicket.create({
    user: req.user!.id,
    subject,
    description,
    priority,
    order,
    messages: [
      {
        sender: req.user!.id,
        message: description,
        isAdmin: false,
      },
    ],
  });

  res.status(201).json({ success: true, data: ticket });
});

// @route   GET /api/v1/support-tickets/:id
export const getTicketDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate('user', 'name email')
    .populate('assignedTo', 'name email')
    .populate('messages.sender', 'name email');

  if (!ticket) throw new AppError('Ticket not found.', 404);

  // Authorize: Admin, Support, or the ticket owner
  if (req.user!.role === 'customer' && String(ticket.user._id) !== req.user!.id) {
    throw new AppError('Not authorized to view this ticket.', 403);
  }

  res.status(200).json({ success: true, data: ticket });
});

// @route   POST /api/v1/support-tickets/:id/reply
export const replyToTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) throw new AppError('Ticket not found.', 404);

  // Authorize: Admin, Support, or the ticket owner
  const isAgent = ['admin', 'support'].includes(req.user!.role);
  if (!isAgent && String(ticket.user) !== req.user!.id) {
    throw new AppError('Not authorized.', 403);
  }

  ticket.messages.push({
    sender: req.user!.id,
    message,
    isAdmin: isAgent,
    createdAt: new Date(),
  });

  // Automatically mark open / in_progress on agent reply
  if (isAgent && ticket.status === 'open') {
    ticket.status = 'in_progress';
  }

  await ticket.save();

  const populated = await SupportTicket.findById(ticket._id)
    .populate('user', 'name email')
    .populate('assignedTo', 'name email')
    .populate('messages.sender', 'name email');

  res.status(200).json({ success: true, data: populated });
});

// @route   PUT /api/v1/support-tickets/:id
export const updateTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, priority, assignedTo } = req.body;
  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) throw new AppError('Ticket not found.', 404);

  if (status) {
    ticket.status = status;
    if (status === 'resolved') ticket.resolvedAt = new Date();
    if (status === 'closed') ticket.closedAt = new Date();
  }
  if (priority) ticket.priority = priority;
  if (assignedTo !== undefined) ticket.assignedTo = assignedTo || undefined;

  await ticket.save();

  const populated = await SupportTicket.findById(ticket._id)
    .populate('user', 'name email')
    .populate('assignedTo', 'name email')
    .populate('messages.sender', 'name email');

  res.status(200).json({ success: true, message: 'Ticket updated.', data: populated });
});

// @route   PUT /api/v1/support-tickets/:id/close (Customer - close their own ticket)
export const closeMyTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new AppError('Ticket not found.', 404);

  // Only the owner can close via this route
  if (String(ticket.user) !== req.user!.id && !['admin', 'support'].includes(req.user!.role)) {
    throw new AppError('Not authorized.', 403);
  }

  ticket.status = req.body.status === 'closed' ? 'closed' : 'resolved';
  if (ticket.status === 'resolved') ticket.resolvedAt = new Date();
  if (ticket.status === 'closed') ticket.closedAt = new Date();
  await ticket.save();

  const populated = await SupportTicket.findById(ticket._id)
    .populate('user', 'name email')
    .populate('assignedTo', 'name email')
    .populate('messages.sender', 'name email');

  res.status(200).json({ success: true, message: 'Ticket closed.', data: populated });
});

