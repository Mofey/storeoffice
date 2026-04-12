import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Mail, Plus, RefreshCcw, Save, Shield, Trash2, UserCog } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from './ConfirmDialog';

interface AdminRecord {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isUltimateAdmin: boolean;
  emailVerified: boolean;
  isSuspended: boolean;
  createdAt?: string | null;
}

interface RecipientRecord {
  id: string;
  email: string;
  createdAt: string;
}

const ADMIN_PAGE_SIZE = 3;
const RECIPIENT_PAGE_SIZE = 3;

const AdminSettingsManager: React.FC = () => {
  const { token, user, setSessionUser } = useAuth();
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [recipients, setRecipients] = useState<RecipientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminPasswordConfirm, setNewAdminPasswordConfirm] = useState('');
  const [recipientDraft, setRecipientDraft] = useState('');
  const [editingRecipientId, setEditingRecipientId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [savingRecipient, setSavingRecipient] = useState(false);
  const [pendingDeleteAdmin, setPendingDeleteAdmin] = useState<AdminRecord | null>(null);
  const [pendingDeleteRecipient, setPendingDeleteRecipient] = useState<RecipientRecord | null>(null);
  const [visibleAdminCount, setVisibleAdminCount] = useState(ADMIN_PAGE_SIZE);
  const [visibleRecipientCount, setVisibleRecipientCount] = useState(RECIPIENT_PAGE_SIZE);

  const sortedAdmins = useMemo(
    () =>
      [...admins].sort((left, right) => {
        if (left.isUltimateAdmin !== right.isUltimateAdmin) {
          return left.isUltimateAdmin ? -1 : 1;
        }
        return left.name.localeCompare(right.name);
      }),
    [admins]
  );
  const visibleAdmins = sortedAdmins.slice(0, visibleAdminCount);
  const visibleRecipients = recipients.slice(0, visibleRecipientCount);
  const canLoadMoreAdmins = visibleAdminCount < sortedAdmins.length;
  const canLoadMoreRecipients = visibleRecipientCount < recipients.length;

  const loadSettingsData = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [userPayload, recipientPayload] = await Promise.all([
        apiRequest<AdminRecord[]>('/admin/users', { token }),
        apiRequest<RecipientRecord[]>('/admin/transaction-recipients', { token }),
      ]);
      const adminList = userPayload.filter((record) => record.isAdmin);
      setAdmins(adminList);
      setVisibleAdminCount(3);
      setRecipients(recipientPayload);
      setVisibleRecipientCount(3);
      setProfileName(user?.name ?? '');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load admin settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettingsData();
  }, [token]);

  useEffect(() => {
    setProfileName(user?.name ?? '');
  }, [user?.name]);

  const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !user) {
      return;
    }

    setSavingProfile(true);
    setError('');
    setStatusMessage('');
    try {
      const updated = await apiRequest<AdminRecord>('/admin/admins/me', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          name: profileName,
          currentPassword,
          newPassword: newPassword || undefined,
        }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setSessionUser({
        id: user.id,
        email: user.email,
        name: updated.name,
        isAdmin: true,
      });
      setStatusMessage('Admin profile updated successfully.');
      await loadSettingsData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update your admin profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    setCreatingAdmin(true);
    setError('');
    setStatusMessage('');
    if (newAdminPassword !== newAdminPasswordConfirm) {
      setError('Passwords do not match.');
      setCreatingAdmin(false);
      return;
    }
    try {
      const created = await apiRequest<AdminRecord>('/admin/admins', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: newAdminName,
          email: newAdminEmail,
          password: newAdminPassword,
        }),
      });
      setAdmins((current) => [...current, created]);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminPasswordConfirm('');
      setStatusMessage('New admin created successfully.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create admin.');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleLoadMoreAdmins = () => {
    setVisibleAdminCount((current) => Math.min(current + ADMIN_PAGE_SIZE, sortedAdmins.length));
  };

  const handleLoadMoreRecipients = () => {
    setVisibleRecipientCount((current) => Math.min(current + RECIPIENT_PAGE_SIZE, recipients.length));
  };

  const confirmDeleteAdmin = async () => {
    if (!token || !pendingDeleteAdmin) {
      return;
    }

    try {
      const response = await apiRequest<{ message: string }>(`/admin/admins/${pendingDeleteAdmin.id}`, {
        method: 'DELETE',
        token,
      });
      setAdmins((current) => current.filter((item) => item.id !== pendingDeleteAdmin.id));
      setPendingDeleteAdmin(null);
      setStatusMessage(response.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete admin.');
    }
  };

  const handleSaveRecipient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    setSavingRecipient(true);
    setError('');
    setStatusMessage('');
    try {
      if (editingRecipientId) {
        const updated = await apiRequest<RecipientRecord>(`/admin/transaction-recipients/${editingRecipientId}`, {
          method: 'PUT',
          token,
          body: JSON.stringify({ email: recipientDraft }),
        });
        setRecipients((current) => current.map((item) => (item.id === editingRecipientId ? updated : item)));
        setStatusMessage('Transaction notification email updated.');
      } else {
        const created = await apiRequest<RecipientRecord>('/admin/transaction-recipients', {
          method: 'POST',
          token,
          body: JSON.stringify({ email: recipientDraft }),
        });
        setRecipients((current) => [created, ...current]);
        setStatusMessage('Transaction notification email added.');
      }
      setRecipientDraft('');
      setEditingRecipientId(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save recipient email.');
    } finally {
      setSavingRecipient(false);
    }
  };

  const confirmDeleteRecipient = async () => {
    if (!token || !pendingDeleteRecipient) {
      return;
    }

    try {
      const response = await apiRequest<{ message: string }>(`/admin/transaction-recipients/${pendingDeleteRecipient.id}`, {
        method: 'DELETE',
        token,
      });
      setRecipients((current) => current.filter((item) => item.id !== pendingDeleteRecipient.id));
      setPendingDeleteRecipient(null);
      setStatusMessage(response.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete recipient.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-950 dark:text-slate-50">Admin settings</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Manage your admin profile, your admin team, and the emails that receive transaction alerts.</p>
        </div>
        <button type="button" onClick={() => void loadSettingsData()} className="secondary-button self-start sm:self-auto">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && <div className="glass-panel rounded-[28px] p-4 text-sm text-red-500">{error}</div>}
      {statusMessage && <div className="glass-panel rounded-[28px] p-4 text-sm text-emerald-600 dark:text-emerald-300">{statusMessage}</div>}

      {loading ? (
        <div className="glass-panel rounded-[28px] p-10 text-center text-sm text-slate-600 dark:text-slate-400">Loading admin settings...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="glass-panel rounded-[28px] p-4 sm:p-6 self-start">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950">
                  <UserCog className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-950 dark:text-slate-50">Your admin profile</h4>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update your displayed name and password from the settings tab.</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Display name</label>
                  <input value={profileName} onChange={(event) => setProfileName(event.target.value)} required className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Current password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      required
                      className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                      onClick={() => setShowCurrentPassword((value) => !value)}
                      aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">New password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      minLength={8}
                      placeholder="Leave blank to keep your current password"
                      className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                      onClick={() => setShowNewPassword((value) => !value)}
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={savingProfile} className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60">
                  <Save className="mr-2 h-4 w-4" />
                  {savingProfile ? 'Saving profile...' : 'Save profile changes'}
                </button>
              </form>
            </section>

            <section className="glass-panel rounded-[28px] p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-950 dark:text-slate-50">Transaction notification emails</h4>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">These emails receive purchase notifications whenever a customer pays successfully.</p>
                </div>
              </div>

              <form onSubmit={handleSaveRecipient} className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Notification email</label>
                  <input type="email" value={recipientDraft} onChange={(event) => setRecipientDraft(event.target.value)} required className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" />
                </div>
                <button type="submit" disabled={savingRecipient} className="primary-button disabled:cursor-not-allowed disabled:opacity-60 sm:mt-7">
                  {savingRecipient ? 'Saving...' : editingRecipientId ? 'Update email' : 'Add email'}
                </button>
              </form>

              <div className="mt-6 grid gap-3">
                {visibleRecipients.map((recipient) => (
                  <div key={recipient.id} className="rounded-[24px] bg-white p-4 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-slate-50">{recipient.email}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Added {new Date(recipient.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRecipientId(recipient.id);
                            setRecipientDraft(recipient.email);
                          }}
                          className="secondary-button"
                        >
                          Edit
                        </button>
                        <button type="button" onClick={() => setPendingDeleteRecipient(recipient)} className="secondary-button text-rose-600 hover:text-rose-700 dark:text-rose-300">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {canLoadMoreRecipients && (
                <div className="mt-3 flex justify-center">
                  <button type="button" onClick={handleLoadMoreRecipients} className="text-sm font-semibold text-slate-900 underline-offset-4 transition hover:underline dark:text-slate-100">
                    Load more emails
                  </button>
                </div>
              )}
            </section>
          </div>

          <section className="glass-panel rounded-[28px] p-4 sm:p-6 self-start lg:row-span-2">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-950 dark:text-slate-50">Admin team</h4>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add and remove admin logins while keeping the ultimate admin protected.</p>
              </div>
            </div>

            <form onSubmit={handleCreateAdmin} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Name</label>
                <input value={newAdminName} onChange={(event) => setNewAdminName(event.target.value)} required className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                <input type="email" value={newAdminEmail} onChange={(event) => setNewAdminEmail(event.target.value)} required className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <input type="password" value={newAdminPassword} onChange={(event) => setNewAdminPassword(event.target.value)} required minLength={8} className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm password</label>
                <input type="password" value={newAdminPasswordConfirm} onChange={(event) => setNewAdminPasswordConfirm(event.target.value)} required minLength={8} className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" />
              </div>
              <button type="submit" disabled={creatingAdmin || !newAdminPassword || newAdminPassword !== newAdminPasswordConfirm} className="secondary-button w-full disabled:cursor-not-allowed disabled:opacity-60">
                <Plus className="mr-2 h-4 w-4" />
                {creatingAdmin ? 'Creating admin...' : 'Add admin'}
              </button>
            </form>

              <div className="mt-6 space-y-3">
              {visibleAdmins.map((admin) => (
                <div key={admin.id} className="rounded-[24px] bg-white p-4 dark:bg-slate-900">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950 dark:text-slate-50">{admin.name}</p>
                        {admin.isUltimateAdmin && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/35 dark:text-amber-300">Ultimate admin</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 break-all">{admin.email}</p>
                    </div>
                    {!admin.isUltimateAdmin && (
                      <button type="button" onClick={() => setPendingDeleteAdmin(admin)} className="secondary-button self-start text-rose-600 hover:text-rose-700 dark:text-rose-300 sm:self-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
              </div>
              {canLoadMoreAdmins && (
                <div className="mt-2 flex justify-center">
                  <button type="button" onClick={handleLoadMoreAdmins} className="text-sm font-semibold text-slate-900 underline-offset-4 transition hover:underline dark:text-slate-100">
                    Load more admins
                  </button>
                </div>
              )}
            </section>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteAdmin)}
        title="Delete admin?"
        description={`"${pendingDeleteAdmin?.name ?? 'This admin'}" will lose access to the admin dashboard.`}
        confirmLabel="Delete admin"
        onClose={() => setPendingDeleteAdmin(null)}
        onConfirm={confirmDeleteAdmin}
      />
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteRecipient)}
        title="Delete transaction email?"
        description={`"${pendingDeleteRecipient?.email ?? 'This email'}" will stop receiving paid-order notifications.`}
        confirmLabel="Delete email"
        onClose={() => setPendingDeleteRecipient(null)}
        onConfirm={confirmDeleteRecipient}
      />
    </div>
  );
};

export default AdminSettingsManager;
