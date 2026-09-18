import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';

export default function ProfilePage() {
  const { t } = useI18n();
  const { user, updateUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    jobTitle: user?.jobTitle || '',
    avatar: user?.avatar || '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const handleAvatar = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 500 * 1024) {
      setError('Please choose an image smaller than 500 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update('avatar', String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setError('');
    try {
      const result = await api.updateProfile(form);
      updateUser(result.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) { setError(err.message || 'Unable to save profile'); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My profile</h1>
      <div className="card flex flex-col sm:flex-row gap-6 items-start">
        <div className="text-center">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-gray-500">
            {form.avatar ? <img src={form.avatar} alt="Profile" className="w-full h-full object-cover" /> : (form.name || user?.username || '?').slice(0, 1).toUpperCase()}
          </div>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-secondary btn-sm mt-3">Change photo</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleAvatar(e.target.files?.[0])} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
          <label className="text-sm">Username<input value={user?.username || ''} disabled className="w-full mt-1 px-3 py-2 border rounded-md bg-gray-100" /></label>
          <label className="text-sm">Full name<input value={form.name} onChange={(e) => update('name', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" /></label>
          <label className="text-sm">Email<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" /></label>
          <label className="text-sm">Phone<input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" /></label>
          <label className="text-sm sm:col-span-2">Job title<input value={form.jobTitle} onChange={(e) => update('jobTitle', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" /></label>
          <div className="sm:col-span-2 flex items-center gap-3"><button onClick={save} className="btn-primary">Save profile</button>{saved && <span className="text-green-600">Saved</span>}{error && <span className="text-red-600 text-sm">{error}</span>}</div>
        </div>
      </div>
    </div>
  );
}
