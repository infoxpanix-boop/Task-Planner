import mongoose from 'mongoose';

const completionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  hour: { type: Number, required: true },
});

completionSchema.index({ userId: 1, date: 1, hour: 1 }, { unique: true });

export default mongoose.model('Completion', completionSchema);
