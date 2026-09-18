import { useState } from 'react';
import { useI18n } from '../context/I18nContext';

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
  list?: string;
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
  list,
}: FormFieldProps) {
  const { t } = useI18n();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value;
    onChange(name, val);
  };

  const fieldClass = error ? 'input input-error' : 'input';

  if (type === 'textarea') {
    return (
      <div>
        <label className="field-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
        <textarea
          name={name}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`input textarea`}
          rows={3}
        />
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <div>
        <label className="field-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
        <select
          name={name}
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          className="input"
        >
          <option value="">{t('common.select') || '-- Select --'}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="field-error">{error}</p>}
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
          className="w-4 h-4 rounded border-border dark:border-border-dark text-primary focus:ring-primary"
        />
        <span className="text-sm">{label}</span>
        {error && <p className="field-error ml-4">{error}</p>}
      </label>
    );
  }

  return (
    <div>
      <label className="field-label">
        {label} {required && <span className="text-danger">*</span>}
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
        list={list}
        className={fieldClass}
      />
      {error && <p className="field-error">{error}</p>}
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
