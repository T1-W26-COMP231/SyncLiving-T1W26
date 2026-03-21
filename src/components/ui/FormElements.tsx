import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  iconLeft?: React.ReactNode;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, iconLeft, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
        </label>
        <div className="relative rounded-xl shadow-sm">
          {iconLeft && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              {iconLeft}
            </div>
          )}
          <input
            ref={ref}
            className={`
              block w-full rounded-xl border-slate-200 bg-slate-50 
              ${iconLeft ? 'pl-8' : 'pl-4'} pr-4 py-3 
              text-slate-900 placeholder-slate-400 
              focus:border-primary focus:ring-primary sm:text-sm transition-all
              ${className}
            `}
            {...props}
          />
        </div>
      </div>
    );
  }
);
FormInput.displayName = 'FormInput';

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
        </label>
        <textarea
          ref={ref}
          className={`
            block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 
            text-slate-900 placeholder-slate-400 
            focus:border-primary focus:ring-primary sm:text-sm transition-all
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);
FormTextarea.displayName = 'FormTextarea';
