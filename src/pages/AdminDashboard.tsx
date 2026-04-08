import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Brain, Check, ChevronDown, Edit, FolderTree, LogOut, Mail, Menu, MessageSquare, Moon, Package, Plus, Settings, ShoppingCart, Sun, Trash2, Users, X } from 'lucide-react';
import AddProductForm from '../components/admin/AddProductForm';
import AdminSettingsManager from '../components/admin/AdminSettingsManager';
import AnalyticsCharts from '../components/admin/AnalyticsCharts';
import CategoriesManager from '../components/admin/CategoriesManager';
import ConfirmDialog from '../components/admin/ConfirmDialog';
import NewsletterManager from '../components/admin/NewsletterManager';
import OrdersManager from '../components/admin/OrdersManager';
import ProductEditModal from '../components/admin/ProductEditModal';
import ReviewsManager from '../components/admin/ReviewsManager';
import SiteContentEditor from '../components/admin/SiteContentEditor';
import UsersManager from '../components/admin/UsersManager';
import { type Product, useProducts } from '../contexts/ProductContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiRequest } from '../lib/api';

interface AdminOrderSummary {
  items: Array<{ productId: number; quantity: number }>;
  paymentStatus?: string;
  status?: string;
}

const AdminDashboard: React.FC = () => {
  const { user, token, logout, isHydrated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { products, featuredProducts, newArrivals, refreshProducts, updateProduct, deleteProduct } = useProducts();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showFloatingMenuButton, setShowFloatingMenuButton] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [newsletterCount, setNewsletterCount] = useState(0);
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [visibleProductCount, setVisibleProductCount] = useState(3);
  const [productSalesById, setProductSalesById] = useState<Record<number, number>>({});
  const [productCategoryMenuOpen, setProductCategoryMenuOpen] = useState(false);
  const productCategoryMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'products' || activeTab === 'overview' || activeTab === 'analytics') {
      void refreshProducts();
    }
  }, [activeTab, refreshProducts]);

  useEffect(() => {
    let hideButtonTimeout: number | null = null;

    const resetHideTimer = () => {
      if (hideButtonTimeout) {
        window.clearTimeout(hideButtonTimeout);
      }
      setShowFloatingMenuButton(true);
      hideButtonTimeout = window.setTimeout(() => {
        setShowFloatingMenuButton(false);
      }, 3000);
    };

    resetHideTimer();
    window.addEventListener('scroll', resetHideTimer, { passive: true });

    return () => {
      window.removeEventListener('scroll', resetHideTimer);
      if (hideButtonTimeout) {
        window.clearTimeout(hideButtonTimeout);
      }
    };
  }, []);

  useEffect(() => {
    if (mobileNavOpen) {
      setShowFloatingMenuButton(true);
    }
  }, [mobileNavOpen]);

  useEffect(() => {
    setVisibleProductCount(3);
  }, [productCategoryFilter]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!productCategoryMenuRef.current?.contains(target)) {
        setProductCategoryMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'products') {
      return;
    }

    const refreshOnFocus = () => {
      void refreshProducts();
    };

    const intervalId = window.setInterval(() => {
      void refreshProducts();
    }, 5000);

    window.addEventListener('focus', refreshOnFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [activeTab, refreshProducts]);

  useEffect(() => {
    let isMounted = true;

    const loadOverviewCounts = async () => {
      if (!token) {
        return;
      }

      try {
        const [orders, subscribers] = await Promise.all([
          apiRequest<Array<unknown>>('/admin/orders', { token }),
          apiRequest<Array<unknown>>('/admin/newsletter-subscribers', { token }),
        ]);

        if (!isMounted) {
          return;
        }

        setOrderCount(orders.length);
        setNewsletterCount(subscribers.length);
      } catch {
        if (!isMounted) {
          return;
        }
        setOrderCount(0);
        setNewsletterCount(0);
      }
    };

    void loadOverviewCounts();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (activeTab !== 'products' || !token) {
      return;
    }

    let isMounted = true;

    const loadProductSales = async () => {
      try {
        const orders = await apiRequest<AdminOrderSummary[]>('/admin/orders', { token });
        if (!isMounted) {
          return;
        }

        const nextSalesMap = orders.reduce<Record<number, number>>((accumulator, order) => {
          const isCountedOrder =
            order.paymentStatus === 'paid' ||
            order.status === 'processing' ||
            order.status === 'completed' ||
            order.status === 'inventory_review';

          if (!isCountedOrder) {
            return accumulator;
          }

          order.items.forEach((item) => {
            accumulator[item.productId] = (accumulator[item.productId] ?? 0) + item.quantity;
          });
          return accumulator;
        }, {});

        setProductSalesById(nextSalesMap);
      } catch {
        if (isMounted) {
          setProductSalesById({});
        }
      }
    };

    void loadProductSales();

    return () => {
      isMounted = false;
    };
  }, [activeTab, token]);

  const productCategories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort((left, right) => left.localeCompare(right)),
    [products]
  );

  const productCategoryOptions = useMemo(
    () => [
      { value: 'all', label: 'All categories' },
      ...productCategories.map((category) => ({
        value: category,
        label: category,
      })),
    ],
    [productCategories]
  );

  const activeProductCategoryLabel =
    productCategoryOptions.find((option) => option.value === productCategoryFilter)?.label ?? 'All categories';

  const rankedProducts = useMemo(() => {
    const filteredProducts = products.filter((product) => productCategoryFilter === 'all' || product.category === productCategoryFilter);
    return [...filteredProducts].sort((left, right) => {
      const salesDifference = (productSalesById[right.id] ?? 0) - (productSalesById[left.id] ?? 0);
      if (salesDifference !== 0) {
        return salesDifference;
      }
      return left.name.localeCompare(right.name);
    });
  }, [productCategoryFilter, productSalesById, products]);

  const visibleRankedProducts = rankedProducts.slice(0, visibleProductCount);

  if (!isHydrated) {
    return (
      <div className="section-shell py-8">
        <div className="glass-panel rounded-[36px] p-10 text-center text-sm text-slate-600 dark:text-slate-400">
          Restoring your admin session...
        </div>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: Brain },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'newsletter', label: 'Newsletter', icon: Mail },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const stats = [
    { label: 'Products', value: products.length.toString(), change: '+2 this cycle', icon: Package, insight: 'Catalog coverage is now shared with the storefront through the API.', targetTab: 'products' },
    { label: 'Orders', value: orderCount.toString(), change: 'Checkout activity', icon: ShoppingCart, insight: 'Track live order flow and jump into fulfilment from the admin workspace.', targetTab: 'orders' },
    { label: 'Newsletter', value: newsletterCount.toString(), change: 'Audience stored', icon: Mail, insight: 'Subscriber totals reflect the audience available for newsletter campaigns.', targetTab: 'newsletter' },
    { label: 'Analytics', value: 'Live', change: 'Backend driven', icon: Brain, insight: 'ML-friendly metrics now come from the FastAPI backend.', targetTab: 'analytics' },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileNavOpen(false);
  };

  const handleDeleteProduct = (product: Product) => {
    setPendingDeleteProduct(product);
  };

  const confirmDeleteProduct = async () => {
    if (!pendingDeleteProduct) {
      return;
    }

    setIsDeletingProduct(true);
    try {
      await deleteProduct(pendingDeleteProduct.id);
      setPendingDeleteProduct(null);
      await refreshProducts();
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const renderMobileProductCategorySheet = () => {
    if (typeof document === 'undefined') {
      return null;
    }

    return createPortal(
      <AnimatePresence>
        {productCategoryMenuOpen && activeTab === 'products' && (
          <>
            <motion.button
              type="button"
              aria-label="Close category filters"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onPointerUp={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setProductCategoryMenuOpen(false);
              }}
              className="fixed inset-0 z-[120] bg-slate-950/40 backdrop-blur-[3px] lg:hidden"
            />
            <div className="fixed inset-x-0 bottom-20 z-[130] flex justify-center px-3 lg:hidden">
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.98 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                onPointerDown={(event) => event.stopPropagation()}
                className="glass-panel max-h-[72vh] w-full max-w-sm overflow-y-auto rounded-[28px] p-5 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-950 dark:text-slate-50">Filter products</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Choose a category view</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductCategoryMenuOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-2">
                  {productCategoryOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setProductCategoryFilter(option.value);
                        setProductCategoryMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left text-sm font-medium transition ${
                        productCategoryFilter === option.value
                          ? 'bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950'
                          : 'bg-white/70 text-slate-700 hover:bg-slate-100 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="capitalize">{option.label}</span>
                      {productCategoryFilter === option.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={() => setProductCategoryMenuOpen(false)} className="primary-button mt-6 w-full">
                  Apply category filter
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <button
                  key={stat.label}
                  type="button"
                  onClick={() => handleTabChange(stat.targetTab)}
                  className="glass-panel flex h-full flex-col rounded-[28px] p-6 text-left transition hover:-translate-y-1 hover:shadow-[0_26px_60px_-36px_rgba(15,23,42,0.5)] xl:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <span className="text-right text-xs uppercase leading-5 tracking-[0.2em] text-emerald-500">{stat.change}</span>
                  </div>
                  <div className="mt-6 space-y-3 xl:mt-7">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-950 dark:text-slate-50">{stat.value}</p>
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">{stat.insight}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="glass-panel rounded-[28px] p-6">
                <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">Featured products</h3>
                <div className="mt-5 space-y-3">
                  {featuredProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 dark:bg-slate-900">
                      <img src={product.image} alt={product.name} className="h-12 w-12 rounded-2xl object-cover" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-950 dark:text-slate-50">{product.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">${product.price.toFixed(2)} • {product.rating.toFixed(1)} stars</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-[28px] p-6">
                <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">Recent product momentum</h3>
                <div className="mt-5 space-y-3">
                  {newArrivals.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 dark:bg-slate-900">
                      <img src={product.image} alt={product.name} className="h-12 w-12 rounded-2xl object-cover" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-950 dark:text-slate-50">{product.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{product.category} • ${product.price.toFixed(2)}</p>
                      </div>
                      <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">New</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return <AnalyticsCharts />;

      case 'products':
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-2xl font-bold text-slate-950 dark:text-slate-50">Product management</h3>
              <div className="flex flex-wrap items-center gap-3">
                <div ref={productCategoryMenuRef} className="relative z-40">
                  <button
                    type="button"
                    onClick={() => setProductCategoryMenuOpen((open) => !open)}
                    className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium transition ${
                      productCategoryMenuOpen
                        ? 'border-slate-950 bg-slate-950 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950'
                        : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                    }`}
                  >
                    <span className="capitalize">{activeProductCategoryLabel}</span>
                    <ChevronDown className={`h-4 w-4 transition ${productCategoryMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {productCategoryMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 z-50 mt-3 hidden w-64 overflow-hidden rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] lg:block dark:border-slate-700 dark:bg-slate-900"
                      >
                        {productCategoryOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setProductCategoryFilter(option.value);
                              setProductCategoryMenuOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left text-sm font-medium capitalize transition ${
                              productCategoryFilter === option.value
                                ? 'bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950'
                                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span>{option.label}</span>
                            {productCategoryFilter === option.value && <Check className="h-4 w-4" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddProductForm(true)}
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add product
                </button>
              </div>
            </div>

            <div className="glass-panel overflow-hidden rounded-[28px]">
              <div className="grid gap-4 p-4 sm:p-5 lg:hidden">
                {visibleRankedProducts.map((product) => (
                  <article key={product.id} className="rounded-[24px] bg-white p-4 shadow-sm dark:bg-slate-900">
                    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                      <img src={product.image} alt={product.name} className="h-16 w-16 rounded-2xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:items-start">
                          <div className="min-w-0">
                            <p className="truncate text-lg font-bold text-slate-950 dark:text-slate-50">{product.name}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{product.category}</p>
                          </div>
                          <p className="shrink-0 text-lg font-bold text-slate-950 dark:text-slate-50">${product.price.toFixed(2)}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            !product.inStock || (Number.isFinite(product.stockQuantity) ? product.stockQuantity : 0) <= 5
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          }`}>
                            {product.inStock ? `${Number.isFinite(product.stockQuantity) ? product.stockQuantity : 10} in stock` : 'Out of stock'}
                          </span>
                          {product.isFeatured && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Featured</span>}
                          {product.isNewArrival && <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">New</span>}
                        </div>

                        <div className="mt-4 grid gap-2 rounded-[20px] bg-slate-50 p-3 text-sm dark:bg-slate-800/70">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500 dark:text-slate-400">Rating</span>
                            <span className="font-semibold text-slate-950 dark:text-slate-50">{product.rating.toFixed(1)} stars</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500 dark:text-slate-400">Reviews</span>
                            <span className="font-semibold text-slate-950 dark:text-slate-50">{product.reviews}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500 dark:text-slate-400">Inventory</span>
                            <span className="font-semibold text-slate-950 dark:text-slate-50">{Number.isFinite(product.stockQuantity) ? product.stockQuantity : product.inStock ? 10 : 0}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500 dark:text-slate-400">Units sold</span>
                            <span className="font-semibold text-slate-950 dark:text-slate-50">{productSalesById[product.id] ?? 0}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                          <button type="button" onClick={() => setEditingProduct(product)} className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </button>
                          <button type="button" onClick={() => void handleDeleteProduct(product)} className="inline-flex items-center justify-center rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-300">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[820px]">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/80">
                    <tr className="text-left text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Sold</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Flags</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRankedProducts.map((product) => (
                      <tr key={product.id} className="border-t border-slate-200/80 dark:border-slate-700/80">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={product.image} alt={product.name} className="h-12 w-12 rounded-2xl object-cover" />
                            <div>
                              <p className="font-semibold text-slate-950 dark:text-slate-50">{product.name}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {product.rating.toFixed(1)} stars • {product.reviews} reviews • {(Number.isFinite(product.stockQuantity) ? product.stockQuantity : product.inStock ? 10 : 0)} in inventory
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{product.category}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-50">${product.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-50">{productSalesById[product.id] ?? 0}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            !product.inStock || (Number.isFinite(product.stockQuantity) ? product.stockQuantity : 0) <= 5
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          }`}>
                            {product.inStock ? `${Number.isFinite(product.stockQuantity) ? product.stockQuantity : 10} in stock` : 'Out of stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {product.isFeatured && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Featured</span>}
                            {product.isNewArrival && <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">New</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setEditingProduct(product)} className="rounded-full bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => void handleDeleteProduct(product)} className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {visibleProductCount < rankedProducts.length && (
              <button
                type="button"
                onClick={() => setVisibleProductCount((count) => count + 3)}
                className="secondary-button mx-auto block md:mx-0"
              >
                Load more
              </button>
            )}
          </div>
        );

      case 'orders':
        return <OrdersManager />;

      case 'categories':
        return <CategoriesManager />;

      case 'users':
        return <UsersManager />;

      case 'newsletter':
        return <NewsletterManager />;

      case 'reviews':
        return <ReviewsManager />;

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="glass-panel rounded-[28px] p-6">
              <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">Theme settings</h3>
              <button type="button" onClick={toggleTheme} className="secondary-button mt-5">
                {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                Toggle theme
              </button>
            </div>
            <AdminSettingsManager />
            <SiteContentEditor />
          </div>
        );

      default:
        return (
          <div className="glass-panel rounded-[28px] p-10 text-center">
            <h3 className="text-2xl font-bold text-slate-950 dark:text-slate-50">{tabs.find((tab) => tab.id === activeTab)?.label}</h3>
            <p className="mt-3 text-slate-600 dark:text-slate-400">This section stays available as a placeholder, but the shell around it is now fully standalone.</p>
          </div>
        );
    }
  };

  return (
    <div className="section-shell py-8">
      <div className="glass-panel rounded-[36px] p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="pill">Admin workspace</span>
            <h1 className="section-title mt-4">Control center</h1>
            <p className="section-copy mt-3 max-w-2xl">Products, content, and analytics are now managed from an independent admin app connected to FastAPI and MongoDB.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={toggleTheme} className="secondary-button">
              {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              Theme
            </button>
            <button type="button" onClick={logout} className="secondary-button">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr] lg:items-start">
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <div className="glass-panel rounded-[32px] p-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <nav className="grid gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-3 rounded-[22px] px-4 py-3 text-left text-sm font-semibold transition ${
                    activeTab === tab.id ? 'bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <section>{renderContent()}</section>
      </div>

      <div className="lg:hidden">
        {renderMobileProductCategorySheet()}

        {mobileNavOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px]"
          />
        )}

        <div className={`fixed inset-x-0 bottom-24 z-50 flex justify-center px-3 transition duration-200 ${mobileNavOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}>
          <div className="glass-panel max-h-[72vh] w-full max-w-sm overflow-y-auto rounded-[28px] p-4 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-950 dark:text-slate-50">Navigate admin</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Quick section access</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="grid gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-3 rounded-[22px] px-4 py-3 text-left text-sm font-semibold transition ${
                    activeTab === tab.id ? 'bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950' : 'bg-white/70 text-slate-600 dark:bg-slate-950/40 dark:text-slate-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          className={`glass-panel fixed bottom-6 left-4 z-[60] inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)] transition duration-300 dark:text-slate-50 ${
            mobileNavOpen || showFloatingMenuButton
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-4 opacity-0'
          }`}
        >
          {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          {mobileNavOpen ? 'Close menu' : 'Open menu'}
        </button>
      </div>

      {editingProduct && <ProductEditModal product={editingProduct} isOpen={Boolean(editingProduct)} onClose={() => { setEditingProduct(null); void refreshProducts(); }} onSave={updateProduct} />}
      <AddProductForm isOpen={showAddProductForm} onClose={() => setShowAddProductForm(false)} />
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteProduct)}
        title="Delete product?"
        description={`"${pendingDeleteProduct?.name ?? 'This product'}" will be removed from the catalog and can no longer appear in the storefront.`}
        confirmLabel="Delete product"
        isProcessing={isDeletingProduct}
        onClose={() => {
          if (!isDeletingProduct) {
            setPendingDeleteProduct(null);
          }
        }}
        onConfirm={confirmDeleteProduct}
      />
    </div>
  );
};

export default AdminDashboard;
