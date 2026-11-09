
import React, { useState, useEffect } from 'react';
import { Question, UserStats } from '../types';
import { db, collection, addDoc, onSnapshot, query, where, orderBy, handleFirestoreError, OperationType } from '../firebase';
import { ArrowLeft, MessageSquare, Send, CheckCircle2, Clock, Loader2 } from 'lucide-react';

interface QuestionViewProps {
  userStats: UserStats;
  onBack: () => void;
}

const QuestionView: React.FC<QuestionViewProps> = ({ userStats, onBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'questions'),
      where('uid', '==', userStats.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const questionsData = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Question))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setQuestions(questionsData);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'questions'));

    return () => unsub();
  }, [userStats.uid]);

  const handleSubmit = async () => {
    if (!newQuestion.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'questions'), {
        uid: userStats.uid,
        email: userStats.email,
        text: newQuestion.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setNewQuestion('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'questions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 md:p-12 lg:p-16 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors uppercase font-bold tracking-wider text-xs"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ask a Question Section */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-sm sticky top-24">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                <MessageSquare size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Ask Instructor</h2>
                <p className="text-xs text-[var(--text-muted)]">Direct question line</p>
              </div>
            </div>
            
            <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
              Stuck on a concept? Need clarification on an objective? Send a direct question to your instructor.
            </p>

            <div className="space-y-4">
              <textarea 
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Type your question here..."
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-all min-h-[140px] resize-none text-sm leading-relaxed"
              />
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !newQuestion.trim()}
                className="w-full bg-[var(--accent)] text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[var(--accent-glow)]"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Send Question
              </button>
            </div>
          </div>
        </div>

        {/* Previous Questions Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[var(--text-main)] tracking-tight">Question History</h3>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{questions.length} Total</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[var(--accent)]" size={28} />
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] rounded-3xl p-12 text-center">
              <MessageSquare className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" size={40} />
              <p className="text-[var(--text-muted)] font-medium text-sm">No questions asked yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm hover:border-[var(--border-strong)] transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2.5">
                      {q.status === 'answered' ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Answered</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                          <Clock size={12} className="text-amber-500" />
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Pending</span>
                        </div>
                      )}
                      <span className="text-[11px] text-[var(--text-muted)] font-medium">{formatDate(q.createdAt)}</span>
                    </div>
                  </div>

                  <p className="text-[var(--text-main)] font-semibold text-base mb-4 leading-relaxed">"{q.text}"</p>

                  {q.answer && (
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] p-5 rounded-xl relative">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">Instructor Response:</p>
                      <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{q.answer}</p>
                      {q.answeredAt && (
                        <p className="text-[10px] text-[var(--text-muted)] font-medium mt-3">
                          Replied: {formatDate(q.answeredAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionView;
