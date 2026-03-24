'use client';

import React from 'react';
import { RuleItem } from './RuleItem';
import { Rule } from './types';
import { Button } from '@/components/ui/Button';

const mockRules: Rule[] = [
  {
    id: '1',
    title: '1. Guest Policy',
    description: 'Maximum of 2 overnight guests at a time. No stays longer than 3 nights without consensus.',
    status: 'accepted'
  },
  {
    id: '2',
    title: '2. Cleaning Rotation',
    description: 'Kitchen and Common area deep-clean every Sunday. Alternating responsibilities weekly.',
    status: 'pending',
    commentsCount: 2
  },
  {
    id: '3',
    title: '3. Quiet Hours',
    description: 'Quiet hours from 11 PM to 7 AM on weekdays, 12 AM to 9 AM on weekends.',
    status: 'drafting'
  }
];

export const HouseRules: React.FC = () => {
  return (
    <aside className="w-80 border-l border-primary/10 bg-white dark:bg-slate-900 flex flex-col overflow-hidden hidden xl:flex">
      <div className="p-4 border-b border-primary/10 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">House Rules</h3>
        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase">
          Drafting
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mockRules.map((rule) => (
          <RuleItem key={rule.id} rule={rule} />
        ))}
        
        <button className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-primary hover:border-primary/40 transition-all">
          <span className="material-symbols-outlined">add</span>
          <span className="text-xs font-bold uppercase tracking-wider">Propose New Rule</span>
        </button>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-primary/10">
        <Button className="w-full flex-col gap-1 py-4 h-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">handshake</span>
            <span className="font-bold">Digital Handshake</span>
          </div>
          <span className="text-[10px] opacity-80 font-medium normal-case">
            Finalize and Accept All Rules
          </span>
        </Button>
        <p className="text-[10px] text-center text-slate-400 mt-3 italic">
          Both parties must sign to make rules binding.
        </p>
      </div>
    </aside>
  );
};
