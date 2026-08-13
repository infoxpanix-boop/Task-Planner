import mongoose from 'mongoose';

// key is either a weekday template id ('1'..'5', Mon..Fri) or a specific
// date override ('YYYY-MM-DD'). Mirrors the planner's "weekday default,
// overridable per date" behavior. Scoped per user.
const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true },
  hour: { type: Number, required: true },
  name: { type: String, required: true },
});

taskSchema.index({ userId: 1, key: 1, hour: 1 }, { unique: true });

export default mongoose.model('Task', taskSchema);
