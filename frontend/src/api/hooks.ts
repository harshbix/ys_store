import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { ApiResponse, Product, Cart, Build, Quote, BuildValidation } from '../types/api';

// --- PRODUCTS ---
export const useProducts = (params: Record<string, any>) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{items: Product[], total: number}>>('/products', { params });
      return data.data;
    }
  });
};

export const useProduct = (idOrSlug: string) => {
  return useQuery({
    queryKey: ['product', idOrSlug],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Product>>(`/products/${idOrSlug}`);
      return data.data;
    }
  });
};

// --- CART ---
export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Cart>>('/cart');
      return data.data;
    }
  });
};

export const useAddToCart = () => {
  const queryCache = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { item_type: 'product' | 'custom_build'; product_id?: string; custom_build_id?: string; quantity: number }) => {
      const { data } = await apiClient.post<ApiResponse<Cart>>('/cart/items', payload);
      return data.data;
    },
    onSuccess: () => queryCache.invalidateQueries({ queryKey: ['cart'] })
  });
};

export const useUpdateCartItem = () => {
  const queryCache = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string, quantity: number }) => {
      const { data } = await apiClient.patch<ApiResponse<Cart>>(`/cart/items/${itemId}`, { quantity });
      return data.data;
    },
    onSuccess: () => queryCache.invalidateQueries({ queryKey: ['cart'] })
  });
}

export const useRemoveFromCart = () => {
  const queryCache = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await apiClient.delete(`/cart/items/${itemId}`);
    },
    onSuccess: () => queryCache.invalidateQueries({ queryKey: ['cart'] })
  });
}

// --- BUILDS ---
export const useCreateBuild = () => {
  return useMutation({
    mutationFn: async (payload: { name?: string }) => {
      const { data } = await apiClient.post<ApiResponse<Build>>('/builds', payload);
      return data.data;
    }
  });
};

export const useGetBuild = (buildId: string | null) => {
  return useQuery({
    queryKey: ['build', buildId],
    enabled: !!buildId,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Build>>(`/builds/${buildId}`);
      return data.data;
    }
  });
};

export const useUpsertBuildItem = (buildId: string) => {
  const queryCache = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { product_id: string; component_type: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Build>>(`/builds/${buildId}/items`, payload);
      return data.data;
    },
    onSuccess: () => queryCache.invalidateQueries({ queryKey: ['build', buildId] })
  });
};

export const useRemoveBuildItem = (buildId: string) => {
  const queryCache = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await apiClient.delete(`/builds/${buildId}/items/${itemId}`);
    },
    onSuccess: () => queryCache.invalidateQueries({ queryKey: ['build', buildId] })
  });
};

export const useValidateBuild = (buildId: string) => {
  const queryCache = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiResponse<BuildValidation>>(`/builds/${buildId}/validate`, { auto_replace: false });
      return data.data;
    },
    onSuccess: () => queryCache.invalidateQueries({ queryKey: ['build', buildId] })
  });
};

export const useAddBuildToCart = (buildId: string) => {
  const queryCache = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiResponse<any>>(`/builds/${buildId}/add-to-cart`);
      return data.data;
    },
    onSuccess: () => queryCache.invalidateQueries({ queryKey: ['cart'] })
  });
};

// --- QUOTES ---
export const useCreateQuote = () => {
  return useMutation({
    mutationFn: async (payload: { customer_name: string; notes?: string; source_type: 'cart' | 'build'; source_id: string; quote_type?: 'laptop' | 'desktop' | 'build' | 'upgrade' | 'warranty' | 'general'; idempotency_key?: string }) => {
      const { idempotency_key, ...body } = payload;
      const { data } = await apiClient.post<ApiResponse<Quote>>('/quotes', body, {
        headers: idempotency_key ? { 'Idempotency-Key': idempotency_key } : {}
      });
      return data.data;
    }
  });
};

export const useQuoteWhatsappClick = () => {
  return useMutation({
    mutationFn: async (quoteCode: string) => {
      await apiClient.post(`/quotes/${quoteCode}/whatsapp-click`);
    }
  });
};