import React from 'react';

export const FormField = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  helperText,
  required = false,
  options = [],
  placeholder = '',
  rows = 3,
  disabled = false,
  className = '',
}) => {
  const baseInputStyles = `w-full px-3 py-2 text-sm bg-surface rounded-md border transition ${
    error ? 'border-status-danger focus:ring-status-danger' : 'border-border focus:border-academic focus:ring-academic'
  } text-brandText-main placeholder:text-brandText-muted disabled:bg-surface-subtle disabled:cursor-not-allowed ${className}`;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-navy uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-status-danger">*</span>}
        </label>
      )}

      {type === 'select' ? (
        <select id={id} value={value} onChange={onChange} disabled={disabled} className={baseInputStyles}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          className={baseInputStyles}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={baseInputStyles}
        />
      )}

      {error ? (
        <p className="mt-1 text-xs text-status-danger">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-brandText-muted">{helperText}</p>
      ) : null}
    </div>
  );
};
