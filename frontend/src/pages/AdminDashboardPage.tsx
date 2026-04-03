import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAdminProductById } from '../api/admin';
import { ErrorState } from '../components/feedback/ErrorState';
import { useAdmin } from '../hooks/useAdmin';
import { useShowToast } from '../hooks/useToast';
import { formatTzs } from '../lib/currency';
import { queryKeys } from '../lib/queryKeys';
import type { ProductCondition, ProductType, StockStatus } from '../types/api';
import type { AdminProductDetail, AdminProductPayload, AdminProductSpecInput } from '../types/admin';
import { toUserMessage } from '../utils/errors';

type VisibilityFilter = 'all' | 'visible' | 'hidden';
type SortOption = 'updated_desc' | 'price_desc' | 'price_asc' | 'title_asc';
type FormMode = 'create' | 'edit';
type FeaturedTag = NonNullable<AdminProductPayload['featured_tag']>;
type SpecValueKind = 'text' | 'number' | 'bool' | 'json';

interface ProductFormSpec {
  id: string;
  spec_key: string;
  value_kind: SpecValueKind;
  value_text: string;
  value_number: string;
  value_bool: boolean;
  value_json: string;
  unit: string;
  sort_order: number;
}

interface ProductFormState {
  sku: string;
  slug: string;
  title: string;
  product_type: ProductType;
  brand: string;
  model_name: string;
  condition: ProductCondition;
  stock_status: StockStatus;
  estimated_price_tzs: string;
  short_description: string;
  long_description: string;
  warranty_text: string;
  is_visible: boolean;
  is_featured: boolean;
  featured_tag: FeaturedTag | '';
  specs: ProductFormSpec[];
}

const productTypeOptions: Array<{ value: ProductType | 'all'; label: string }> = [
  { value: 'all', label: 'All product types' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'component', label: 'Component' },
  { value: 'accessory', label: 'Accessory' }
];

const conditionOptions: Array<{ value: ProductCondition; label: string }> = [
  { value: 'new', label: 'Brand new' },
  { value: 'imported_used', label: 'Imported used' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'custom_build', label: 'Custom build' }
];

const stockStatusOptions: Array<{ value: StockStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All stock states' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'low_stock', label: 'Low stock' },
  { value: 'build_on_request', label: 'Build on request' },
  { value: 'incoming_stock', label: 'Incoming stock' },
  { value: 'sold_out', label: 'Sold out' }
];

const featuredTagOptions: Array<{ value: FeaturedTag; label: string }> = [
  { value: 'best_seller', label: 'Best seller' },
  { value: 'hot_deal', label: 'Hot deal' },
  { value: 'recommended', label: 'Recommended' }
];

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'updated_desc', label: 'Recently updated' },
  { value: 'price_desc', label: 'Highest price' },
  { value: 'price_asc', label: 'Lowest price' },
  { value: 'title_asc', label: 'A to Z title' }
];

const specOptions: Array<{ key: string; label: string; defaultKind: SpecValueKind }> = [
  { key: 'cpu_model', label: 'CPU model', defaultKind: 'text' },
  { key: 'cpu_socket', label: 'CPU socket', defaultKind: 'text' },
  { key: 'gpu_model', label: 'GPU model', defaultKind: 'text' },
  { key: 'ram_gb', label: 'RAM (GB)', defaultKind: 'number' },
  { key: 'ram_type', label: 'RAM type', defaultKind: 'text' },
  { key: 'storage_gb', label: 'Storage (GB)', defaultKind: 'number' },
  { key: 'storage_type', label: 'Storage type', defaultKind: 'text' },
  { key: 'screen_size_in', label: 'Screen size (in)', defaultKind: 'number' },
  { key: 'refresh_rate_hz', label: 'Refresh rate (Hz)', defaultKind: 'number' },
  { key: 'motherboard_socket', label: 'Motherboard socket', defaultKind: 'text' },
  { key: 'motherboard_ram_type', label: 'Motherboard RAM type', defaultKind: 'text' },
  { key: 'motherboard_max_ram_gb', label: 'Motherboard max RAM (GB)', defaultKind: 'number' },
  { key: 'gpu_length_mm', label: 'GPU length (mm)', defaultKind: 'number' },
  { key: 'case_max_gpu_length_mm', label: 'Case max GPU length (mm)', defaultKind: 'number' },
  { key: 'psu_wattage', label: 'PSU wattage', defaultKind: 'number' },
  { key: 'estimated_system_wattage', label: 'Estimated system wattage', defaultKind: 'number' }
];

