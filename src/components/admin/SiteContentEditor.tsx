import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Edit, Plus, Save, Trash2, X } from 'lucide-react';
import { useSiteContent } from '../../contexts/SiteContentContext';
import ConfirmDialog from './ConfirmDialog';

const TICKER_PAGE_SIZE = 3;

const SiteContentEditor: React.FC = () => {
  const { content, updateContent, updateCarouselItem, addCarouselItem, deleteCarouselItem } = useSiteContent();
  const [activeTab, setActiveTab] = useState('general');
  const [contentMenuOpen, setContentMenuOpen] = useState(false);
  const contentMenuRef = useRef<HTMLDivElement | null>(null);
  const [editingCarousel, setEditingCarousel] = useState<number | null>(null);
  const [newNotificationText, setNewNotificationText] = useState('');
  const [newCarouselItem, setNewCarouselItem] = useState({
    title: '',
    subtitle: '',
    image: '',
    cta: '',
  });
  const [draftContent, setDraftContent] = useState(content);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [pendingDeleteCarouselItem, setPendingDeleteCarouselItem] = useState<{ id: number; title: string } | null>(null);
  const [pendingDeleteNotification, setPendingDeleteNotification] = useState<{ id: number; text: string } | null>(null);
  const [isDeletingCarouselItem, setIsDeletingCarouselItem] = useState(false);
  const [isDeletingNotification, setIsDeletingNotification] = useState(false);
  const [visibleTickerCount, setVisibleTickerCount] = useState(TICKER_PAGE_SIZE);

  useEffect(() => {
    setDraftContent(content);
  }, [content]);

  useEffect(() => {
    setVisibleTickerCount(TICKER_PAGE_SIZE);
  }, [content?.notificationMessages?.length]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!contentMenuRef.current?.contains(target)) {
        setContentMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const handleDraftChange = (field: keyof typeof draftContent, value: string) => {
    setDraftContent((prev) => ({ ...prev, [field]: value }));
    setSavedSection(null);
  };

  const handleCarouselUpdate = (id: number, field: string, value: string) => {
    void updateCarouselItem(id, { [field]: value });
  };

  const handleAddCarouselItem = () => {
    if (newCarouselItem.title && newCarouselItem.subtitle && newCarouselItem.image) {
      void addCarouselItem(newCarouselItem);
      setNewCarouselItem({ title: '', subtitle: '', image: '', cta: '' });
    }
  };

  const handleDeleteCarouselItem = (id: number, title: string) => {
    setPendingDeleteCarouselItem({ id, title });
  };

  const confirmDeleteCarouselItem = async () => {
    if (!pendingDeleteCarouselItem) {
      return;
    }

    setIsDeletingCarouselItem(true);
    try {
      await deleteCarouselItem(pendingDeleteCarouselItem.id);
      setPendingDeleteCarouselItem(null);
    } finally {
      setIsDeletingCarouselItem(false);
    }
  };

  const handleAddNotification = () => {
    const text = newNotificationText.trim();
    if (!text) {
      return;
    }

    const nextId =
      draftContent.notificationMessages.length > 0
        ? Math.max(...draftContent.notificationMessages.map((item) => item.id)) + 1
        : 1;

    setDraftContent((prev) => {
      const nextNotifications = [...prev.notificationMessages, { id: nextId, text }];
      setVisibleTickerCount((current) => Math.min(current + 1, nextNotifications.length));
      return {
        ...prev,
        notificationMessages: nextNotifications,
      };
    });
    setNewNotificationText('');
    setSavedSection(null);
  };

  const handleNotificationChange = (id: number, value: string) => {
    setDraftContent((prev) => ({
      ...prev,
      notificationMessages: prev.notificationMessages.map((item) => (item.id === id ? { ...item, text: value } : item)),
    }));
    setSavedSection(null);
  };

  const handleDeleteNotification = (id: number) => {
    const notification = draftContent.notificationMessages.find((item) => item.id === id);
    if (!notification) {
      return;
    }

    setPendingDeleteNotification(notification);
  };

  const confirmDeleteNotification = async () => {
    if (!pendingDeleteNotification) {
      return;
    }

    setIsDeletingNotification(true);
    setDraftContent((prev) => {
      const nextNotifications = prev.notificationMessages.filter((item) => item.id !== pendingDeleteNotification.id);
      setVisibleTickerCount((current) => Math.min(current, nextNotifications.length));
      return {
        ...prev,
        notificationMessages: nextNotifications,
      };
    });
    setSavedSection(null);
    setPendingDeleteNotification(null);
    setIsDeletingNotification(false);
  };

  const handleSaveSection = async (section: 'general' | 'pages' | 'newsletter' | 'notifications') => {
    setSavingSection(section);
    setSavedSection(null);

    try {
      if (section === 'general') {
        await updateContent({
          siteTitle: draftContent.siteTitle,
          siteDescription: draftContent.siteDescription,
          footerText: draftContent.footerText,
          footerEmail: draftContent.footerEmail,
          footerPhone: draftContent.footerPhone,
          footerLocation: draftContent.footerLocation,
          privacyLabel: draftContent.privacyLabel,
          privacyContent: draftContent.privacyContent,
          termsLabel: draftContent.termsLabel,
          termsContent: draftContent.termsContent,
        });
      }

      if (section === 'pages') {
        await updateContent({
          categoriesTitle: draftContent.categoriesTitle,
          categoriesSubtitle: draftContent.categoriesSubtitle,
          featuredProductsTitle: draftContent.featuredProductsTitle,
          featuredProductsSubtitle: draftContent.featuredProductsSubtitle,
        });
      }

      if (section === 'newsletter') {
        await updateContent({
          newsletterTitle: draftContent.newsletterTitle,
          newsletterSubtitle: draftContent.newsletterSubtitle,
          newsletterBackground: draftContent.newsletterBackground,
        });
      }

      if (section === 'notifications') {
        await updateContent({
          notificationMessages: draftContent.notificationMessages
            .map((item) => ({ ...item, text: item.text.trim() }))
            .filter((item) => item.text),
        });
      }

      setSavedSection(section);
    } finally {
      setSavingSection(null);
    }
  };

  const handleLoadMoreNotifications = () => {
    const total = (draftContent.notificationMessages ?? []).length;
    setVisibleTickerCount((current) => Math.min(current + TICKER_PAGE_SIZE, total));
  };

  const tabs = [
    { id: 'general', label: 'General Settings' },
    { id: 'hero', label: 'Hero Carousel' },
    { id: 'pages', label: 'Page Content' },
    { id: 'newsletter', label: 'Newsletter' },
    { id: 'notifications', label: 'Ticker Messages' },
  ];

  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? 'General Settings';

  const renderMobileContentSheet = () => {
    if (typeof document === 'undefined') {
      return null;
    }

    return createPortal(
      <AnimatePresence>
        {contentMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close content sections"
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
                setContentMenuOpen(false);
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
                    <p className="text-sm font-bold text-slate-950 dark:text-slate-50">Manage site content</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Choose a content section</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContentMenuOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setContentMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left text-sm font-medium transition ${
                        activeTab === tab.id
                          ? 'bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950'
                          : 'bg-white/70 text-slate-700 hover:bg-slate-100 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {activeTab === tab.id && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={() => setContentMenuOpen(false)} className="primary-button mt-6 w-full">
                  Apply section
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  const renderSaveRow = (section: 'general' | 'pages' | 'newsletter' | 'notifications') => (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {savedSection === section ? 'Changes saved.' : 'Changes are only saved when you click the button.'}
      </p>
      <button
        type="button"
        onClick={() => void handleSaveSection(section)}
        disabled={savingSection === section}
        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
      >
        {savedSection === section && savingSection !== section ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
        {savingSection === section ? 'Saving...' : savedSection === section ? 'Saved' : 'Save changes'}
      </button>
    </div>
  );

  const notificationMessages = draftContent.notificationMessages ?? [];
  const visibleNotificationMessages = notificationMessages.slice(0, visibleTickerCount);
  const canLoadMoreNotifications = visibleTickerCount < notificationMessages.length;

  return (
    <div className="space-y-6">
      {renderMobileContentSheet()}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Site Content Management</h3>
        <div className="relative z-40" ref={contentMenuRef}>
          <button
            type="button"
            onClick={() => setContentMenuOpen((open) => !open)}
            className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium transition ${
              contentMenuOpen
                ? 'border-slate-950 bg-slate-950 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950'
                : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {activeTabLabel}
            <ChevronDown className={`h-4 w-4 transition ${contentMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {contentMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute right-0 z-50 mt-3 hidden w-64 overflow-hidden rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] lg:block dark:border-slate-700 dark:bg-slate-900"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setContentMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left text-sm font-medium transition ${
                      activeTab === tab.id
                        ? 'bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {activeTab === tab.id && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {activeTab === 'general' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Site Title</label>
            <input
              type="text"
              value={draftContent.siteTitle}
              onChange={(e) => handleDraftChange('siteTitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Site Description</label>
            <input
              type="text"
              value={draftContent.siteDescription}
              onChange={(e) => handleDraftChange('siteDescription', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Footer Text</label>
            <textarea
              value={draftContent.footerText}
              onChange={(e) => handleDraftChange('footerText', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Footer Email</label>
              <input
                type="email"
                value={draftContent.footerEmail}
                onChange={(e) => handleDraftChange('footerEmail', e.target.value)}
                placeholder="support@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Footer Phone</label>
              <input
                type="text"
                value={draftContent.footerPhone}
                onChange={(e) => handleDraftChange('footerPhone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Footer Location</label>
              <input
                type="text"
                value={draftContent.footerLocation}
                onChange={(e) => handleDraftChange('footerLocation', e.target.value)}
                placeholder="Remote-first shipping hub"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Privacy Label</label>
              <input
                type="text"
                value={draftContent.privacyLabel}
                onChange={(e) => handleDraftChange('privacyLabel', e.target.value)}
                placeholder="Privacy"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Terms Label</label>
              <input
                type="text"
                value={draftContent.termsLabel}
                onChange={(e) => handleDraftChange('termsLabel', e.target.value)}
                placeholder="Terms"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Privacy Content</label>
            <textarea
              value={draftContent.privacyContent}
              onChange={(e) => handleDraftChange('privacyContent', e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Terms Content</label>
            <textarea
              value={draftContent.termsContent}
              onChange={(e) => handleDraftChange('termsContent', e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          {renderSaveRow('general')}
        </div>
      )}

      {activeTab === 'hero' && (
        <div className="space-y-6">
          {content.heroCarousel.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">Carousel Item {item.id}</h4>
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setEditingCarousel(editingCarousel === item.id ? null : item.id)} className="text-blue-600 hover:text-blue-700">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => void handleDeleteCarouselItem(item.id, item.title)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingCarousel === item.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleCarouselUpdate(item.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subtitle</label>
                    <input
                      type="text"
                      value={item.subtitle}
                      onChange={(e) => handleCarouselUpdate(item.id, 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image URL</label>
                    <input
                      type="url"
                      value={item.image}
                      onChange={(e) => handleCarouselUpdate(item.id, 'image', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Call to Action</label>
                    <input
                      type="text"
                      value={item.cta}
                      onChange={(e) => handleCarouselUpdate(item.id, 'cta', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded-lg" />
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">{item.title}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.subtitle}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{item.cta}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Add New Carousel Item</h4>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Title"
                  value={newCarouselItem.title}
                  onChange={(e) => setNewCarouselItem({ ...newCarouselItem, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Subtitle"
                  value={newCarouselItem.subtitle}
                  onChange={(e) => setNewCarouselItem({ ...newCarouselItem, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="url"
                  placeholder="Image URL"
                  value={newCarouselItem.image}
                  onChange={(e) => setNewCarouselItem({ ...newCarouselItem, image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Call to Action"
                  value={newCarouselItem.cta}
                  onChange={(e) => setNewCarouselItem({ ...newCarouselItem, cta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button type="button" onClick={handleAddCarouselItem} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories Section Title</label>
            <input
              type="text"
              value={draftContent.categoriesTitle}
              onChange={(e) => handleDraftChange('categoriesTitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories Section Subtitle</label>
            <input
              type="text"
              value={draftContent.categoriesSubtitle}
              onChange={(e) => handleDraftChange('categoriesSubtitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Featured Products Title</label>
            <input
              type="text"
              value={draftContent.featuredProductsTitle}
              onChange={(e) => handleDraftChange('featuredProductsTitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Featured Products Subtitle</label>
            <input
              type="text"
              value={draftContent.featuredProductsSubtitle}
              onChange={(e) => handleDraftChange('featuredProductsSubtitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          {renderSaveRow('pages')}
        </div>
      )}

      {activeTab === 'newsletter' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Newsletter Title</label>
            <input
              type="text"
              value={draftContent.newsletterTitle}
              onChange={(e) => handleDraftChange('newsletterTitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Newsletter Subtitle</label>
            <textarea
              value={draftContent.newsletterSubtitle}
              onChange={(e) => handleDraftChange('newsletterSubtitle', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Newsletter Background Image URL</label>
            <input
              type="url"
              value={draftContent.newsletterBackground}
              onChange={(e) => handleDraftChange('newsletterBackground', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
            {draftContent.newsletterBackground && (
              <div className="mt-3">
                <img
                  src={draftContent.newsletterBackground}
                  alt="Newsletter background preview"
                  className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                />
              </div>
            )}
          </div>

          {renderSaveRow('newsletter')}
        </div>
      )}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add ticker message</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={newNotificationText}
                onChange={(e) => setNewNotificationText(e.target.value)}
                placeholder="Flash sale tonight, free shipping, launch updates..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
              <button type="button" onClick={handleAddNotification} className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">
                <Plus className="mr-2 h-4 w-4" />
                Add message
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {notificationMessages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No ticker messages yet. The storefront bar stays hidden until you add one.
              </div>
            ) : (
              visibleNotificationMessages.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => handleNotificationChange(item.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                    />
                    <button type="button" onClick={() => handleDeleteNotification(item.id)} className="secondary-button text-rose-600 hover:text-rose-700 dark:text-rose-300">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {canLoadMoreNotifications && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLoadMoreNotifications}
                className="text-sm font-semibold text-slate-900 underline-offset-4 transition hover:underline dark:text-slate-100"
              >
                Load more ticker messages
              </button>
            </div>
          )}

          {renderSaveRow('notifications')}
        </div>
      )}
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteCarouselItem)}
        title="Delete carousel item?"
        description={`"${pendingDeleteCarouselItem?.title ?? 'This slide'}" will be removed from the hero carousel.`}
        confirmLabel="Delete slide"
        isProcessing={isDeletingCarouselItem}
        onClose={() => {
          if (!isDeletingCarouselItem) {
            setPendingDeleteCarouselItem(null);
          }
        }}
        onConfirm={confirmDeleteCarouselItem}
      />
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteNotification)}
        title="Delete ticker message?"
        description={`"${pendingDeleteNotification?.text ?? 'This message'}" will be removed from the storefront notification bar.`}
        confirmLabel="Delete message"
        isProcessing={isDeletingNotification}
        onClose={() => {
          if (!isDeletingNotification) {
            setPendingDeleteNotification(null);
          }
        }}
        onConfirm={confirmDeleteNotification}
      />
    </div>
  );
};

export default SiteContentEditor;
