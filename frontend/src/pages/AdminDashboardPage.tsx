import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAdminProductById } from '../api/admin';
import { Button } from '../components/ui/Button';
import { useAdmin } from '../hooks/useAdmin';
import { useShowToast } from '../hooks/useToast';
import { formatTzs } from '../lib/currency';
import { queryKeys } from '../lib/queryKeys';
import type { AdminFinalizeUploadPayload, AdminProductPayload, AdminProductSpecInput, AdminSignedUploadPayload } from '../types/admin';
import type { ProductCondition, ProductType } from '../types/api';
import { toUserMessage } from '../utils/errors';

type SimpleCategory = 'gaming_pc' | 'laptop' | 'desktop' | 'accessories';
type SimpleCondition = 'new' | 'used' | 'refurbished';

interface LocalPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

interface ProductPostForm {
  title: string;
  price: string;
  category: SimpleCategory;
  condition: SimpleCondition;
  keyInfo: string;
  description: string;
}

interface UploadProgressState {
  current: number;
  total: number;
  percent: number;
  fileName?: string;
}

interface ImageDimensions {
  width: number;
  height: number;
}

const defaultForm: ProductPostForm = {
  title: '',
  price: '',
  category: 'gaming_pc',
  condition: 'new',
  keyInfo: '',
  description: ''
};

const keyInfoSuggestions: Array<{ needle: string; suggestion: string }> = [
  { needle: 'i7', suggestion: 'Intel Core i7' },
  { needle: 'i5', suggestion: 'Intel Core i5' },
  { needle: 'i9', suggestion: 'Intel Core i9' },
  { needle: 'ryzen 5', suggestion: 'AMD Ryzen 5' },
  { needle: 'ryzen 7', suggestion: 'AMD Ryzen 7' },
  { needle: 'rtx 3060', suggestion: 'NVIDIA RTX 3060' },
  { needle: 'rtx 4060', suggestion: 'NVIDIA RTX 4060' }
];

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

function parsePrice(value: string): number {
  const onlyDigits = value.replace(/\D/g, '');
  return onlyDigits ? Number.parseInt(onlyDigits, 10) : 0;
}

function formatPricePreview(value: string): string {
  const parsed = parsePrice(value);
  if (!parsed) return '';
  return parsed.toLocaleString('en-US');
}

function mapCategoryToProductType(category: SimpleCategory): ProductType {
  if (category === 'laptop') return 'laptop';
  if (category === 'accessories') return 'accessory';
  return 'desktop';
}

function mapProductTypeToCategory(productType: ProductType, title: string): SimpleCategory {
  if (productType === 'laptop') return 'laptop';
  if (productType === 'accessory') return 'accessories';
  if (title.toLowerCase().includes('gaming')) return 'gaming_pc';
  return 'desktop';
}

function mapConditionToApi(condition: SimpleCondition): ProductCondition {
  if (condition === 'refurbished') return 'refurbished';
  return condition === 'used' ? 'imported_used' : 'new';
}

function mapConditionFromApi(condition: ProductCondition): SimpleCondition {
  if (condition === 'refurbished') return 'refurbished';
  return condition === 'new' ? 'new' : 'used';
}

function resolveImageContentType(file: File): string {
  if (file.type?.startsWith('image/')) return file.type;

  const extension = file.name.toLowerCase().split('.').pop();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'avif':
      return 'image/avif';
    default:
      return 'image/jpeg';
  }
}

async function readImageDimensions(file: File): Promise<ImageDimensions | null> {
  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(file);
    const localUrl = objectUrl;
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image read failed'));
      img.src = localUrl;
    });

    return { width: image.naturalWidth, height: image.naturalHeight };
  } catch {
    return null;
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

function buildSpecsFromKeyInfo(keyInfo: string): AdminProductSpecInput[] {
  // Backend validates spec keys against seeded definitions; keep key info in descriptions only.
  void keyInfo;
  return [];
}

function buildPayload(form: ProductPostForm, existingId?: string): AdminProductPayload {
  const title = form.title.trim();
  const slugBase = slugify(title) || slugify(`product-${Date.now()}`);
  const skuSeed = existingId ? existingId.slice(0, 6).toUpperCase() : Date.now().toString().slice(-6);

  const longDescription = form.description.trim();
  const shortDescription = form.keyInfo.trim();

  return {
    sku: `YS-${skuSeed}`,
    slug: slugBase,
    title,
    product_type: mapCategoryToProductType(form.category),
    brand: 'Unknown',
    model_name: title,
    condition: mapConditionToApi(form.condition),
    stock_status: 'in_stock',
    estimated_price_tzs: parsePrice(form.price),
    short_description: shortDescription || undefined,
    long_description: longDescription || undefined,
    warranty_text: null,
    is_visible: true,
    is_featured: false,
    featured_tag: null,
    specs: buildSpecsFromKeyInfo(form.keyInfo)
  };
}

async function uploadToSignedUrl(url: string, file: File, onProgress?: (percent: number) => void) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', resolveImageContentType(file));

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress?.(Math.min(100, Math.max(0, percent)));
    };

    xhr.onerror = () => reject(new Error('Upload request failed'));
    xhr.onabort = () => reject(new Error('Upload request cancelled'));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error('Upload request failed'));
    };

    xhr.send(file);
  });
}

