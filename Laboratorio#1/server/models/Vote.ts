import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  pollId: mongoose.Types.ObjectId;
  optionIndex: number;
  voterName: string;
  createdAt: Date;
}

const VoteSchema = new Schema<IVote>({
  pollId: { type: Schema.Types.ObjectId, ref: 'Poll', required: true },
  optionIndex: { type: Number, required: true },
  voterName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

VoteSchema.index({ pollId: 1, voterName: 1 }, { unique: true });

export const Vote = mongoose.model<IVote>('Vote', VoteSchema);
