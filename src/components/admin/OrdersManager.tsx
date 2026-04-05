import React, { useEffect, useState } from 'react';
import { CheckCircle2, PackageCheck, RefreshCcw } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface OrderLineItem {
  productId: number;
  quantity: number;
  lineTotal: number;
}

interface OrderRecord {
  id?: string;
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  items: OrderLineItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  createdAt: string;
  status: string;
}

const OrdersManager: React.FC = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = await apiRequest<OrderRecord[]>('/admin/orders', { token });
      setOrders(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [token]);

  const handleCompleteOrder = async (orderId?: string) => {
    if (!token || !orderId) {
      return;
    }

    try {
      await apiRequest<{ message: string }>(`/admin/orders/${orderId}/complete`, {
        method: 'PUT',
        token,
      });
      await loadOrders();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update order status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-950 dark:text-slate-50">Orders</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Track checkout activity and mark completed shipments from one place.</p>
        </div>
        <button type="button" onClick={() => void loadOrders()} className="secondary-button">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="glass-panel rounded-[28px] p-10 text-center text-sm text-slate-600 dark:text-slate-400">Loading orders...</div>
      ) : error ? (
        <div className="glass-panel rounded-[28px] p-6 text-sm text-red-500">{error}</div>
      ) : orders.length === 0 ? (
        <div className="glass-panel rounded-[28px] p-10 text-center">
          <PackageCheck className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">No orders have been placed yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id ?? `${order.userId}-${order.createdAt}`} className="glass-panel rounded-[28px] p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Order</p>
                  <h4 className="mt-2 text-xl font-bold text-slate-950 dark:text-slate-50">{order.userName || 'Customer order'}</h4>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{order.userEmail || order.userId}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300'}`}>
                    {order.status}
                  </span>
                  {order.status !== 'completed' && (
                    <button type="button" onClick={() => void handleCompleteOrder(order.id)} className="primary-button">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark completed
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Items</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Subtotal</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">${order.subtotal.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Shipping</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">${order.shipping.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Total</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">${order.total.toFixed(2)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersManager;
