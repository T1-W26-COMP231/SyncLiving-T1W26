'use client';

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Plus, Handshake, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/utils/supabase/client';
import {
  getRules,
  getConversationDetails,
  proposeRule,
  signAgreement,
  RuleData,
  ConversationDetails,
} from '../../../app/messages/actions';
import { RuleItem } from './RuleItem';

interface HouseRulesProps {
  conversationId: string | null;
  currentUserId: string;
  /** Called whenever accepted/total rule counts change, for the sidebar progress bar */
  onStatsChange?: (accepted: number, total: number) => void;
}

export const HouseRules: React.FC<HouseRulesProps> = ({
  conversationId,
  currentUserId,
  onStatsChange,
}) => {
  const [rules, setRules]             = useState<RuleData[]>([]);
  const [convDetails, setConvDetails] = useState<ConversationDetails | null>(null);
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [proposeTitle, setProposeTitle] = useState('');
  const [proposeDesc, setProposeDesc]   = useState('');
  const [proposing, setProposing]       = useState(false);
  const [signing, setSigning]           = useState(false);

  // Stable supabase client reference — avoids tearing down realtime on each render
  const supabaseRef = useRef(createClient());

  // Keep a stable ref to onStatsChange so refreshRules doesn't depend on the
  // prop reference (which callers often pass as an inline arrow function,
  // causing an infinite re-render loop if included in useCallback deps).
  const onStatsChangeRef = useRef(onStatsChange);
  useLayoutEffect(() => { onStatsChangeRef.current = onStatsChange; });

  const refreshRules = useCallback(async () => {
    if (!conversationId) return;
    const [rulesData, details] = await Promise.all([
      getRules(conversationId),
      getConversationDetails(conversationId),
    ]);
    setRules(rulesData);
    setConvDetails(details);
    const accepted = rulesData.filter(r => r.status === 'accepted').length;
    onStatsChangeRef.current?.(accepted, rulesData.length);
  }, [conversationId]);

  // Initial fetch + real-time subscription whenever the conversation changes
  useEffect(() => {
    if (!conversationId) {
      setRules([]);
      setConvDetails(null);
      return;
    }
    refreshRules();

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`realtime:rules:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_rules',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => refreshRules(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, refreshRules]);

  async function handlePropose() {
    if (!conversationId || !proposeTitle.trim()) return;
    setProposing(true);
    const result = await proposeRule(conversationId, proposeTitle.trim(), proposeDesc.trim());
    setProposing(false);
    if (result.error) { alert(result.error); return; }
    setProposeTitle('');
    setProposeDesc('');
    setShowProposeForm(false);
    refreshRules();
  }

  async function handleSign() {
    if (!conversationId) return;
    setSigning(true);
    const result = await signAgreement(conversationId);
    setSigning(false);
    if (result.error) { alert(result.error); return; }
    refreshRules();
  }

  // Derive display state
  const acceptedCount = rules.filter(r => r.status === 'accepted').length;
  const totalCount    = rules.length;
  const allAccepted   = totalCount > 0 && acceptedCount === totalCount;
  const hasPending    = rules.some(r => r.status === 'pending');
  const isFinalized   = convDetails?.is_finalized ?? false;

  const isProvider = convDetails?.provider_id === currentUserId;
  const hasSigned  = convDetails
    ? (isProvider ? convDetails.provider_signed : convDetails.seeker_signed)
    : false;

  // Only show drafts that belong to the current user (the other party's drafts are private)
  const visibleRules = rules.filter(
    r => r.status !== 'drafting' || r.proposer_id === currentUserId,
  );

  const statusLabel = isFinalized
    ? 'Finalized'
    : allAccepted
    ? 'Ready to Sign'
    : hasPending
    ? 'Pending Review'
    : 'Drafting';

  const statusBadgeCls: Record<string, string> = {
    'Finalized':      'bg-emerald-100 text-emerald-700',
    'Ready to Sign':  'bg-green-100 text-green-700',
    'Pending Review': 'bg-amber-100 text-amber-700',
    'Drafting':       'bg-yellow-100 text-yellow-700',
  };

  return (
    <aside className="w-80 border-l border-primary/10 bg-white dark:bg-slate-900 flex-col overflow-hidden hidden xl:flex">
      {/* Header */}
      <div className="p-4 border-b border-primary/10 flex items-center justify-between flex-shrink-0">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">House Rules</h3>
        <span
          className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide ${
            statusBadgeCls[statusLabel] ?? 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Rules list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!conversationId ? (
          <p className="text-xs text-slate-400 text-center py-8">
            Select a conversation to view house rules.
          </p>
        ) : visibleRules.length === 0 && !showProposeForm ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No rules yet — propose the first one!
          </p>
        ) : (
          visibleRules.map(rule => (
            <RuleItem
              key={rule.id}
              rule={rule}
              currentUserId={currentUserId}
              conversationId={conversationId}
              onRuleUpdated={refreshRules}
            />
          ))
        )}

        {/* Propose form */}
        {showProposeForm ? (
          <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-3">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">New Rule</p>
            <input
              value={proposeTitle}
              onChange={e => setProposeTitle(e.target.value)}
              placeholder="Rule title…"
              className="w-full text-sm px-3 py-2 rounded-lg border border-primary/20 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <textarea
              value={proposeDesc}
              onChange={e => setProposeDesc(e.target.value)}
              placeholder="Describe the rule…"
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-lg border border-primary/20 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handlePropose}
                disabled={proposing || !proposeTitle.trim()}
                className="flex-1 py-2 rounded-lg bg-primary text-dark text-xs font-bold disabled:opacity-50 hover:brightness-105 transition-all"
              >
                {proposing ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                onClick={() => {
                  setShowProposeForm(false);
                  setProposeTitle('');
                  setProposeDesc('');
                }}
                className="px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : !isFinalized && conversationId && (
          <button
            onClick={() => setShowProposeForm(true)}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-primary hover:border-primary/40 transition-all"
          >
            <Plus size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Propose New Rule</span>
          </button>
        )}
      </div>

      {/* Digital Handshake footer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-primary/10 flex-shrink-0">
        {isFinalized ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <p className="text-sm font-bold text-emerald-600">Agreement Finalized</p>
            <p className="text-[10px] text-slate-400 text-center">
              All house rules are now binding for both parties.
            </p>
          </div>
        ) : hasSigned ? (
          <>
            <Button
              className="w-full flex-col gap-1 py-4 h-auto opacity-60 cursor-not-allowed"
              disabled
            >
              <div className="flex items-center gap-2">
                <Handshake size={18} />
                <span className="font-bold">Signed — Waiting</span>
              </div>
              <span className="text-[10px] opacity-80 font-medium normal-case">
                Waiting for the other party to sign
              </span>
            </Button>
            <p className="text-[10px] text-center text-slate-400 mt-3 italic">
              You have signed. The agreement finalizes when both parties sign.
            </p>
          </>
        ) : (
          <>
            <Button
              onClick={handleSign}
              disabled={signing || !allAccepted || !conversationId}
              className="w-full flex-col gap-1 py-4 h-auto"
            >
              <div className="flex items-center gap-2">
                <Handshake size={18} />
                <span className="font-bold">Digital Handshake</span>
              </div>
              <span className="text-[10px] opacity-80 font-medium normal-case">
                {signing ? 'Signing…' : 'Finalize and Accept All Rules'}
              </span>
            </Button>
            <p className="text-[10px] text-center mt-3 italic text-slate-400">
              {!conversationId
                ? 'Select a conversation first.'
                : totalCount === 0
                ? 'Propose and accept rules before signing.'
                : !allAccepted
                ? `${acceptedCount} of ${totalCount} rules accepted — all must be accepted first.`
                : 'Both parties must sign to make rules binding.'}
            </p>
          </>
        )}
      </div>
    </aside>
  );
};
