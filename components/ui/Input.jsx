"use client";

import { forwardRef } from "react";

const Input = forwardRef(({
  label,
  error,
  icon,
  startIcon,
  dir = "ltr",
  className = "",
  ...props
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 text-right">
          {label}
        </label>
      )}
      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 text-gray-400 pointer-events-none z-10">
            {startIcon}
          </div>
        )}
        {icon && (
          <div className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          dir={dir}
          className={`
            w-full px-4 py-3 rounded-xl border-2 transition-all outline-none
            ${error
              ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/40 bg-red-50/50"
              : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-50"
            }
            ${startIcon ? "ps-11" : ""}
            ${icon ? "pe-10" : ""}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1.5 text-right" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;