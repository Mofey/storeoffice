import React, { useEffect, useState } from 'react';
import { Mail, RefreshCcw, Send } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface SubscriberRecord {
  email: string;
  subscribedAt: string;
}

const NewsletterManager: React.FC = () => {
  const { token } = useAuth();
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [visibleSubscriberCount, setVisibleSubscriberCount] = useState(3);

  const loadSubscribers = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = await apiRequest<SubscriberRecord[]>('/admin/newsletter-subscribers', { token });
      setSubscribers(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load subscribers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSubscribers();
  }, [token]);

  useEffect(() => {
    setVisibleSubscriberCount(3);
  }, [subscribers]);

  const handleSendNewsletter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    try {
      const response = await apiRequest<{ message: string }>('/admin/newsletter/send', {
        method: 'POST',
        token,
        body: JSON.stringify({ subject, message }),
      });
      setStatusMessage(response.message);
      setSubject('');
      setMessage('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send newsletter.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-950 dark:text-slate-50">Newsletter subscribers</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Review your subscriber list and send full newsletter campaigns from the admin workspace.</p>
        </div>
        <button type="button" onClick={() => void loadSubscribers()} className="secondary-button">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && <div className="glass-panel rounded-[28px] p-4 text-sm text-red-500">{error}</div>}
      {statusMessage && <div className="glass-panel rounded-[28px] p-4 text-sm text-emerald-600 dark:text-emerald-300">{statusMessage}</div>}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-4">
          {loading ? (
            <div className="glass-panel rounded-[28px] p-10 text-center text-sm text-slate-600 dark:text-slate-400">Loading subscribers...</div>
          ) : subscribers.length === 0 ? (
            <div className="glass-panel rounded-[28px] p-10 text-center">
              <Mail className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">No newsletter subscribers yet.</p>
            </div>
          ) : (
            subscribers.slice(0, visibleSubscriberCount).map((subscriber) => (
              <article key={`${subscriber.email}-${subscriber.subscribedAt}`} className="glass-panel rounded-[28px] p-5">
                <p className="text-lg font-bold text-slate-950 dark:text-slate-50">{subscriber.email}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Subscribed {new Date(subscriber.subscribedAt).toLocaleString()}</p>
              </article>
            ))
          )}
          {visibleSubscriberCount < subscribers.length && (
            <button
              type="button"
              onClick={() => setVisibleSubscriberCount((count) => count + 3)}
              className="secondary-button mx-auto block md:mx-0"
            >
              Load more
            </button>
          )}
        </section>

        <section className="glass-panel rounded-[28px] p-6">
          <h4 className="text-xl font-bold text-slate-950 dark:text-slate-50">Send newsletter</h4>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">This campaign is sent to every stored newsletter subscriber through the backend email service.</p>
          <form onSubmit={handleSendNewsletter} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Subject</label>
              <input value={subject} onChange={(event) => setSubject(event.target.value)} required className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Message</label>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} required rows={10} className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" />
            </div>
            <button type="submit" className="primary-button w-full">
              <Send className="mr-2 h-4 w-4" />
              Send newsletter
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default NewsletterManager;
