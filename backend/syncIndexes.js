import User from './models/User.js';
import Task from './models/Task.js';
import Completion from './models/Completion.js';
import ImportantTask from './models/ImportantTask.js';

// Reconciles each collection's indexes with the current schema (drops stale
// indexes, creates missing ones). Needed here because the Task/Completion
// unique indexes changed shape when userId scoping was added.
export async function syncIndexes() {
  await Promise.all([
    User.syncIndexes(),
    Task.syncIndexes(),
    Completion.syncIndexes(),
    ImportantTask.syncIndexes(),
  ]);
}
