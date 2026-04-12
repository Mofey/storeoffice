import React, { useEffect, useState } from 'react';
import { Mail, Plus, RefreshCcw, ShieldAlert, ShieldCheck, Trash2, Users } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from './ConfirmDialog';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  emailVerified: boolean;
  isSuspended: boolean;
  createdAt?: string | null;
}

const UsersManager: React.FC = () => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [visibleUserCount, setVisibleUserCount] = useState(3);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserRecord | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const loadUsers = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = await apiRequest<UserRecord[]>('/admin/users', { token });
      setUsers(payload.filter((record) => !record.isAdmin));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [token]);

  useEffect(() => {
    setVisibleUserCount(3);
  }, [users]);

  const toggleSelection = (userId: string) => {
    setSelectedUserIds((current) => (current.includes(userId) ? current.filter((item) => item !== userId) : [...current, userId]));
  };

  const handleSuspendToggle = async (record: UserRecord) => {
    if (!token) {
      return;
    }

    try {
      const response = await apiRequest<{ message: string }>(`/admin/users/${record.id}/suspend?suspended=${String(!record.isSuspended)}`, {
        method: 'PUT',
        token,
      });
      setStatusMessage(response.message);
      await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update user.');
    }
  };

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find((record) => record.id === userId);
    if (!targetUser) {
      return;
    }

    setPendingDeleteUser(targetUser);
  };

  const confirmDeleteUser = async () => {
    if (!token || !pendingDeleteUser) {
      return;
    }

    setIsDeletingUser(true);
    try {
      const response = await apiRequest<{ message: string }>(`/admin/users/${pendingDeleteUser.id}`, {
        method: 'DELETE',
        token,
      });
      setPendingDeleteUser(null);
      setStatusMessage(response.message);
      setSelectedUserIds((current) => current.filter((item) => item !== pendingDeleteUser.id));
      await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete user.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleSendEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || selectedUserIds.length === 0) {
      setError('Select at least one user before sending an email.');
      return;
    }

    try {
      const response = await apiRequest<{ message: string }>('/admin/users/email', {
        method: 'POST',
        token,
        body: JSON.stringify({ userIds: selectedUserIds, subject, message }),
      });
      setStatusMessage(response.message);
      setSubject('');
      setMessage('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send email.');
    }
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    setIsCreatingUser(true);
    setError('');
    setStatusMessage('');
    try {
      const created = await apiRequest<UserRecord>('/admin/users', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
        }),
      });
      setUsers((current) => [created, ...current]);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setStatusMessage('Customer account created successfully without email verification.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create user.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-950 dark:text-slate-50">Users</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Inspect user records, suspend access when needed, and send direct emails to selected customers.</p>
        </div>
        <button type="button" onClick={() => void loadUsers()} className="secondary-button">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && <div className="glass-panel rounded-[28px] p-4 text-sm text-red-500">{error}</div>}
      {statusMessage && <div className="glass-panel rounded-[28px] p-4 text-sm text-emerald-600 dark:text-emerald-300">{statusMessage}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          {loading ? (
            <div className="glass-panel rounded-[28px] p-10 text-center text-sm text-slate-600 dark:text-slate-400">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="glass-panel rounded-[28px] p-10 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">No users found yet.</p>
            </div>
          ) : (
            users.slice(0, visibleUserCount).map((record) => (
              <article key={record.id} className="glass-panel rounded-[28px] p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    {!record.isAdmin && (
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(record.id)}
                        onChange={() => toggleSelection(record.id)}
                        className="mt-1 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                      />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xl font-bold text-slate-950 dark:text-slate-50">{record.name}</h4>
                        {record.isAdmin && <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">Admin</span>}
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${record.isSuspended ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300'}`}>
                          {record.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{record.email}</p>
                      {record.createdAt && (
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Joined {new Date(record.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {!record.isAdmin && (
                      <button type="button" onClick={() => void handleSuspendToggle(record)} className="secondary-button">
                        {record.isSuspended ? <ShieldCheck className="mr-2 h-4 w-4" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                        {record.isSuspended ? 'Restore' : 'Suspend'}
                      </button>
                    )}
                    {!record.isAdmin && currentUser?.id !== record.id && (
                      <button type="button" onClick={() => void handleDeleteUser(record.id)} className="secondary-button text-rose-600 hover:text-rose-700 dark:text-rose-300">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
          {visibleUserCount < users.length && (
            <button
              type="button"
              onClick={() => setVisibleUserCount((count) => count + 3)}
              className="secondary-button mx-auto block md:mx-0"
            >
              Load more
            </button>
          )}
        </section>

        <section className="space-y-6">
          <div className="glass-panel rounded-[28px] p-6">
            <h4 className="text-xl font-bold text-slate-950 dark:text-slate-50">Create storefront user</h4>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">Create a customer account directly from admin. The account is immediately verified and can sign in on the storefront.</p>

            <form onSubmit={handleCreateUser} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Name</label>
                <input value={newUserName} onChange={(event) => setNewUserName(event.target.value)} required className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                <input type="email" value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} required className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Temporary password</label>
                <input type="text" value={newUserPassword} onChange={(event) => setNewUserPassword(event.target.value)} required minLength={8} className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" />
              </div>
              <button type="submit" disabled={isCreatingUser} className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60">
                <Plus className="mr-2 h-4 w-4" />
                {isCreatingUser ? 'Creating user...' : 'Create user'}
              </button>
            </form>
          </div>

          <div className="glass-panel rounded-[28px] p-6">
          <h4 className="text-xl font-bold text-slate-950 dark:text-slate-50">Email selected users</h4>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{selectedUserIds.length} user(s) selected. Admin records are excluded from bulk email selection.</p>

          <form onSubmit={handleSendEmail} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Subject</label>
              <input value={subject} onChange={(event) => setSubject(event.target.value)} required className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Message</label>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} required rows={8} className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" />
            </div>
            <button type="submit" className="primary-button w-full">
              <Mail className="mr-2 h-4 w-4" />
              Send email
            </button>
          </form>
          </div>
        </section>
      </div>
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteUser)}
        title="Delete user?"
        description={`"${pendingDeleteUser?.name ?? 'This user'}" and their related data will be removed from the admin records.`}
        confirmLabel="Delete user"
        isProcessing={isDeletingUser}
        onClose={() => {
          if (!isDeletingUser) {
            setPendingDeleteUser(null);
          }
        }}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
};

export default UsersManager;
