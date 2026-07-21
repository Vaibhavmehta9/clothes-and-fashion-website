import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswerDocument {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  vendor?: mongoose.Types.ObjectId;
  isVendor: boolean;
  answer: string;
  helpfulCount: number;
  createdAt: Date;
}

export interface IQuestionDocument extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  question: string;
  answers: IAnswerDocument[];
  isAnswered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<IAnswerDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    isVendor: { type: Boolean, default: false },
    answer: { type: String, required: true, minlength: 5, maxlength: 1000 },
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const questionSchema = new Schema<IQuestionDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true, minlength: 10, maxlength: 500 },
    answers: [answerSchema],
    isAnswered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

questionSchema.index({ product: 1, createdAt: -1 });
questionSchema.index({ user: 1 });

export const Question = mongoose.model<IQuestionDocument>('Question', questionSchema);
