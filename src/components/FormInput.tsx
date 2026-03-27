import { forwardRef } from 'react';
import { FormFieldError } from '@/hooks/useFormValidation';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: FormFieldError;
  touched?: boolean;
  helperText?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, touched, helperText, className = '', ...props }, ref) => {
    const hasError = error?.hasError && touched;
    const showError = hasError && error?.message;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label 
            htmlFor={props.id}
            className={`text-xs font-medium ${
              hasError ? 'text-red-400' : 'text-slate-300'
            }`}
          >
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          className={`
            w-full rounded-xl border px-4 py-3 text-sm text-white outline-none ring-0 
            placeholder:text-slate-500 transition-colors
            ${hasError 
              ? 'border-red-500/70 bg-red-500/5 focus:border-red-500' 
              : 'border-slate-800 bg-slate-900/30 focus:border-axion-500/70'
            }
            ${className}
          `}
          {...props}
        />
        
        <div className="min-h-[1.25rem]">
          {showError ? (
            <p className="text-xs text-red-400">{error.message}</p>
          ) : helperText && !touched ? (
            <p className="text-xs text-slate-500">{helperText}</p>
          ) : null}
        </div>
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
