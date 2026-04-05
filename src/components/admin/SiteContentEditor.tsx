import React, { useEffect, useState } from 'react';
import { Check, Edit, Plus, Save, Trash2 } from 'lucide-react';
import { useSiteContent } from '../../contexts/SiteContentContext';

const SiteContentEditor: React.FC = () => {
  const { content, updateContent, updateCarouselItem, addCarouselItem, deleteCarouselItem } = useSiteContent();
  const [activeTab, setActiveTab] = useState('general');
  const [editingCarousel, setEditingCarousel] = useState<number | null>(null);
  const [newCarouselItem, setNewCarouselItem] = useState({
    title: '',
    subtitle: '',
    image: '',
    cta: '',
  });
  const [draftContent, setDraftContent] = useState(content);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);

  useEffect(() => {
    setDraftContent(content);
  }, [content]);

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

  const handleSaveSection = async (section: 'general' | 'pages' | 'newsletter') => {
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

      setSavedSection(section);
    } finally {
      setSavingSection(null);
    }
  };

  const tabs = [
    { id: 'general', label: 'General Settings' },
    { id: 'hero', label: 'Hero Carousel' },
    { id: 'pages', label: 'Page Content' },
    { id: 'newsletter', label: 'Newsletter' },
  ];

  const renderSaveRow = (section: 'general' | 'pages' | 'newsletter') => (
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Site Content Management</h3>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
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
                  <button type="button" onClick={() => void deleteCarouselItem(item.id)} className="text-red-600 hover:text-red-700">
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
    </div>
  );
};

export default SiteContentEditor;