async function uploadToSignedUrlWithRetry(url: string, file: File, onProgress?: (percent: number) => void) {
  let attempts = 0;
  while (attempts < 2) {
    try {
      await uploadToSignedUrl(url, file, onProgress);
      return;
    } catch (error) {
      attempts += 1;
      if (attempts >= 2) {
        throw error;
      }
    }
  }
}

function getMatchedSuggestions(value: string): string[] {
  const normalized = value.toLowerCase();
  if (!normalized.trim()) return [];

  return keyInfoSuggestions
    .filter((entry) => normalized.includes(entry.needle))
    .map((entry) => entry.suggestion)
    .filter((suggestion, index, arr) => arr.indexOf(suggestion) === index);
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const {
    admin,
    token,
    productsQuery,
    createProductMutation,
    updateProductMutation,
    archiveProductMutation,
    createUploadUrlMutation,
    finalizeUploadMutation,
    logout
  } = useAdmin();

  const products = productsQuery.data?.data || [];

  const [form, setForm] = useState<ProductPostForm>(defaultForm);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isDropzoneActive, setIsDropzoneActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null);
  const [cardImages, setCardImages] = useState<Record<string, string>>({});

  const activeProducts = useMemo(() => products.filter((product) => product.is_visible), [products]);
  const matchedSuggestions = useMemo(() => getMatchedSuggestions(form.keyInfo), [form.keyInfo]);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, [photos]);

  useEffect(() => {
    if (products.length === 0) return;

    const nextEntries = products
      .filter((product) => product.is_visible)
      .map((product) => {
        const media = Array.isArray(product.media) ? product.media : [];
        const primary = media.find((item) => item.is_primary) || media[0];
        const url = primary?.thumb_url || primary?.full_url || primary?.original_url || null;
        return url ? [product.id, url] : null;
      })
      .filter(Boolean) as Array<[string, string]>;

    if (nextEntries.length === 0) return;

    setCardImages((previous) => {
      const next = { ...previous };
      for (const [productId, url] of nextEntries) {
        next[productId] = url;
      }
      return next;
    });
  }, [products]);

  const updateForm = <K extends keyof ProductPostForm>(key: K, value: ProductPostForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addPhotos = (files: File[]) => {
    const accepted: LocalPhoto[] = [];

    for (const file of files) {
      const contentType = resolveImageContentType(file);
      if (!contentType.startsWith('image/')) {
        showToast({ title: 'Unsupported file', description: `${file.name} is not an image.`, variant: 'error' });
        continue;
      }

      if (file.size > 8 * 1024 * 1024) {
        showToast({ title: 'Image too large', description: `${file.name} is over 8MB.`, variant: 'error' });
        continue;
      }

      accepted.push({
        id: createLocalId(),
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }

    if (accepted.length > 0) {
      setPhotos((prev) => [...prev, ...accepted]);
    }
  };

  const handlePhotoInput = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    addPhotos(files);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDropzoneActive(false);
    const files = Array.from(event.dataTransfer.files || []);
    addPhotos(files);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((photo) => photo.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((photo) => photo.id !== id);
    });
  };

  const movePhoto = (id: string, direction: 'left' | 'right') => {
    setPhotos((prev) => {
      const index = prev.findIndex((photo) => photo.id === id);
      if (index < 0) return prev;
      const nextIndex = direction === 'left' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy;
    });
  };

  const uploadPhotosForProduct = async (productId: string, title: string) => {
    if (!photos.length) return;

    let completedCount = 0;
    setUploadProgress({ current: 0, total: photos.length, percent: 0 });

    for (const [index, photo] of photos.entries()) {
      const file = photo.file;
      const contentType = resolveImageContentType(file);
      const dimensions = await readImageDimensions(file);

      const variantProgress = { original: 0, thumb: 0, full: 0 };
      const pushProgress = () => {
        const fileProgress = Math.round((variantProgress.original + variantProgress.thumb + variantProgress.full) / 3);
        const totalPercent = Math.round(((completedCount + fileProgress / 100) / photos.length) * 100);
        setUploadProgress({
          current: completedCount,
          total: photos.length,
          percent: Math.min(100, Math.max(0, totalPercent)),
          fileName: file.name
        });
      };

      const createPayload = (variant: AdminSignedUploadPayload['variant']): AdminSignedUploadPayload => ({
        owner_type: 'product',
        owner_id: productId,
        file_name: file.name,
        content_type: contentType,
        variant
      });

      const original = await createUploadUrlMutation.mutateAsync(createPayload('original'));
      const thumb = await createUploadUrlMutation.mutateAsync(createPayload('thumb'));
      const full = await createUploadUrlMutation.mutateAsync(createPayload('full'));

      await uploadToSignedUrlWithRetry(original.data.signed_url, file, (percent) => {
        variantProgress.original = percent;
        pushProgress();
      });
      await uploadToSignedUrlWithRetry(thumb.data.signed_url, file, (percent) => {
        variantProgress.thumb = percent;
        pushProgress();
      });
      await uploadToSignedUrlWithRetry(full.data.signed_url, file, (percent) => {
        variantProgress.full = percent;
        pushProgress();
      });

      const finalizePayload: AdminFinalizeUploadPayload = {
        owner_type: 'product',
        owner_id: productId,
        original_path: original.data.path,
        thumb_path: thumb.data.path,
        full_path: full.data.path,
        width: dimensions?.width,
        height: dimensions?.height,
        size_bytes: file.size,
        alt_text: title,
        is_primary: index === 0,
        sort_order: index
      };

      await finalizeUploadMutation.mutateAsync(finalizePayload);
      completedCount += 1;
      setUploadProgress({ current: completedCount, total: photos.length, percent: 100, fileName: file.name });
    }
  };

  const resetForm = () => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    setPhotos([]);
    setForm(defaultForm);
    setEditingProductId(null);
    setUploadProgress(null);
  };

  const handlePostProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim()) {
      showToast({ title: 'Please enter product name', variant: 'error' });
      return;
    }

    if (parsePrice(form.price) <= 0) {
      showToast({ title: 'Please enter price', variant: 'error' });
      return;
    }

    if (!editingProductId && photos.length === 0) {
      showToast({ title: 'Please add at least one photo', variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload(form, editingProductId || undefined);
      let productId = editingProductId;

      if (editingProductId) {
        await updateProductMutation.mutateAsync({ productId: editingProductId, payload });
      } else {
        const created = await createProductMutation.mutateAsync(payload);
        productId = created.data.id;
      }

      if (productId && photos.length > 0) {
        await uploadPhotosForProduct(productId, form.title.trim());
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products });
      if (productId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.admin.productDetail(productId) });
      }

      showToast({
        title: editingProductId ? 'Your product has been updated' : 'Your product has been posted',
        variant: 'success'
      });

      resetForm();
    } catch (error) {
      showToast({
        title: 'Could not post product',
        description: toUserMessage(error, 'Please try again.'),
        variant: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (productId: string) => {
    if (!token) return;

    setIsLoadingEdit(true);
    try {
      const detail = await getAdminProductById(productId, token);
      const product = detail.data;

      setForm({
        title: product.title,
        price: String(product.estimated_price_tzs),
        category: mapProductTypeToCategory(product.product_type, product.title),
        condition: mapConditionFromApi(product.condition),
        keyInfo: product.specs.find((spec) => spec.spec_key === 'highlights')?.value_text || product.short_description || '',
        description: product.long_description || ''
      });

      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      setPhotos([]);
      setEditingProductId(productId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      showToast({
        title: 'Could not load product',
        description: toUserMessage(error, 'Please try again.'),
        variant: 'error'
      });
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await archiveProductMutation.mutateAsync(productId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products });
      if (editingProductId === productId) {
        resetForm();
      }
      showToast({ title: 'Product deleted', variant: 'success' });
    } catch (error) {
      showToast({
        title: 'Could not delete product',
        description: toUserMessage(error, 'Please try again.'),
        variant: 'error'
      });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Post Products</h1>
          <p className="mt-1 text-sm text-secondary">Signed in as {admin?.full_name || admin?.email || 'Admin'}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/shop" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-foreground">
            View Store
          </Link>
          <Button type="button" onClick={() => void logout()}>
            Sign Out
          </Button>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <form className="space-y-5" onSubmit={(event) => void handlePostProduct(event)}>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">1. Add photos of your product</p>
            <label
              onDragOver={(event) => {
                event.preventDefault();
                if (!isDropzoneActive) setIsDropzoneActive(true);
              }}
              onDragLeave={() => setIsDropzoneActive(false)}
              onDrop={handleDrop}
              className={`block cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${isDropzoneActive ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
            >
              <p className="text-base font-semibold text-foreground">Add photos of your product</p>
              <p className="mt-1 text-sm text-secondary">Drag and drop or click to upload</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoInput}
                disabled={isSubmitting}
                className="sr-only"
              />
            </label>

            {photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="overflow-hidden rounded-xl border border-border bg-background">
                    <img src={photo.previewUrl} alt={`Upload ${index + 1}`} className="h-28 w-full object-cover" />
                    <div className="grid grid-cols-3 gap-1 p-2 text-xs">
                      <button
                        type="button"
                        onClick={() => movePhoto(photo.id, 'left')}
                        className="rounded border border-border px-2 py-1 text-foreground"
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        onClick={() => movePhoto(photo.id, 'right')}
                        className="rounded border border-border px-2 py-1 text-foreground"
                      >
                        Right
                      </button>
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="rounded border border-border px-2 py-1 text-danger"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">2. What are you selling?</label>
            <input
              value={form.title}
              onChange={(event) => updateForm('title', event.target.value)}
              placeholder="Gaming PC RTX 3060"
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none transition focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">3. Price (TZS)</label>
            <input
              inputMode="numeric"
              value={form.price}
              onChange={(event) => updateForm('price', event.target.value.replace(/\D/g, ''))}
              placeholder="850000"
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none transition focus:border-primary"
            />
            {formatPricePreview(form.price) ? <p className="text-xs text-secondary">{formatPricePreview(form.price)} TZS</p> : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">4. Category</label>
            <select
              value={form.category}
              onChange={(event) => updateForm('category', event.target.value as SimpleCategory)}
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none transition focus:border-primary"
            >
              <option value="gaming_pc">Gaming PC</option>
              <option value="laptop">Laptop</option>
              <option value="desktop">Desktop</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">5. Condition</p>

            <label className="space-y-1">
              <span className="text-sm text-foreground">Condition</span>
              <select
                value={form.condition}
                onChange={(event) => updateForm('condition', event.target.value as SimpleCondition)}
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none transition focus:border-primary"
              >
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm text-foreground">6. Key details</span>
              <input
                value={form.keyInfo}
                onChange={(event) => updateForm('keyInfo', event.target.value)}
                placeholder="Example: Core i7, 16GB RAM, 512GB SSD"
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none transition focus:border-primary"
              />
            </label>

            {matchedSuggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {matchedSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      if (form.keyInfo.includes(suggestion)) return;
                      const separator = form.keyInfo.trim() ? ', ' : '';
                      updateForm('keyInfo', `${form.keyInfo}${separator}${suggestion}`);
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                  >
                    Add {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">7. Add more details (optional)</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => updateForm('description', event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
            />
          </div>

          {uploadProgress ? (
            <p className="text-sm text-secondary" aria-live="polite">
              Uploading {uploadProgress.current} of {uploadProgress.total}
              {uploadProgress.fileName ? ` (${uploadProgress.fileName})` : ''} - {uploadProgress.percent}%
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="lg" loading={isSubmitting} disabled={isSubmitting || isLoadingEdit}>
              {editingProductId ? 'Save Product' : '8. Post Product'}
            </Button>
            {editingProductId ? (
              <Button type="button" variant="secondary" size="lg" onClick={resetForm}>
                Cancel Edit
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Your products</h2>

        {productsQuery.isLoading ? <p className="text-sm text-secondary">Loading products...</p> : null}
        {productsQuery.isError ? <p className="text-sm text-danger">Could not load products.</p> : null}
        {!productsQuery.isLoading && activeProducts.length === 0 ? (
          <p className="text-sm text-secondary">No products yet.</p>
        ) : null}

        {activeProducts.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeProducts.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                <div className="h-40 w-full bg-background">
                  {cardImages[product.id] ? (
                    <img
                      src={cardImages[product.id]}
                      alt={product.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = '/placeholders/desktop.svg';
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted">No image</div>
                  )}
                </div>

                <div className="space-y-2 p-3">
                  <p className="text-sm font-semibold text-foreground">{product.title}</p>
                  <p className="text-sm text-secondary">{formatTzs(product.estimated_price_tzs)}</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => void handleEditProduct(product.id)} disabled={isSubmitting || isLoadingEdit}>
                      Edit
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => void handleDeleteProduct(product.id)} disabled={isSubmitting}>
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