const defaultForm: ProductFormState = {
  sku: '',
  slug: '',
  title: '',
  product_type: 'desktop',
  brand: '',
  model_name: '',
  condition: 'new',
  stock_status: 'in_stock',
  estimated_price_tzs: '',
  short_description: '',
  long_description: '',
  warranty_text: '',
  is_visible: true,
  is_featured: false,
  featured_tag: '',
  specs: []
};

function createLocalId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function createSpecDraft(specKey?: string): ProductFormSpec {
  const selected = specOptions.find((entry) => entry.key === specKey) || specOptions[0];
  return {
    id: createLocalId(),
    spec_key: selected?.key || 'cpu_model',
    value_kind: selected?.defaultKind || 'text',
    value_text: '',
    value_number: '',
    value_bool: false,
    value_json: '',
    unit: '',
    sort_order: 0
  };
}

function specFromDetail(spec: AdminProductDetail['specs'][number]): ProductFormSpec {
  if (spec.value_number !== null && spec.value_number !== undefined) {
    return {
      id: createLocalId(),
      spec_key: spec.spec_key,
      value_kind: 'number',
      value_text: '',
      value_number: String(spec.value_number),
      value_bool: false,
      value_json: '',
      unit: spec.unit || '',
      sort_order: spec.sort_order
    };
  }

  if (spec.value_bool !== null && spec.value_bool !== undefined) {
    return {
      id: createLocalId(),
      spec_key: spec.spec_key,
      value_kind: 'bool',
      value_text: '',
      value_number: '',
      value_bool: spec.value_bool,
      value_json: '',
      unit: spec.unit || '',
      sort_order: spec.sort_order
    };
  }

  if (spec.value_json !== null && spec.value_json !== undefined) {
    return {
      id: createLocalId(),
      spec_key: spec.spec_key,
      value_kind: 'json',
      value_text: '',
      value_number: '',
      value_bool: false,
      value_json: JSON.stringify(spec.value_json),
      unit: spec.unit || '',
      sort_order: spec.sort_order
    };
  }

  return {
    id: createLocalId(),
    spec_key: spec.spec_key,
    value_kind: 'text',
    value_text: spec.value_text || '',
    value_number: '',
    value_bool: false,
    value_json: '',
    unit: spec.unit || '',
    sort_order: spec.sort_order
  };
}

function formFromProduct(detail: AdminProductDetail): ProductFormState {
  return {
    sku: detail.sku,
    slug: detail.slug,
    title: detail.title,
    product_type: detail.product_type,
    brand: detail.brand,
    model_name: detail.model_name,
    condition: detail.condition,
    stock_status: detail.stock_status,
    estimated_price_tzs: String(detail.estimated_price_tzs),
    short_description: detail.short_description || '',
    long_description: detail.long_description || '',
    warranty_text: detail.warranty_text || '',
    is_visible: detail.is_visible,
    is_featured: detail.is_featured,
    featured_tag: (detail.featured_tag as FeaturedTag | null) || '',
    specs: (detail.specs || []).map(specFromDetail)
  };
}

