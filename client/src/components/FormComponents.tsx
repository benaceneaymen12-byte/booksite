import { useState } from 'react';

interface FormData {
  [key: string]: any;
}

interface FormErrors {
  [key: string]: string;
}

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'date' | 'time' | 'select' | 'textarea' | 'checkbox';
  value: any;
  onChange: (name: string, value: any) => void;
  options?: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  options,
  placeholder,
  error,
  required,
  disabled,
  min,
  max,
  step,
}: FormFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value;
    onChange(name, val);
  };

  const inputClass = error
    ? 'input-error'
    : '';

  if (type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          name={name}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${inputClass}`}
          rows={3}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          name={name}
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${inputClass}`}
        >
          <option value="">-- Select --</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }

  if (type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name={name}
          checked={!!value}
          onChange={(e) => onChange(name, e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        {error && <p className="text-red-500 text-xs ml-4">{error}</p>}
      </label>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value ?? ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${inputClass}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function useForm(initialValues: FormData, validate?: (values: FormData) => FormErrors) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      if (validate) {
        const newErrors = validate({ ...values, [name]: value });
        setErrors(newErrors);
      }
    }
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (validate) {
      const newErrors = validate(values);
      setErrors(newErrors);
    }
  };

  const reset = (newValues?: FormData) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched({});
  };

  const isValid = !Object.keys(errors).length;
  const isDirty = Object.keys(values).some((k) => values[k] !== initialValues[k]);

  return { values, errors, touched, handleChange, handleBlur, reset, isValid, isDirty, setErrors };
}
