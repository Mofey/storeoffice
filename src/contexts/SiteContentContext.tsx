import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { useAuth } from './AuthContext';

interface CarouselItem {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
}

interface NotificationMessage {
  id: number;
  text: string;
}

interface SiteContent {
  heroCarousel: CarouselItem[];
  notificationMessages: NotificationMessage[];
  siteTitle: string;
  siteDescription: string;
  footerText: string;
  footerEmail: string;
  footerPhone: string;
  footerLocation: string;
  privacyLabel: string;
  privacyContent: string;
  termsLabel: string;
  termsContent: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  newsletterBackground: string;
  homePageTitle: string;
  homePageSubtitle: string;
  categoriesTitle: string;
  categoriesSubtitle: string;
  featuredProductsTitle: string;
  featuredProductsSubtitle: string;
}

interface SiteContentContextType {
  content: SiteContent;
  updateContent: (updates: Partial<SiteContent>) => Promise<void>;
  updateCarouselItem: (id: number, updates: Partial<CarouselItem>) => Promise<void>;
  addCarouselItem: (item: Omit<CarouselItem, 'id'>) => Promise<void>;
  deleteCarouselItem: (id: number) => Promise<void>;
  refreshContent: () => Promise<void>;
}

const fallbackContent: SiteContent = {
  heroCarousel: [],
  notificationMessages: [],
  siteTitle: '',
  siteDescription: '',
  footerText: '',
  footerEmail: '',
  footerPhone: '',
  footerLocation: '',
  privacyLabel: 'Privacy',
  privacyContent:
    'EShop collects the information needed to run this storefront, including account details, verified email addresses, order activity, newsletter subscriptions, and product reviews. We use that data to authenticate customers, process purchases, send requested emails, and improve the experience through analytics and merchandising tools.',
  termsLabel: 'Terms',
  termsContent:
    'By using EShop, you agree to provide accurate account and checkout information, use the storefront lawfully, and accept that products, pricing, availability, reviews, and promotions may be updated by the business through the admin dashboard.',
  newsletterTitle: '',
  newsletterSubtitle: '',
  newsletterBackground: '',
  homePageTitle: '',
  homePageSubtitle: '',
  categoriesTitle: '',
  categoriesSubtitle: '',
  featuredProductsTitle: '',
  featuredProductsSubtitle: '',
};

const mergeContentWithDefaults = (content: Partial<SiteContent>): SiteContent => ({
  ...fallbackContent,
  ...content,
  privacyLabel: content.privacyLabel?.trim() ? content.privacyLabel : fallbackContent.privacyLabel,
  privacyContent: content.privacyContent?.trim() ? content.privacyContent : fallbackContent.privacyContent,
  termsLabel: content.termsLabel?.trim() ? content.termsLabel : fallbackContent.termsLabel,
  termsContent: content.termsContent?.trim() ? content.termsContent : fallbackContent.termsContent,
});

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

export const useSiteContent = () => {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within a SiteContentProvider');
  }
  return context;
};

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [content, setContent] = useState<SiteContent>(fallbackContent);

  const refreshContent = async () => {
    const response = await apiRequest<SiteContent>('/content');
    setContent(mergeContentWithDefaults(response));
  };

  useEffect(() => {
    void refreshContent();
  }, []);

  const saveContent = async (nextContent: SiteContent) => {
    const response = await apiRequest<SiteContent>('/content', {
      method: 'PUT',
      token,
      body: JSON.stringify(nextContent),
    });
    setContent(mergeContentWithDefaults(response));
  };

  const updateContent = async (updates: Partial<SiteContent>) => {
    await saveContent({ ...content, ...updates });
  };

  const updateCarouselItem = async (id: number, updates: Partial<CarouselItem>) => {
    await saveContent({
      ...content,
      heroCarousel: content.heroCarousel.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    });
  };

  const addCarouselItem = async (item: Omit<CarouselItem, 'id'>) => {
    const nextId = content.heroCarousel.length > 0 ? Math.max(...content.heroCarousel.map((slide) => slide.id)) + 1 : 1;
    await saveContent({ ...content, heroCarousel: [...content.heroCarousel, { ...item, id: nextId }] });
  };

  const deleteCarouselItem = async (id: number) => {
    await saveContent({ ...content, heroCarousel: content.heroCarousel.filter((item) => item.id !== id) });
  };

  return (
    <SiteContentContext.Provider value={{ content, updateContent, updateCarouselItem, addCarouselItem, deleteCarouselItem, refreshContent }}>
      {children}
    </SiteContentContext.Provider>
  );
};
