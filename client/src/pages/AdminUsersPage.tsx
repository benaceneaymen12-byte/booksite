import { useEffect, useState } from 'react';
import { api } from '../services/api';

type ManagedUser = { id: number; username: string; name: string; role: string; email: string; phone: string; jobTitle: string; avatar: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { api.getUsers().then(setUsers).catch((err) => setError(err.message)); }, []);

  const save = async () => {
    if (!editing) return;
    try {
      const updated = await api.updateUser(editing.id, { ...editing, password: password || undefined });
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditing(null);
      setPassword('');
    } catch (err: any) { setError(err.message || 'Unable to update user'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User administration</h1>
      {error && <p className="text-red-600">{error}</p>}
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="p-3">User</th><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Email</th><th className="p-3">Action</th></tr></thead><tbody>{users.map((item) => <tr key={item.id} className="border-b"><td className="p-3">{item.username}</td><td className="p-3">{item.name}</td><td className="p-3">{item.role}</td><td className="p-3">{item.email || '-'}</td><td className="p-3"><button className="btn btn-secondary btn-sm" onClick={() => setEditing({ ...item })}>Edit</button></td></tr>)}</tbody></table></div>
      {editing && <div className="card max-w-xl space-y-4"><h2 className="text-lg font-semibold">Edit {editing.username}</h2><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Name" className="w-full px-3 py-2 border rounded-md" /><input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="Email" className="w-full px-3 py-2 border rounded-md" /><input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="Phone" className="w-full px-3 py-2 border rounded-md" /><input value={editing.jobTitle} onChange={(e) => setEditing({ ...editing, jobTitle: e.target.value })} placeholder="Job title" className="w-full px-3 py-2 border rounded-md" /><select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} className="w-full px-3 py-2 border rounded-md"><option value="analyst">Analyst</option><option value="admin">Admin</option></select><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (optional)" className="w-full px-3 py-2 border rounded-md" /><div className="flex gap-2"><button onClick={save} className="btn-primary">Save user</button><button onClick={() => setEditing(null)} className="btn btn-secondary">Cancel</button></div></div>}
    </div>
  );
}