function validateForm(form: ProductFormState): string[] {
  const errors: string[] = [];

  if (!form.title.trim()) errors.push('Product title is required.');
  if (!form.sku.trim()) errors.push('SKU is required.');
  if (!form.brand.trim()) errors.push('Brand is required.');
  if (!form.model_name.trim()) errors.push('Model name is required.');
  if (!form.slug.trim()) {
    errors.push('Slug is required.');
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
    errors.push('Slug must use lowercase letters, numbers, and hyphens only.');
  }

  const parsedPrice = Number.parseInt(form.estimated_price_tzs, 10);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    errors.push('Estimated price must be a positive number in TZS.');
  }

  form.specs.forEach((spec, index) => {
    if (!spec.spec_key.trim()) {
      errors.push(`Spec #${index + 1} is missing a key.`);
      return;
    }

    if (spec.value_kind === 'text' && !spec.value_text.trim()) {
      errors.push(`Spec #${index + 1} needs a text value.`);
    }

    if (spec.value_kind === 'number') {
      const value = Number(spec.value_number);
      if (!Number.isFinite(value)) {
        errors.push(`Spec #${index + 1} needs a valid number value.`);
      }
    }

    if (spec.value_kind === 'json') {
      if (!spec.value_json.trim()) {
        errors.push(`Spec #${index + 1} needs valid JSON.`);
      } else {
        try {
          JSON.parse(spec.value_json);
        } catch {
          errors.push(`Spec #${index + 1} has invalid JSON.`);
        }
      }
    }
  });

  return errors;
}

