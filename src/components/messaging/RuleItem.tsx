import React from 'react';
import { Rule } from './types';
import { CheckCircle2, RefreshCw, Clock } from 'lucide-react';

interface RuleItemProps {
  rule: Rule;
}

export const RuleItem: React.FC<RuleItemProps> = ({ rule }) => {
  const statusStyles = {
    accepted: "border-green-100 bg-green-50/30 dark:bg-green-900/10 dark:border-green-900/20",
    pending: "border-primary/20 bg-primary/5",
    drafting: "border-slate-200 dark:border-slate-700 hover:border-primary/50"
  };

  const statusIcons = {
    accepted: <CheckCircle2 size={16} className="text-green-500" />,
    pending:  <RefreshCw   size={16} className="text-primary"   />,
    drafting: <Clock       size={16} className="text-slate-400" />
  };

  return (
    <div className={`p-4 rounded-xl border transition-colors ${statusStyles[rule.status]}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className={`text-sm font-bold ${rule.status === 'pending' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-700 dark:text-slate-200'}`}>
          {rule.title}
        </h4>
        {statusIcons[rule.status]}
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        {rule.description}
      </p>
      {rule.status === 'pending' && (
        <div className="flex items-center gap-2 mt-3">
          <button className="text-[10px] font-bold text-primary hover:underline">Suggest Edit</button>
          <span className="text-[10px] text-slate-300">|</span>
          <button className="text-[10px] font-bold text-slate-500 hover:underline">
            View Comments ({rule.commentsCount || 0})
          </button>
        </div>
      )}
    </div>
  );
};
