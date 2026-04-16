'use client';

import React, { useState } from 'react';
import { CheckCircle2, RefreshCw, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import {
  RuleData,
  RuleComment,
  updateRule,
  submitRuleForReview,
  acceptRule,
  sendRuleBack,
  addRuleComment,
  getRuleComments,
} from '../../../app/messages/actions';

interface RuleItemProps {
  rule: RuleData;
  currentUserId: string;
  conversationId: string;
  onRuleUpdated: () => void;
}

export const RuleItem: React.FC<RuleItemProps> = ({
  rule,
  currentUserId,
  conversationId,
  onRuleUpdated,
}) => {
  const isProposer = rule.proposer_id === currentUserId;

  const [editing, setEditing]       = useState(false);
  const [editTitle, setEditTitle]   = useState(rule.title);
  const [editDesc, setEditDesc]     = useState(rule.description);
  const [saving, setSaving]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accepting, setAccepting]   = useState(false);
  const [sendingBack, setSendingBack] = useState(false);

  const [showComments, setShowComments]     = useState(false);
  const [comments, setComments]             = useState<RuleComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText]       = useState('');
  const [addingComment, setAddingComment]   = useState(false);

  const statusStyles: Record<RuleData['status'], string> = {
    accepted: 'border-green-100 bg-green-50/30 dark:bg-green-900/10 dark:border-green-900/20',
    pending:  'border-primary/20 bg-primary/5',
    drafting: 'border-slate-200 dark:border-slate-700',
  };

  const statusIcons: Record<RuleData['status'], React.ReactNode> = {
    accepted: <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />,
    pending:  <RefreshCw   size={14} className="text-primary animate-spin-slow flex-shrink-0" />,
    drafting: <Clock       size={14} className="text-slate-400 flex-shrink-0" />,
  };

  const statusBadge: Record<RuleData['status'], { label: string; cls: string }> = {
    accepted: { label: 'Accepted',      cls: 'bg-green-100 text-green-700' },
    pending:  { label: 'Pending Review', cls: 'bg-amber-100 text-amber-700' },
    drafting: { label: 'Private Draft',  cls: 'bg-slate-100 text-slate-500' },
  };

  async function handleSaveEdit() {
    if (!editTitle.trim()) return;
    setSaving(true);
    const result = await updateRule(rule.id, editTitle.trim(), editDesc.trim());
    setSaving(false);
    if (result.error) { alert(result.error); return; }
    setEditing(false);
    onRuleUpdated();
  }

  async function handleSubmit() {
    setSubmitting(true);
    const result = await submitRuleForReview(rule.id, conversationId);
    setSubmitting(false);
    if (result.error) { alert(result.error); return; }
    onRuleUpdated();
  }

  async function handleAccept() {
    setAccepting(true);
    const result = await acceptRule(rule.id, conversationId);
    setAccepting(false);
    if (result.error) { alert(result.error); return; }
    onRuleUpdated();
  }

  async function handleSendBack() {
    setSendingBack(true);
    const result = await sendRuleBack(rule.id, conversationId);
    setSendingBack(false);
    if (result.error) { alert(result.error); return; }
    onRuleUpdated();
  }

  async function loadComments() {
    const data = await getRuleComments(rule.id);
    setComments(data);
    setCommentsLoaded(true);
  }

  async function toggleComments() {
    if (!showComments && !commentsLoaded) {
      await loadComments();
    }
    setShowComments(v => !v);
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    setAddingComment(true);
    const result = await addRuleComment(rule.id, commentText.trim());
    setAddingComment(false);
    if (result.error) { alert(result.error); return; }
    setCommentText('');
    await loadComments();
  }

  const { label: badgeLabel, cls: badgeCls } = statusBadge[rule.status];

  return (
    <div className={`rounded-xl border transition-colors ${statusStyles[rule.status]}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start gap-2 mb-1">
          {editing ? (
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="flex-1 text-sm font-bold px-2 py-1 rounded-lg border border-primary/30 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          ) : (
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex-1 leading-snug">
              {rule.title}
            </h4>
          )}
          <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide ${badgeCls}`}>
              {badgeLabel}
            </span>
            {statusIcons[rule.status]}
          </div>
        </div>

        {/* Description / edit textarea */}
        {editing ? (
          <textarea
            value={editDesc}
            onChange={e => setEditDesc(e.target.value)}
            rows={3}
            className="w-full mt-2 text-xs px-2 py-1.5 rounded-lg border border-primary/30 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        ) : (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
            {rule.description}
          </p>
        )}

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {/* Edit mode controls */}
          {editing && (
            <>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editTitle.trim()}
                className="text-[10px] font-bold text-primary hover:underline disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <span className="text-[10px] text-slate-300">|</span>
              <button
                onClick={() => setEditing(false)}
                className="text-[10px] font-bold text-slate-500 hover:underline"
              >
                Cancel
              </button>
            </>
          )}

          {/* Proposer + drafting: Edit + Submit for Review */}
          {isProposer && rule.status === 'drafting' && !editing && (
            <>
              <button
                onClick={() => { setEditing(true); setEditTitle(rule.title); setEditDesc(rule.description); }}
                className="text-[10px] font-bold text-slate-500 hover:text-primary transition-colors"
              >
                Edit
              </button>
              <span className="text-[10px] text-slate-300">|</span>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="text-[10px] font-bold text-primary hover:underline disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit for Review'}
              </button>
            </>
          )}

          {/* Non-proposer + pending: Accept + Send Back */}
          {!isProposer && rule.status === 'pending' && (
            <>
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="text-[10px] font-bold text-green-600 hover:underline disabled:opacity-50"
              >
                {accepting ? 'Accepting…' : 'Accept'}
              </button>
              <span className="text-[10px] text-slate-300">|</span>
              <button
                onClick={handleSendBack}
                disabled={sendingBack}
                className="text-[10px] font-bold text-amber-600 hover:underline disabled:opacity-50"
              >
                {sendingBack ? 'Sending…' : 'Send Back'}
              </button>
            </>
          )}

          {/* Proposer + pending: waiting indicator */}
          {isProposer && rule.status === 'pending' && (
            <span className="text-[10px] text-slate-400 italic">Awaiting review…</span>
          )}

          {/* Comments toggle — visible for non-draft rules */}
          {rule.status !== 'drafting' && (
            <>
              <span className="text-[10px] text-slate-300">|</span>
              <button
                onClick={toggleComments}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-primary transition-colors"
              >
                <MessageSquare size={11} />
                {rule.comments_count > 0 ? `Comments (${rule.comments_count})` : 'Comments'}
                {showComments ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expandable comments section */}
      {showComments && (
        <div className="border-t border-primary/10 px-4 pb-4 pt-3 space-y-3">
          {comments.length === 0 ? (
            <p className="text-[10px] text-slate-400 italic">No comments yet.</p>
          ) : (
            <div className="space-y-2">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <img
                    src={
                      comment.author_avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_name || 'U')}&size=24`
                    }
                    alt={comment.author_name || 'User'}
                    className="size-5 rounded-full object-cover flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                      {comment.author_name ?? 'User'}
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
              placeholder="Add a comment…"
              className="flex-1 text-[11px] px-2 py-1.5 rounded-lg border border-primary/20 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              onClick={handleAddComment}
              disabled={addingComment || !commentText.trim()}
              className="text-[10px] font-bold text-primary px-2 py-1.5 rounded-lg hover:bg-primary/10 disabled:opacity-50 transition-colors"
            >
              {addingComment ? '…' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