function payloadFromForm(form: ProductFormState): AdminProductPayload {
  const specs: AdminProductSpecInput[] = form.specs.map((spec) => {
    const base: AdminProductSpecInput = {
      spec_key: spec.spec_key,
      unit: spec.unit.trim() || undefined,
      sort_order: spec.sort_order
    };

    if (spec.value_kind === 'number') {
      return {
        ...base,
        value_number: Number(spec.value_number)
      };
    }

    if (spec.value_kind === 'bool') {
      return {
        ...base,
        value_bool: spec.value_bool
      };
    }

    if (spec.value_kind === 'json') {
      return {
        ...base,
        value_json: JSON.parse(spec.value_json) as Record<string, unknown>
      };
    }

    return {
      ...base,
      value_text: spec.value_text.trim()
    };
  });

  return {
    sku: form.sku.trim(),
    slug: form.slug.trim(),
    title: form.title.trim(),
    product_type: form.product_type,
    brand: form.brand.trim(),
    model_name: form.model_name.trim(),
    condition: form.condition,
    stock_status: form.stock_status,
    estimated_price_tzs: Number.parseInt(form.estimated_price_tzs, 10),
    short_description: form.short_description.trim() || undefined,
    long_description: form.long_description.trim() || undefined,
    warranty_text: form.warranty_text.trim() || null,
    is_visible: form.is_visible,
    is_featured: form.is_featured,
    featured_tag: form.is_featured ? (form.featured_tag || null) : null,
    specs
  };
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const {
    admin,
    token,
    productsQuery,
    quotesQuery,
    createProductMutation,
    updateProductMutation,
    duplicateProductMutation,
    archiveProductMutation,
    publishProductMutation,
    createUploadUrlMutation,
    finalizeUploadMutation,
    logout
  } = useAdmin();

  const products = productsQuery.data?.data || [];
  const quotes = quotesQuery.data?.data || [];

  const [formMode, setFormMode] = useState<FormMode>('create');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const hydratedProductRef = useRef<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(defaultForm);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ProductType | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [stockFilter, setStockFilter] = useState<StockStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated_desc');
  const [actionProductId, setActionProductId] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  const productDetailQuery = useQuery({
    queryKey: selectedProductId ? queryKeys.admin.productDetail(selectedProductId) : ['admin', 'product', 'draft'],
    queryFn: () => getAdminProductById(selectedProductId || '', token || ''),
    enabled: Boolean(selectedProductId && token),
    staleTime: 1000 * 30,
    retry: 1
  });

  useEffect(() => {
    if (!selectedProductId || !productDetailQuery.data?.data) return;
    if (hydratedProductRef.current === selectedProductId) return;

    setForm(formFromProduct(productDetailQuery.data.data));
    setValidationErrors([]);
    hydratedProductRef.current = selectedProductId;
  }, [selectedProductId, productDetailQuery.data?.data]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const visibleProducts = products.filter((product) => {
      if (typeFilter !== 'all' && product.product_type !== typeFilter) return false;
      if (stockFilter !== 'all' && product.stock_status !== stockFilter) return false;
      if (visibilityFilter === 'visible' && !product.is_visible) return false;
      if (visibilityFilter === 'hidden' && product.is_visible) return false;

      if (!normalizedSearch) return true;
      const haystack = `${product.title} ${product.sku} ${product.brand} ${product.model_name}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });

    const sorted = [...visibleProducts];
    sorted.sort((left, right) => {
      if (sortBy === 'price_desc') return right.estimated_price_tzs - left.estimated_price_tzs;
      if (sortBy === 'price_asc') return left.estimated_price_tzs - right.estimated_price_tzs;
      if (sortBy === 'title_asc') return left.title.localeCompare(right.title);
      return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
    });

    return sorted;
  }, [products, searchTerm, typeFilter, visibilityFilter, stockFilter, sortBy]);

  const visibleCount = products.filter((product) => product.is_visible).length;
  const hiddenCount = products.length - visibleCount;
  const lowStockCount = products.filter((product) => product.stock_status === 'low_stock').length;
  const newQuotesCount = quotes.filter((quote) => quote.status === 'new').length;

  const startCreateMode = () => {
    setFormMode('create');
    setSelectedProductId(null);
    hydratedProductRef.current = null;
    setValidationErrors([]);
    setForm(defaultForm);
  };

  const startEditMode = (productId: string) => {
    setFormMode('edit');
    setSelectedProductId(productId);
    hydratedProductRef.current = null;
    setValidationErrors([]);
  };

  const updateForm = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const updateSpec = (specId: string, patch: Partial<ProductFormSpec>) => {
    setForm((previous) => ({
      ...previous,
      specs: previous.specs.map((entry) => {
        if (entry.id !== specId) return entry;
        return { ...entry, ...patch };
      })
    }));
  };

  const addSpec = () => {
    setForm((previous) => ({ ...previous, specs: [...previous.specs, createSpecDraft()] }));
  };

  const removeSpec = (specId: string) => {
    setForm((previous) => ({ ...previous, specs: previous.specs.filter((spec) => spec.id !== specId) }));
  };

  const handleSubmitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateForm(form);
    if (errors.length > 0) {
      setValidationErrors(errors);
      showToast({ title: 'Please fix form errors', description: 'Some required fields are still missing.', variant: 'error' });
      return;
    }

    const payload = payloadFromForm(form);

    setIsSubmittingForm(true);
    try {
      if (formMode === 'edit' && selectedProductId) {
        await updateProductMutation.mutateAsync({ productId: selectedProductId, payload });
        await queryClient.invalidateQueries({ queryKey: queryKeys.admin.productDetail(selectedProductId) });
      } else {
        const created = await createProductMutation.mutateAsync(payload);
        setFormMode('edit');
        setSelectedProductId(created.data.id);
        hydratedProductRef.current = null;
        await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products });
      }
      setValidationErrors([]);
    } catch {
      // Mutation-level error toasts are shown by the admin hook and form state is preserved.
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDuplicate = async (productId: string) => {
    setActionProductId(productId);
    try {
      const duplicated = await duplicateProductMutation.mutateAsync(productId);
      startEditMode(duplicated.data.id);
    } catch {
      // Error toast handled in hook.
    } finally {
      setActionProductId(null);
    }
  };

  const handleVisibilityToggle = async (productId: string, isVisible: boolean) => {
    setActionProductId(productId);
    try {
      if (isVisible) {
        await archiveProductMutation.mutateAsync(productId);
      } else {
        await publishProductMutation.mutateAsync(productId);
      }
    } catch {
      // Error toast handled in hook.
    } finally {
      setActionProductId(null);
    }
  };

  const uploadToSignedUrl = async (url: string, file: File) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    });

    if (!response.ok) {
      throw new Error('Upload request failed');
    }
  };

  const handleMediaUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (!files.length) return;
    if (!selectedProductId) {
      showToast({
        title: 'Save product first',
        description: 'Create the product first, then upload its gallery images.',
        variant: 'info'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    let completedCount = 0;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        showToast({ title: 'Unsupported file', description: `${file.name} is not an image.`, variant: 'error' });
        continue;
      }

      if (file.size > 8 * 1024 * 1024) {
        showToast({ title: 'Image too large', description: `${file.name} exceeds the 8MB upload limit.`, variant: 'error' });
        continue;
      }

      try {
        const [original, thumb, full] = await Promise.all([
          createUploadUrlMutation.mutateAsync({
            owner_type: 'product',
            owner_id: selectedProductId,
            file_name: file.name,
            content_type: file.type,
            variant: 'original'
          }),
          createUploadUrlMutation.mutateAsync({
            owner_type: 'product',
            owner_id: selectedProductId,
            file_name: file.name,
            content_type: file.type,
            variant: 'thumb'
          }),
          createUploadUrlMutation.mutateAsync({
            owner_type: 'product',
            owner_id: selectedProductId,
            file_name: file.name,
            content_type: file.type,
            variant: 'full'
          })
        ]);

        await Promise.all([
          uploadToSignedUrl(original.data.signed_url, file),
          uploadToSignedUrl(thumb.data.signed_url, file),
          uploadToSignedUrl(full.data.signed_url, file)
        ]);

        await finalizeUploadMutation.mutateAsync({
          owner_type: 'product',
          owner_id: selectedProductId,
          original_path: original.data.path,
          thumb_path: thumb.data.path,
          full_path: full.data.path,
          size_bytes: file.size,
          alt_text: form.title || file.name,
          is_primary: false,
          sort_order: 0
        });

        completedCount += 1;
        setUploadProgress({ current: completedCount, total: files.length });
      } catch (error) {
        showToast({
          title: 'Image upload failed',
          description: toUserMessage(error, `Could not upload ${file.name}. Please retry.`),
          variant: 'error'
        });
      }
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.productDetail(selectedProductId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products });

    if (completedCount > 0) {
      showToast({
        title: 'Upload complete',
        description: `${completedCount} image${completedCount > 1 ? 's' : ''} added to this product.`,
        variant: 'success'
      });
    }

    setUploadProgress(null);
    setIsUploading(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title text-foreground">Admin Control Center</h1>
          <p className="mt-2 text-[13px] text-secondary">Signed in as {admin?.full_name || admin?.email || 'Administrator'}.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/shop"
            className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-foreground"
          >
            View Storefront
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primaryForeground"
          >
            Sign Out
          </button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Catalog size</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{products.length}</p>
          <p className="mt-1 text-xs text-secondary">Total products indexed</p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Visible products</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{visibleCount}</p>
          <p className="mt-1 text-xs text-secondary">Hidden: {hiddenCount}</p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Stock alerts</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{lowStockCount}</p>
          <p className="mt-1 text-xs text-secondary">Products marked low stock</p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Quote inbox</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{newQuotesCount}</p>
          <p className="mt-1 text-xs text-secondary">New quote requests</p>
        </article>
      </section>

      {productsQuery.isError ? <ErrorState title="Products unavailable" description="Could not load admin products list." /> : null}
      {quotesQuery.isError ? <ErrorState title="Quotes unavailable" description="Could not load admin quotes list." /> : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Product Catalog</h2>
              <p className="text-xs text-secondary">Search, filter, and take actions without leaving this page.</p>
            </div>

            <button
              type="button"
              onClick={startCreateMode}
              className="inline-flex min-h-10 items-center rounded-full border border-border px-4 text-xs font-semibold text-foreground"
            >
              Create New Product
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1 xl:col-span-2">
              <span className="text-xs font-medium text-secondary">Search</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Title, SKU, brand"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-secondary">Type</span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as ProductType | 'all')}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
              >
                {productTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-secondary">Visibility</span>
              <select
                value={visibilityFilter}
                onChange={(event) => setVisibilityFilter(event.target.value as VisibilityFilter)}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
              >
                <option value="all">All visibility states</option>
                <option value="visible">Visible in storefront</option>
                <option value="hidden">Hidden from storefront</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-secondary">Stock</span>
              <select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value as StockStatus | 'all')}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
              >
                {stockStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 md:col-span-2 xl:col-span-5">
              <span className="text-xs font-medium text-secondary">Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            {productsQuery.isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={`admin-products-skeleton-${index}`} className="h-10 animate-pulse rounded-lg border border-border bg-background" />
                ))}
              </div>
            ) : null}

            {!productsQuery.isLoading && filteredProducts.length === 0 ? (
              <p className="p-4 text-sm text-muted">No products match your current filters.</p>
            ) : null}

            {filteredProducts.length > 0 ? (
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-background">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Visibility</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.slice(0, 30).map((product) => {
                    const isSelected = product.id === selectedProductId;
                    const isRowBusy = actionProductId === product.id;

                    return (
                      <tr key={product.id} className={isSelected ? 'bg-background/80' : undefined}>
                        <td className="px-3 py-3 align-top">
                          <p className="font-semibold text-foreground">{product.title}</p>
                          <p className="text-xs text-secondary">{product.brand} {product.model_name} • {product.sku}</p>
                        </td>
                        <td className="px-3 py-3 align-top text-muted">{product.product_type}</td>
                        <td className="px-3 py-3 align-top">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${product.is_visible ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'}`}>
                            {product.is_visible ? 'Visible' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top text-muted">{product.stock_status}</td>
                        <td className="px-3 py-3 align-top font-medium text-foreground">{formatTzs(product.estimated_price_tzs)}</td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEditMode(product.id)}
                              className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={() => void handleDuplicate(product.id)}
                              className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={() => void handleVisibilityToggle(product.id, product.is_visible)}
                              className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {product.is_visible ? 'Archive' : 'Publish'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {formMode === 'edit' ? 'Edit Product' : 'Create Product'}
              </h2>
              <p className="text-xs text-secondary">
                {formMode === 'edit'
                  ? 'Update details, specs, and media for this product.'
                  : 'Fill in key details and publish when ready.'}
              </p>
            </div>
            <button
              type="button"
              onClick={startCreateMode}
              className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground"
            >
              Reset Form
            </button>
          </div>

          {formMode === 'edit' && selectedProductId && productDetailQuery.isLoading ? (
            <p className="mb-3 text-xs text-muted">Loading selected product details...</p>
          ) : null}

          {formMode === 'edit' && selectedProductId && productDetailQuery.isError ? (
            <ErrorState title="Unable to load product" description="Please retry selecting the product from the table." />
          ) : null}

          {validationErrors.length > 0 ? (
            <div className="mb-3 rounded-xl border border-red-300 bg-red-50/90 p-3 text-xs text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
              {validationErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}

          <form className="space-y-3" onSubmit={(event) => void handleSubmitProduct(event)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium text-secondary">Product title</span>
                <input
                  value={form.title}
                  onChange={(event) => updateForm('title', event.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  placeholder="Example: YS Creator Desktop Ryzen 7"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-secondary">SKU</span>
                <input
                  value={form.sku}
                  onChange={(event) => updateForm('sku', event.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  placeholder="YS-DESK-001"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-secondary">Slug</span>
                <div className="flex gap-2">
                  <input
                    value={form.slug}
                    onChange={(event) => updateForm('slug', event.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                    placeholder="ys-creator-desktop-ryzen-7"
                  />
                  <button
                    type="button"
                    onClick={() => updateForm('slug', slugify(form.title || form.sku))}
                    className="rounded-full border border-border px-3 text-xs font-semibold text-foreground"
                  >
                    Auto-generate
                  </button>
                </div>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-secondary">Product type</span>
                <select
                  value={form.product_type}
                  onChange={(event) => updateForm('product_type', event.target.value as ProductType)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                >
                  {productTypeOptions.filter((option) => option.value !== 'all').map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-secondary">Condition</span>
                <select
                  value={form.condition}
                  onChange={(event) => updateForm('condition', event.target.value as ProductCondition)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                >
                  {conditionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-secondary">Brand</span>
                <input
                  value={form.brand}
                  onChange={(event) => updateForm('brand', event.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  placeholder="ASUS, Lenovo, YS Custom..."
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-secondary">Model name</span>
                <input
                  value={form.model_name}
                  onChange={(event) => updateForm('model_name', event.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  placeholder="Predator G3"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-secondary">Stock status</span>
                <select
                  value={form.stock_status}
                  onChange={(event) => updateForm('stock_status', event.target.value as StockStatus)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                >
                  {stockStatusOptions.filter((option) => option.value !== 'all').map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-secondary">Estimated price (TZS)</span>
                <input
                  type="number"
                  min={0}
                  value={form.estimated_price_tzs}
                  onChange={(event) => updateForm('estimated_price_tzs', event.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  placeholder="2500000"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-secondary">Short description</span>
                <input
                  value={form.short_description}
                  onChange={(event) => updateForm('short_description', event.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  placeholder="One-line highlight for listing cards"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-secondary">Long description</span>
                <textarea
                  value={form.long_description}
                  onChange={(event) => updateForm('long_description', event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
                  placeholder="Detailed product narrative for the product page"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-secondary">Warranty text</span>
                <input
                  value={form.warranty_text}
                  onChange={(event) => updateForm('warranty_text', event.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  placeholder="12 months warranty"
                />
              </label>
            </div>

            <div className="grid gap-2 rounded-xl border border-border bg-background/60 p-3">
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.is_visible}
                  onChange={(event) => updateForm('is_visible', event.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Show this product in the storefront
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(event) => updateForm('is_featured', event.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Mark as featured product
              </label>
              {form.is_featured ? (
                <label className="space-y-1">
                  <span className="text-xs font-medium text-secondary">Featured badge</span>
                  <select
                    value={form.featured_tag}
                    onChange={(event) => updateForm('featured_tag', event.target.value as FeaturedTag | '')}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  >
                    <option value="">Select badge</option>
                    {featuredTagOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-background/60 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Technical specs</h3>
                  <p className="text-xs text-secondary">Add or adjust structured specs used in product cards and comparisons.</p>
                </div>
                <button
                  type="button"
                  onClick={addSpec}
                  className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground"
                >
                  Add Spec
                </button>
              </div>

              {form.specs.length === 0 ? <p className="text-xs text-muted">No specs added yet.</p> : null}

              <div className="space-y-2">
                {form.specs.map((spec, index) => (
                  <div key={spec.id} className="space-y-2 rounded-xl border border-border bg-surface p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-secondary">Spec #{index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeSpec(spec.id)}
                        className="rounded-full border border-border px-2 py-1 text-[11px] font-semibold text-foreground"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <label className="space-y-1 sm:col-span-2">
                        <span className="text-xs font-medium text-secondary">Spec key</span>
                        <select
                          value={spec.spec_key}
                          onChange={(event) => {
                            const selected = specOptions.find((entry) => entry.key === event.target.value);
                            updateSpec(spec.id, {
                              spec_key: event.target.value,
                              value_kind: selected?.defaultKind || spec.value_kind
                            });
                          }}
                          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                        >
                          {specOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-medium text-secondary">Value type</span>
                        <select
                          value={spec.value_kind}
                          onChange={(event) => updateSpec(spec.id, { value_kind: event.target.value as SpecValueKind })}
                          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="bool">True/false</option>
                          <option value="json">JSON</option>
                        </select>
                      </label>
                    </div>

                    {spec.value_kind === 'text' ? (
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-secondary">Text value</span>
                        <input
                          value={spec.value_text}
                          onChange={(event) => updateSpec(spec.id, { value_text: event.target.value })}
                          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                          placeholder="e.g. Intel Core i7"
                        />
                      </label>
                    ) : null}

                    {spec.value_kind === 'number' ? (
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-secondary">Number value</span>
                        <input
                          type="number"
                          value={spec.value_number}
                          onChange={(event) => updateSpec(spec.id, { value_number: event.target.value })}
                          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                          placeholder="e.g. 32"
                        />
                      </label>
                    ) : null}

                    {spec.value_kind === 'bool' ? (
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-secondary">Boolean value</span>
                        <select
                          value={String(spec.value_bool)}
                          onChange={(event) => updateSpec(spec.id, { value_bool: event.target.value === 'true' })}
                          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                        >
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </select>
                      </label>
                    ) : null}

                    {spec.value_kind === 'json' ? (
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-secondary">JSON value</span>
                        <textarea
                          rows={3}
                          value={spec.value_json}
                          onChange={(event) => updateSpec(spec.id, { value_json: event.target.value })}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
                          placeholder='{"key":"value"}'
                        />
                      </label>
                    ) : null}

                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-secondary">Unit (optional)</span>
                        <input
                          value={spec.unit}
                          onChange={(event) => updateSpec(spec.id, { unit: event.target.value })}
                          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                          placeholder="GB, Hz, mm"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-secondary">Sort order</span>
                        <input
                          type="number"
                          value={spec.sort_order}
                          onChange={(event) => updateSpec(spec.id, { sort_order: Number(event.target.value) || 0 })}
                          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-background/60 p-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Product media</h3>
                <p className="text-xs text-secondary">Upload product images after the product is saved.</p>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                disabled={!selectedProductId || isUploading}
                onChange={(event) => void handleMediaUpload(event)}
                className="block w-full text-xs text-secondary file:mr-3 file:rounded-full file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground"
              />

              {!selectedProductId ? (
                <p className="text-xs text-muted">Save product first to enable uploads.</p>
              ) : null}

              {uploadProgress ? (
                <p className="text-xs text-secondary">Uploading {uploadProgress.current} of {uploadProgress.total} image(s)...</p>
              ) : null}

              {productDetailQuery.data?.data.media?.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {productDetailQuery.data.data.media.slice(0, 6).map((media) => (
                    <img
                      key={media.id}
                      src={media.thumb_url || media.full_url || media.original_url}
                      alt={media.alt_text || form.title || 'Product image'}
                      className="h-20 w-full rounded-lg border border-border object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={isSubmittingForm}
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primaryForeground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingForm
                  ? 'Saving...'
                  : formMode === 'edit'
                    ? 'Save Product Changes'
                    : 'Create Product'}
              </button>

              {formMode === 'edit' && selectedProductId ? (
                <button
                  type="button"
                  onClick={() => void handleDuplicate(selectedProductId)}
                  className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-foreground"
                >
                  Duplicate Product
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Quotes ({quotes.length})</h2>
          {quotesQuery.isLoading ? <p className="text-xs text-muted">Loading...</p> : null}
        </div>

        {quotesQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`admin-quotes-skeleton-${index}`} className="h-10 animate-pulse rounded-lg border border-border bg-background" />
            ))}
          </div>
        ) : null}

        {quotes.length === 0 && !quotesQuery.isLoading ? (
          <p className="text-sm text-muted">No quotes returned by admin endpoint.</p>
        ) : null}

        {quotes.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2">Quote Code</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Estimated Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotes.slice(0, 12).map((quote) => (
                  <tr key={quote.id}>
                    <td className="px-3 py-2 text-foreground">{quote.quote_code}</td>
                    <td className="px-3 py-2 text-muted">{quote.customer_name}</td>
                    <td className="px-3 py-2 text-muted">{quote.status}</td>
                    <td className="px-3 py-2 text-foreground">{formatTzs(quote.estimated_total_tzs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
