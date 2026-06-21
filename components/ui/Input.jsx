"use client";

import { forwardRef } from "react";

const Input = forwardRef(({
  label,
  error,
  icon,
  dir = "ltr",
  className = "",
  ...props
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          dir={dir}
          className={`
            w-full px-4 py-3 rounded-xl border-2 transition-all outline-none
            ${error 
              ? "border-red-500 focus:border-red-500 bg-red-50" 
              : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-50"
            }
            ${icon ? "pr-10" : ""}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;