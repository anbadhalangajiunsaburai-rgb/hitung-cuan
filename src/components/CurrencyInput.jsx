import React, { useState, useEffect } from 'react';

export default function CurrencyInput({ value, onChange, placeholder, className, disabled }) {
  const [displayValue, setDisplayValue] = useState('');

  // Update display when prop changes (from parent)
  useEffect(() => {
    if (value === 0 || value === '' || value === undefined || isNaN(value)) {
      setDisplayValue('');
    } else {
      setDisplayValue(value.toLocaleString('id-ID'));
    }
  }, [value]);

  const handleChange = (e) => {
    // Remove all non-digit characters
    const rawValue = e.target.value.replace(/\D/g, '');
    
    if (rawValue === '') {
      setDisplayValue('');
      onChange('');
    } else {
      const numberValue = parseInt(rawValue, 10);
      setDisplayValue(numberValue.toLocaleString('id-ID'));
      onChange(numberValue);
    }
  };

  return (
    <input
      type="text"
      placeholder={placeholder}
      className={className}
      value={displayValue}
      onChange={handleChange}
      disabled={disabled}
    />
  );
}
