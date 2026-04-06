import React, { useMemo, useState } from 'react';
import { Edit, FolderTree, Plus, Save, Trash2, X } from 'lucide-react';
import { ApiError } from '../../lib/api';
import { type Category, useProducts } from '../../contexts/ProductContext';
import ConfirmDialog from './ConfirmDialog';

const emptyCategory: Category = {
  id: '',
  name: '',
  icon: '',
  description: '',
};

const CategoriesManager: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useProducts();
  const [draft, setDraft] = useState<Category>(emptyCategory);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const productCounts = useMemo(() => {
    return products.reduce<Record<string, number>>((accumulator, product) => {
      accumulator[product.category] = (accumulator[product.category] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [products]);

  const resetForm = () => {
    setDraft(emptyCategory);
    setEditingId(null);
  };

  const visibleCategories = categories.slice(0, visibleCount);
  const hasMoreCategories = visibleCount < categories.length;

  const startEdit = (category: Category) => {
    setDraft(category);
    setEditingId(category.id);
    setMessage('');
    setError('');
  };

  const handleChange = (field: keyof Category, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (editingId) {
        await updateCategory(editingId, draft);
        setMessage('Category updated successfully.');
      } else {
        await addCategory(draft);
        setMessage('Category created successfully.');
      }
      resetForm();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to save category right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);
    if (!category) {
      return;
    }

    setPendingDeleteCategory(category);
  };

  const confirmDeleteCategory = async () => {
    if (!pendingDeleteCategory) {
      return;
    }

    setIsDeletingCategory(true);
    setMessage('');
    setError('');
    try {
      await deleteCategory(pendingDeleteCategory.id);
      if (editingId === pendingDeleteCategory.id) {
        resetForm();
      }
      setPendingDeleteCategory(null);
      setMessage('Category deleted successfully.');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to delete category right now.');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="glass-panel flex h-full flex-col rounded-[28px] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">{editingId ? 'Edit category' : 'Create category'}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">
              Categories drive storefront navigation, product filtering, and admin product assignment.
            </p>
          </div>
          {editingId && (
            <button type="button" onClick={resetForm} className="secondary-button">
              <X className="mr-2 h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col">
          <div className="space-y-5">
          {message && <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</div>}
          {error && <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</div>}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Category ID</label>
              <input
                type="text"
                value={draft.id}
                onChange={(event) => handleChange('id', event.target.value)}
                required
                className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                placeholder="phones"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Display name</label>
              <input
                type="text"
                value={draft.name}
                onChange={(event) => handleChange('name', event.target.value)}
                required
                className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                placeholder="Phones"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[160px_1fr]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Icon</label>
              <input
                type="text"
                value={draft.icon}
                onChange={(event) => handleChange('icon', event.target.value)}
                required
                className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                placeholder="📱"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
              <textarea
                value={draft.description}
                onChange={(event) => handleChange('description', event.target.value)}
                required
                rows={4}
                className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                placeholder="Latest smartphones and mobile devices"
              />
            </div>
          </div>

          </div>

          <div className="mt-auto pt-6">
            <button type="submit" disabled={saving} className="primary-button disabled:cursor-not-allowed disabled:opacity-60">
              {editingId ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {saving ? 'Saving...' : editingId ? 'Save category' : 'Create category'}
            </button>
          </div>
        </form>
      </section>

      <section className="glass-panel rounded-[28px] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950">
            <FolderTree className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">Current categories</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Delete is blocked while products are still assigned.</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {visibleCategories.map((category) => (
            <div key={category.id} className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700/80 dark:bg-slate-900/60">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-50">{category.name}</p>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{category.id}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{category.description}</p>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {productCounts[category.id] ?? 0} products
                  </span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(category)} className="rounded-full bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => void handleDelete(category.id)} className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMoreCategories && (
          <button type="button" onClick={() => setVisibleCount((count) => count + 3)} className="secondary-button mt-6">
            Load 3 more
          </button>
        )}
      </section>
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteCategory)}
        title="Delete category?"
        description={`"${pendingDeleteCategory?.name ?? 'This category'}" will be removed from the category list. This action cannot be undone.`}
        confirmLabel="Delete category"
        isProcessing={isDeletingCategory}
        onClose={() => {
          if (!isDeletingCategory) {
            setPendingDeleteCategory(null);
          }
        }}
        onConfirm={confirmDeleteCategory}
      />
    </div>
  );
};

export default CategoriesManager;
