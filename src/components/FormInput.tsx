import { forwardRef } from "react";
import type { FieldError } from "react-hook-form";

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | React.ReactNode;
  error?: FieldError;
  touched?: boolean;
  helperText?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, touched = false, helperText, className = "", id, ...props }, ref) => {
    const hasError = Boolean(error);
    const showError = hasError && (touched || props["aria-invalid"] === true || props["aria-invalid"] === "true");
    const inputId =
      id ??
      (typeof label === "string" ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : "input-field");
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const describedBy = [showError ? errorId : null, helperText && !showError ? helperId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="flex w-full flex-col gap-2">
        {label ? (
          <label
            htmlFor={inputId}
            className={`text-xs font-medium ${
              hasError ? "text-red-500 dark:text-red-400" : "text-text-secondary"
            }`}
          >
            {label}
            {props.required ? (
              <span className="ml-1 text-red-500 dark:text-red-400" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={describedBy || undefined}
          className={[
            "w-full rounded-xl border px-4 py-3 text-sm text-text-primary transition-all duration-200",
            "placeholder:text-text-muted focus:border-axion-500 focus:outline-none focus:ring-2 focus:ring-axion-500/50",
            hasError
              ? "border-red-500/70 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20"
              : "border-border-primary bg-background-secondary/30",
            className
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />

        <div className="min-h-[1.25rem]">
          {showError ? (
            <p id={errorId} className="text-xs font-medium text-red-500 dark:text-red-400">
              {error?.message}
            </p>
          ) : helperText ? (
            <p id={helperId} className="text-xs text-text-muted">
              {helperText}
            </p>
          ) : null}
        </div>
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
