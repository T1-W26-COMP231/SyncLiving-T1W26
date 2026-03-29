'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import WriteReviewForm from '@/components/reviews/WriteReviewForm';
import { getUsersToReview, getReviewCriteria, getExistingReview, UserToReview, ReviewCriterion, ExistingReview } from './actions';
import { Star, UserCheck, MessageSquare } from 'lucide-react';

export default function ReviewsPage() {
  const [users, setUsers] = useState<UserToReview[]>([]);
  const [criteria, setCriteria] = useState<ReviewCriterion[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [existingReview, setExistingReview] = useState<ExistingReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const [usersData, criteriaData] = await Promise.all([
      getUsersToReview(),
      getReviewCriteria()
    ]);
    setUsers(usersData);
    setCriteria(criteriaData);
    return { usersData };
  }, []);

  useEffect(() => {
    async function init() {
      const { usersData } = await fetchData();
      if (usersData.length > 0) {
        setSelectedUserId(usersData[0].id);
      }
      setLoading(false);
    }
    init();
  }, [fetchData]);

  useEffect(() => {
    if (selectedUserId) {
      setFormLoading(true);
      getExistingReview(selectedUserId).then(review => {
        setExistingReview(review);
        setFormLoading(false);
      });
    } else {
      setExistingReview(null);
    }
  }, [selectedUserId]);

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <Navbar activeTab="Reviews" />
      
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col hidden lg:flex">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="text-primary" size={20} />
              Pending Reviews
            </h2>
            <p className="text-xs text-slate-500 mt-1">Select a roommate to share your experience.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {loading ? (
              <div className="flex flex-col gap-4 p-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-center gap-4">
                <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Star size={24} />
                </div>
                <p className="text-sm text-slate-500 font-medium">No pending reviews found.</p>
              </div>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all text-left border ${
                    selectedUserId === user.id 
                      ? 'bg-primary/5 border-primary/20 shadow-sm' 
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <img
                    alt={user.full_name}
                    className={`size-12 rounded-full object-cover border-2 ${selectedUserId === user.id ? 'border-primary' : 'border-slate-200 dark:border-slate-700'}`}
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`}
                  />
                  <div className="flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold truncate ${selectedUserId === user.id ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                        {user.full_name}
                      </span>
                      {user.average_score && user.average_score > 0 ? (
                        <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                          <Star size={10} fill="currentColor" />
                          {user.average_score.toFixed(1)}
                        </div>
                      ) : null}
                    </div>
                    <span className="text-[10px] text-primary font-bold uppercase tracking-tighter mt-0.5">Ready to Review</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-6 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex items-start gap-3">
              <MessageSquare className="text-slate-400 mt-1" size={16} />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your reviews are confidential and only used to improve matching quality and community safety.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex justify-center">
          {loading || formLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : selectedUser ? (
            <WriteReviewForm 
              targetUser={selectedUser} 
              criteria={criteria} 
              initialData={existingReview}
              onSuccess={fetchData}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 gap-6">
              <div className="size-20 rounded-full bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center text-primary">
                <Star size={40} fill="currentColor" />
              </div>
              <div className="max-w-md flex flex-col gap-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">Help the Community</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Select a roommate from the sidebar to start sharing your experience. Your insights help others make informed decisions.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
