import React, { useEffect, useState } from 'react';
import { MessageSquare, RefreshCcw, Star, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewRecord {
  id: string;
  productId: number;
  productName: string;
  rating: number;
  comment: string;
  createdAt: string;
  userId: string;
  userName: string;
  userEmail: string;
}

const ReviewsManager: React.FC = () => {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadReviews = async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = await apiRequest<ReviewRecord[]>('/admin/reviews', { token });
      setReviews(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, [token]);

  const handleDeleteReview = async (reviewId: string) => {
    if (!token) {
      return;
    }

    try {
      const response = await apiRequest<{ message: string }>(`/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        token,
      });
      setStatusMessage(response.message);
      await loadReviews();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete review.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-950 dark:text-slate-50">Reviews</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Moderate user reviews and remove content that should no longer appear in the catalog.</p>
        </div>
        <button type="button" onClick={() => void loadReviews()} className="secondary-button">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && <div className="glass-panel rounded-[28px] p-4 text-sm text-red-500">{error}</div>}
      {statusMessage && <div className="glass-panel rounded-[28px] p-4 text-sm text-emerald-600 dark:text-emerald-300">{statusMessage}</div>}

      {loading ? (
        <div className="glass-panel rounded-[28px] p-10 text-center text-sm text-slate-600 dark:text-slate-400">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="glass-panel rounded-[28px] p-10 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">No user reviews have been submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="glass-panel rounded-[28px] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{review.productName}</p>
                  <h4 className="mt-2 text-xl font-bold text-slate-950 dark:text-slate-50">{review.userName}</h4>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{review.userEmail}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{new Date(review.createdAt).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 dark:bg-slate-900">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-current text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                    ))}
                  </div>
                  <button type="button" onClick={() => void handleDeleteReview(review.id)} className="secondary-button text-rose-600 hover:text-rose-700 dark:text-rose-300">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-5 rounded-[24px] bg-white p-4 text-sm leading-7 text-slate-600 dark:bg-slate-900 dark:text-slate-400">{review.comment}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsManager;
