import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...rest }, ref) => (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      )}
      <input
        ref={ref}
        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
          error ? "border-red-400" : "border-slate-300"
        } ${className}`}
        {...rest}
      />
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
    </label>
  ),
);
Input.displayName = "Input";
