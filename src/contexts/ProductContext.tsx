import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { apiRequest, apiRequestWithRetry } from '../lib/api';
import { useAuth } from './AuthContext';

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  rating: number;
  reviews: number;
  stockQuantity: number;
  inStock: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
}

interface CatalogBootstrapResponse {
  products: Product[];
  categories: Category[];
  nextCursor?: number | null;
  catalogVersion?: string | null;
}

interface CatalogVersionResponse {
  version: string | null;
}

const normalizeProduct = (product: Product): Product => {
  const fallbackStockQuantity =
    typeof product.stockQuantity === 'number' && Number.isFinite(product.stockQuantity)
      ? product.stockQuantity
      : product.inStock
        ? 10
        : 0;

  const stockQuantity = Math.max(0, Math.trunc(fallbackStockQuantity));

  return {
    ...product,
    stockQuantity,
    inStock: stockQuantity > 0,
  };
};

interface ProductContextType {
  products: Product[];
  categories: Category[];
  featuredProducts: Product[];
  newArrivals: Product[];
  refreshProducts: () => Promise<void>;
  updateProduct: (id: number, updates: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogVersion, setCatalogVersion] = useState<string | null>(null);

  const loadRemainingProducts = useCallback(async (cursor: number | null | undefined, seedProducts: Product[]) => {
    let nextCursor = cursor ?? null;
    let allProducts = [...seedProducts];

    while (nextCursor !== null) {
      const page = await apiRequestWithRetry<{ products: Product[]; nextCursor: number | null }>(`/products?limit=200&cursor=${nextCursor}`);
      allProducts = [...allProducts, ...page.products.map(normalizeProduct)];
      nextCursor = page.nextCursor ?? null;
      setProducts(allProducts);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    const response = await apiRequestWithRetry<CatalogBootstrapResponse>('/catalog/bootstrap');
    const normalizedProducts = response.products.map(normalizeProduct);
    setProducts(normalizedProducts);
    setCategories(response.categories);
    setCatalogVersion(response.catalogVersion ?? null);
    if (response.nextCursor !== null && response.nextCursor !== undefined) {
      void loadRemainingProducts(response.nextCursor, normalizedProducts);
    }
  }, [loadRemainingProducts]);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  useEffect(() => {
    let isMounted = true;

    const syncIfChanged = async () => {
      try {
        const response = await apiRequest<CatalogVersionResponse>('/catalog/version');
        if (!isMounted) {
          return;
        }
        if (response.version && response.version !== catalogVersion) {
          await refreshProducts();
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

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [catalogVersion, refreshProducts]);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const createdProduct = await apiRequest<Product>('/products', {
      method: 'POST',
      token,
      body: JSON.stringify(product),
    });
    setProducts((currentProducts) => [...currentProducts, normalizeProduct(createdProduct)]);
    await refreshProducts();
  };

  const updateProduct = async (id: number, updates: Partial<Product>) => {
    const updatedProduct = normalizeProduct(await apiRequest<Product>(`/products/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(updates),
    }));
    setProducts((currentProducts) =>
      currentProducts.map((product) => (product.id === id ? updatedProduct : product))
    );
    return updatedProduct;
  };

  const deleteProduct = async (id: number) => {
    await apiRequest<{ status: string }>(`/products/${id}`, {
      method: 'DELETE',
      token,
    });
    await refreshProducts();
  };

  const addCategory = async (category: Category) => {
    await apiRequest<Category>('/categories', {
      method: 'POST',
      token,
      body: JSON.stringify(category),
    });
    await refreshProducts();
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    await apiRequest<Category>(`/categories/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(updates),
    });
    await refreshProducts();
  };

  const deleteCategory = async (id: string) => {
    await apiRequest<{ status: string }>(`/categories/${id}`, {
      method: 'DELETE',
      token,
    });
    await refreshProducts();
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        featuredProducts: products.filter((product) => product.isFeatured),
        newArrivals: products.filter((product) => product.isNewArrival),
        refreshProducts,
        updateProduct,
        deleteProduct,
        addProduct,
        addCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
