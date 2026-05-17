import mongoose, { Schema, Document } from 'mongoose';

export interface IOption {
  text: string;
  votes: number;
}

export interface IPoll extends Document {
  title: string;
  options: IOption[];
  status: 'active' | 'closed';
  code: string;
  createdAt: Date;
  closedAt?: Date;
}

const OptionSchema = new Schema<IOption>({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 }
});

const PollSchema = new Schema<IPoll>({
  title: { type: String, required: true },
  options: { type: [OptionSchema], required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  code: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date }
});

export const Poll = mongoose.model<IPoll>('Poll', PollSchema);
