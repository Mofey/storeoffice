import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest, apiRequestWithRetry } from '../lib/api';
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

interface ShopperStayCard {
  id: number;
  title: string;
  value: string;
  body: string;
}

interface SiteContent {
  heroCarousel: CarouselItem[];
  shopperStayHeading: string;
  shopperStayCards: ShopperStayCard[];
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
  shopperStayHeading: '',
  shopperStayCards: [],
  notificationMessages: [],
  siteTitle: '',
  siteDescription: '',
  footerText: '',
  footerEmail: '',
  footerPhone: '',
  footerLocation: '',
  privacyLabel: 'Privacy',
  privacyContent:
    'EShop collects the information needed to run this storefront, including account details, verified email addresses, order activity, newsletter subscriptions, and product reviews. We also use essential cookies and secure session technologies to keep customers signed in, restore sessions after refresh, protect account access, and support authenticated storefront features. We use that data to authenticate customers, process purchases, send requested emails, and improve the experience through analytics and merchandising tools.',
  termsLabel: 'Terms',
  termsContent:
    'By using EShop, you agree to provide accurate account and checkout information, use the storefront lawfully, and accept that essential cookies and secure session technologies are required for login-protected features to work correctly. You also accept that products, pricing, availability, reviews, and promotions may be updated by the business.',
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

interface CatalogBootstrapResponse {
  content: SiteContent;
  catalogVersion?: string | null;
}

interface CatalogVersionResponse {
  version: string | null;
}

const CONTENT_CACHE_KEY = 'eshop-office-site-content-cache';

const loadCachedContent = (): SiteContent | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const cached = localStorage.getItem(CONTENT_CACHE_KEY);
    if (!cached) {
      return null;
    }
    return mergeContentWithDefaults(JSON.parse(cached) as Partial<SiteContent>);
  } catch {
    localStorage.removeItem(CONTENT_CACHE_KEY);
    return null;
  }
};

const persistContent = (content: SiteContent) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(content));
  } catch {
    // Ignore storage issues
  }
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
  const [catalogVersion, setCatalogVersion] = useState<string | null>(null);

  const applyContent = useCallback((nextContent: Partial<SiteContent>, nextVersion?: string | null) => {
    const merged = mergeContentWithDefaults(nextContent);
    setContent(merged);
    persistContent(merged);
    if (nextVersion !== undefined) {
      setCatalogVersion(nextVersion ?? null);
    }
  }, []);

  const refreshContent = useCallback(async () => {
    try {
      const response = await apiRequestWithRetry<SiteContent>('/content');
      applyContent(response);
    } catch {
      const bootstrap = await apiRequestWithRetry<CatalogBootstrapResponse>('/catalog/bootstrap');
      applyContent(bootstrap.content, bootstrap.catalogVersion ?? null);
    }
  }, [applyContent]);

  useEffect(() => {
    const cached = loadCachedContent();
    if (cached) {
      setContent(cached);
    }
    void refreshContent();
  }, [refreshContent]);

  useEffect(() => {
    let isMounted = true;

    const syncIfChanged = async () => {
      try {
        const response = await apiRequest<CatalogVersionResponse>('/catalog/version');
        if (!isMounted) {
          return;
        }
        if (response.version && response.version !== catalogVersion) {
          await refreshContent();
          setCatalogVersion(response.version);
        }
      } catch {
        // Ignore polling failures
      }
    };

    const intervalId = window.setInterval(() => {
      void syncIfChanged();
    }, 15000);

    const handleFocus = () => {
      void syncIfChanged();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [catalogVersion, refreshContent]);

  const saveContent = async (nextContent: SiteContent) => {
    const response = await apiRequest<SiteContent>('/content', {
      method: 'PUT',
      token,
      body: JSON.stringify(nextContent),
    });
    applyContent(response);
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
