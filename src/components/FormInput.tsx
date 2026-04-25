import { forwardRef } from 'react';
import { FormFieldError } from '@/hooks/useFormValidation';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: FormFieldError;
  touched?: boolean;
  helperText?: string;
  children?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, touched, helperText, children, className = '', ...props }, ref) => {
    const hasError = error?.hasError && touched;
    const showError = hasError && error?.message;
    const { onChange, ...inputProps } = props;

    const inputId = props.id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label 
            htmlFor={inputId}
            className={`text-xs font-medium ${
              hasError ? 'text-red-500 dark:text-red-400' : 'text-text-secondary'
            }`}
          >
            {label}
            {props.required && <span className="text-red-500 dark:text-red-400 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={`${showError ? errorId : ''} ${helperText ? helperId : ''}`.trim() || undefined}
          className={`
            w-full rounded-xl border px-4 py-3 text-sm text-text-primary 
            transition-all duration-200
            placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-axion-500/50 focus:border-axion-500
            ${hasError 
              ? 'border-red-500/70 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-border-primary bg-background-secondary/30'
            }
            ${className}
          `}
          {...inputProps}
          onChange={(event) => onChange?.(event.target.value as never)}
        />
        
        <div className="min-h-[1.25rem]">
          {showError ? (
            <p id={errorId} className="text-xs text-red-500 dark:text-red-400 font-medium">{error.message}</p>
          ) : helperText && !touched ? (
            <p id={helperId} className="text-xs text-text-muted">{helperText}</p>
          ) : null}
        </div>
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
