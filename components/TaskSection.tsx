
import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import { Todo } from '../types';
import { CheckCircle2, Circle, Clock, AlertCircle, ListTodo, Zap, ShieldCheck } from 'lucide-react';

interface TaskSectionProps {
  uid: string;
}

const TaskSection: React.FC<TaskSectionProps> = ({ uid }) => {
  const [tasks, setTasks] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const tasksRef = collection(db, 'users', uid, 'todo');
    const unsub = onSnapshot(tasksRef, (snap) => {
      const tasksData = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Todo));
      // Sort in-memory: incomplete first, then by date
      const sorted = [...tasksData].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setTasks(sorted);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/todo`));

    return () => unsub();
  }, [uid]);

  const toggleTask = async (task: Todo) => {
    try {
      const taskRef = doc(db, 'users', uid, 'todo', task.id);
      await updateDoc(taskRef, { completed: !task.completed });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/todo/${task.id}`);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-500 bg-white/5 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="p-12 md:p-24 flex items-center justify-center">
        <div className="text-[var(--accent)] font-bold text-base animate-pulse">Syncing tasks...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 lg:p-14 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-2xl">
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-main)] tracking-tight">Study Directives</h1>
        </div>
        <p className="text-[var(--text-muted)] font-medium text-xs">Assigned study goals and instructor checkpoints</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Active Tasks</p>
          <p className="text-3xl font-bold text-[var(--text-main)]">{tasks.filter(t => !t.completed).length}</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Completed</p>
          <p className="text-3xl font-bold text-emerald-500">{tasks.filter(t => t.completed).length}</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Completion Rate</p>
          <p className="text-3xl font-bold text-[var(--accent)]">
            {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] rounded-3xl p-12 text-center">
            <Zap size={36} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
            <p className="text-[var(--text-main)] font-semibold text-sm">No active tasks found.</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Check back later for instructor assignments.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id}
              onClick={() => toggleTask(task)}
              className={`group flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                task.completed 
                  ? 'bg-[var(--bg-surface)]/60 border-[var(--border-color)] opacity-70' 
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--border-strong)] hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`transition-colors shrink-0 ${task.completed ? 'text-emerald-500' : 'text-[var(--text-muted)] group-hover:text-[var(--accent)]'}`}>
                  {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </div>
                <div>
                  <h3 className={`text-base font-semibold leading-snug ${task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>
                    {task.text}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`px-2 py-0.5 border rounded-md text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                      {task.priority || 'Medium'}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-medium flex items-center gap-1">
                      <Clock size={11} /> {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {!task.completed && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="px-3 py-1.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg text-xs font-bold uppercase tracking-wider border border-[var(--accent)]/20">
                    Complete
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskSection;
