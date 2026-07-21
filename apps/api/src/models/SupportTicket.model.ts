import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportTicketDocument extends Document {
  user: mongoose.Types.ObjectId;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  order?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  messages: {
    sender: mongoose.Types.ObjectId;
    message: string;
    isAdmin: boolean;
    createdAt: Date;
  }[];
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicketDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticketNumber: { type: String, required: true, unique: true },
    subject: { type: String, required: true, minlength: 5, maxlength: 200 },
    description: { type: String, required: true, minlength: 20, maxlength: 2000 },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    messages: [
      {
        sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true },
        isAdmin: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: Date,
    closedAt: Date,
  },
  { timestamps: true }
);

supportTicketSchema.pre('validate', function (next) {
  if (this.isNew && !this.ticketNumber) {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.ticketNumber = `TKT-${year}-${random}`;
  }
  next();
});

supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ ticketNumber: 1 });

export const SupportTicket = mongoose.model<ISupportTicketDocument>('SupportTicket', supportTicketSchema);
