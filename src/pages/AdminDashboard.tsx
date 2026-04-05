import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BarChart3, Brain, Edit, FolderTree, LogOut, Mail, Menu, MessageSquare, Moon, Package, Plus, Settings, ShoppingCart, Star, Sun, Trash2, TrendingUp, Users, X } from 'lucide-react';
import AddProductForm from '../components/admin/AddProductForm';
import AnalyticsCharts from '../components/admin/AnalyticsCharts';
import CategoriesManager from '../components/admin/CategoriesManager';
import NewsletterManager from '../components/admin/NewsletterManager';
import OrdersManager from '../components/admin/OrdersManager';
import ProductEditModal from '../components/admin/ProductEditModal';
import ReviewsManager from '../components/admin/ReviewsManager';
import SiteContentEditor from '../components/admin/SiteContentEditor';
import UsersManager from '../components/admin/UsersManager';
import { useAuth } from '../contexts/AuthContext';
import { type Product, useProducts } from '../contexts/ProductContext';
import { useTheme } from '../contexts/ThemeContext';

const AdminDashboard: React.FC = () => {
  const { user, logout, isHydrated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { products, featuredProducts, newArrivals, updateProduct, deleteProduct } = useProducts();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

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
    { label: 'Products', value: products.length.toString(), change: '+2 this cycle', icon: Package, insight: 'Catalog coverage is now shared with the storefront through the API.' },
    { label: 'Featured', value: featuredProducts.length.toString(), change: 'Homepage ready', icon: Star, insight: 'Featured slots sync directly with the storefront home page.' },
    { label: 'New arrivals', value: newArrivals.length.toString(), change: 'Fresh inventory', icon: TrendingUp, insight: 'New items are instantly reflected in storefront merchandising.' },
    { label: 'Analytics', value: 'Live', change: 'Backend driven', icon: Brain, insight: 'ML-friendly metrics now come from the FastAPI backend.' },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileNavOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="glass-panel flex h-full flex-col rounded-[28px] p-6 xl:p-7">
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
                </div>
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
              <button type="button" onClick={() => setShowAddProductForm(true)} className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">
                <Plus className="mr-2 h-4 w-4" />
                Add product
              </button>
            </div>

            <div className="glass-panel overflow-hidden rounded-[28px]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/80">
                    <tr className="text-left text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Flags</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-t border-slate-200/80 dark:border-slate-700/80">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={product.image} alt={product.name} className="h-12 w-12 rounded-2xl object-cover" />
                            <div>
                              <p className="font-semibold text-slate-950 dark:text-slate-50">{product.name}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{product.rating.toFixed(1)} stars • {product.reviews} reviews</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{product.category}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-950 dark:text-slate-50">${product.price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.inStock ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}>{product.inStock ? 'In stock' : 'Out of stock'}</span>
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
                            <button type="button" onClick={() => void deleteProduct(product.id)} className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-300">
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
                <button key={tab.id} type="button" onClick={() => handleTabChange(tab.id)} className={`flex items-center gap-3 rounded-[22px] px-4 py-3 text-left text-sm font-semibold transition ${activeTab === tab.id ? 'bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'}`}>
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
        {mobileNavOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px]"
          />
        )}

        <div className={`fixed inset-x-4 bottom-24 z-50 transition duration-200 ${mobileNavOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}>
          <div className="glass-panel rounded-[28px] p-4 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)]">
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
                  className={`flex items-center gap-3 rounded-[22px] px-4 py-3 text-left text-sm font-semibold transition ${activeTab === tab.id ? 'bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950' : 'bg-white/70 text-slate-600 dark:bg-slate-950/40 dark:text-slate-300'}`}
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
          className="glass-panel fixed bottom-6 right-4 z-[60] inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)] dark:text-slate-50"
        >
          {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          {mobileNavOpen ? 'Close menu' : 'Open menu'}
        </button>
      </div>

      {editingProduct && <ProductEditModal product={editingProduct} isOpen={Boolean(editingProduct)} onClose={() => setEditingProduct(null)} onSave={(id, updates) => void updateProduct(id, updates)} />}
      <AddProductForm isOpen={showAddProductForm} onClose={() => setShowAddProductForm(false)} />
    </div>
  );
};

export default AdminDashboard;
