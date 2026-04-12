import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, PackageCheck, RefreshCcw, Search } from 'lucide-react';
import { apiRequest, apiRequestWithRetry } from '../../lib/api';
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
  itemNames: string[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: 'NGN' | 'USD';
  createdAt: string;
  completedAt?: string | null;
  status: string;
  paymentReference?: string | null;
}

interface OrderPageResponse {
  orders: OrderRecord[];
  nextCursor: string | null;
}

const formatOrderAmount = (amount: number, currency: 'NGN' | 'USD') =>
  new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'NGN' ? 0 : 2,
  }).format(amount);

const getAmountTextClassName = (amount: number, currency: 'NGN' | 'USD') => {
  const formattedAmount = formatOrderAmount(amount, currency);
  if (formattedAmount.length >= 15) {
    return 'text-[0.7rem] sm:text-xs xl:text-sm';
  }
  if (formattedAmount.length >= 13) {
    return 'text-[0.75rem] sm:text-sm xl:text-base';
  }
  if (formattedAmount.length >= 11) {
    return 'text-xs sm:text-sm xl:text-lg';
  }
  return 'text-sm sm:text-base xl:text-xl';
};

const normalizeOrderStatus = (status: string) => status.trim().toLowerCase();

const getOrderPriority = (status: string) => (normalizeOrderStatus(status) === 'completed' ? 1 : 0);

const dedupeOrders = (orders: OrderRecord[]) => {
  const orderMap = new Map<string, OrderRecord>();

  orders.forEach((order) => {
    const key = order.id ?? `${order.userId}-${order.createdAt}`;
    orderMap.set(key, order);
  });

  return Array.from(orderMap.values());
};

const sortOrdersForAdmin = (orders: OrderRecord[]) =>
  dedupeOrders(orders).sort((left, right) => {
    const priorityDifference = getOrderPriority(left.status) - getOrderPriority(right.status);
    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

const OrdersManager: React.FC = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleOrderCount, setVisibleOrderCount] = useState(3);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadOrders = useCallback(async (cursor?: string, replace = false, activeSearch = searchQuery) => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (cursor) {
        params.set('cursor', cursor);
      }
      if (activeSearch.trim()) {
        params.set('search', activeSearch.trim());
      }

      const payload = await apiRequestWithRetry<OrderPageResponse>(`/admin/orders?${params.toString()}`, {
        token,
      });
      setNextCursor(payload.nextCursor);
      setHasMoreOrders(Boolean(payload.nextCursor));
      setOrders((current) => {
        const combined = replace ? payload.orders : [...current, ...payload.orders];
        return sortOrdersForAdmin(combined);
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  useEffect(() => {
    void loadOrders(undefined, true, searchQuery);
  }, [loadOrders, searchQuery]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const refreshOrders = () => {
      void loadOrders(undefined, true, searchQuery);
    };

    const intervalId = window.setInterval(refreshOrders, 15000);
    window.addEventListener('focus', refreshOrders);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshOrders);
    };
  }, [loadOrders, searchQuery, token]);

  useEffect(() => {
    setVisibleOrderCount(3);
  }, [orders]);

  const handleCompleteOrder = async (orderId?: string) => {
    if (!token || !orderId) {
      return;
    }

    try {
      setOrders((current) =>
        sortOrdersForAdmin(
          current.map((order) =>
            order.id === orderId
              ? { ...order, status: 'completed', completedAt: new Date().toISOString() }
              : order
          )
        )
      );
      await apiRequest<{ message: string }>(`/admin/orders/${orderId}/complete`, {
        method: 'PUT',
        token,
      });
      await loadOrders(undefined, true, searchQuery);
    } catch (requestError) {
      await loadOrders(undefined, true, searchQuery);
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
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by reference, customer, or product"
              className="w-full rounded-full border border-white/60 bg-white/85 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-400 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-100"
            />
          </div>
          <button type="button" onClick={() => void loadOrders(undefined, true, searchQuery)} className="secondary-button">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel rounded-[28px] p-10 text-center text-sm text-slate-600 dark:text-slate-400">Loading orders...</div>
      ) : error ? (
        <div className="glass-panel rounded-[28px] p-6 text-sm text-red-500">{error}</div>
      ) : orders.length === 0 ? (
        <div className="glass-panel rounded-[28px] p-10 text-center">
          <PackageCheck className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            {searchQuery ? 'No orders match that search yet.' : 'No orders have been placed yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.slice(0, visibleOrderCount).map((order) => (
            <article key={order.id ?? `${order.userId}-${order.createdAt}`} className="glass-panel rounded-[28px] p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Order</p>
                  <h4 className="mt-2 text-xl font-bold text-slate-950 dark:text-slate-50">{order.userName || 'Customer order'}</h4>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{order.userEmail || order.userId}</p>
                  {order.paymentReference && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ref: {order.paymentReference}</p>
                  )}
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
                  {normalizeOrderStatus(order.status) === 'completed' && order.completedAt && (
                    <p className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-300">
                      Completed {new Date(order.completedAt).toLocaleString()}
                    </p>
                  )}
                  {order.itemNames.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.itemNames.map((itemName) => (
                        <span key={itemName} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          {itemName}
                        </span>
          ))}
        </div>
      )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${normalizeOrderStatus(order.status) === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300'}`}>
                    {order.status}
                  </span>
                  {normalizeOrderStatus(order.status) !== 'completed' && (
                    <button type="button" onClick={() => void handleCompleteOrder(order.id)} className="primary-button">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark completed
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="min-w-0 rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Items</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                </div>
                <div className="min-w-0 rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Subtotal</p>
                  <p className={`mt-2 overflow-hidden text-ellipsis whitespace-nowrap font-bold leading-tight tracking-tight text-slate-950 dark:text-slate-50 ${getAmountTextClassName(order.subtotal, order.currency)}`}>{formatOrderAmount(order.subtotal, order.currency)}</p>
                </div>
                <div className="min-w-0 rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Shipping</p>
                  <p className={`mt-2 overflow-hidden text-ellipsis whitespace-nowrap font-bold leading-tight tracking-tight text-slate-950 dark:text-slate-50 ${getAmountTextClassName(order.shipping, order.currency)}`}>{formatOrderAmount(order.shipping, order.currency)}</p>
                </div>
                <div className="min-w-0 rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Tax</p>
                  <p className={`mt-2 overflow-hidden text-ellipsis whitespace-nowrap font-bold leading-tight tracking-tight text-slate-950 dark:text-slate-50 ${getAmountTextClassName(order.tax, order.currency)}`}>{formatOrderAmount(order.tax, order.currency)}</p>
                </div>
                <div className="min-w-0 rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Total</p>
                  <p className={`mt-2 overflow-hidden text-ellipsis whitespace-nowrap font-bold leading-tight tracking-tight text-slate-950 dark:text-slate-50 ${getAmountTextClassName(order.total, order.currency)}`}>{formatOrderAmount(order.total, order.currency)}</p>
                </div>
              </div>
            </article>
          ))}
          {hasMoreOrders && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void loadOrders(nextCursor ?? undefined, false, searchQuery)}
                className="secondary-button mt-4"
                disabled={!nextCursor}
              >
                Load more orders
              </button>
            </div>
          )}
          {visibleOrderCount < orders.length && (
            <button
              type="button"
              onClick={() => setVisibleOrderCount((count) => count + 3)}
              className="secondary-button mx-auto block md:mx-0"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersManager;
