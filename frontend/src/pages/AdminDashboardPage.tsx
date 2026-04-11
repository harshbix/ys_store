import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m as motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getAdminProductById, getAdminUsersSummary } from '../api/admin';
import { SEO } from '../components/seo/SEO';
import { AdminBuildTile } from '../components/builds/AdminBuildTile';
import { AdminSectionHeader } from '../components/dashboard/AdminSectionHeader';
import { AdminStatCard } from '../components/dashboard/AdminStatCard';
import { AdminProductTile } from '../components/products/AdminProductTile';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '../components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle
} from '../components/ui/Drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { Switch } from '../components/ui/switch';
import { useAdmin } from '../hooks/useAdmin';
import { useShowToast } from '../hooks/useToast';
import { formatTzs } from '../lib/currency';
import { fadeInUp, gridStagger, tapScale, TRANSITIONS } from '../lib/motion';
import { cn } from '../lib/utils';
import { queryKeys } from '../lib/queryKeys';
import type {
  AdminBuild,
  AdminBuildPayload,
  AdminFinalizeUploadPayload,
  AdminProductPayload,
  AdminSignedUploadPayload,
  AdminUsersSummaryPayload
} from '../types/admin';
import type { ProductCondition, ProductType, StockStatus } from '../types/api';
import { toUserMessage } from '../utils/errors';

type AdminSectionKey = 'dashboard' | 'products' | 'builds' | 'users' | 'activity' | 'settings';

type SimpleCategory = 'gaming_pc' | 'laptop' | 'desktop' | 'accessories';
type SimpleCondition = 'new' | 'used' | 'refurbished';

interface LocalPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

interface ProductFormState {
  title: string;
  category: SimpleCategory;
  condition: SimpleCondition;
  listPrice: string;
  salePrice: string;
  stockStatus: StockStatus;
  featured: boolean;
  visible: boolean;
  keyInfo: string;
  description: string;
}

interface BuildItemDraft {
  id: string;
  slot_order: number;
  component_type: string;
  component_id: string;
  quantity: number;
}

interface BuildFormState {
  id: string;
  name: string;
  cpu_family: string;
  build_number: string;
  discount_percent: string;
  status: string;
  visible: boolean;
  estimated_system_wattage: string;
  required_psu_wattage: string;
  compatibility_status: string;
  items: BuildItemDraft[];
}

interface PasswordFormState {
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
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

const sections: Array<{ key: AdminSectionKey; label: string; description: string }> = [
  { key: 'dashboard', label: 'Dashboard', description: 'Business overview' },
  { key: 'products', label: 'Products', description: 'Upload and manage catalog' },
  { key: 'builds', label: 'Builds', description: 'Preset PC build management' },
  { key: 'users', label: 'Users', description: 'Registered customer snapshots' },
  { key: 'activity', label: 'Activity', description: 'Recent storefront intent' },
  { key: 'settings', label: 'Settings', description: 'Storefront and admin controls' }
];

const sectionTransition = { duration: 0.2, ease: [0.22, 1, 0.36, 1] } as const;

const defaultProductForm: ProductFormState = {
  title: '',
  category: 'gaming_pc',
  condition: 'new',
  listPrice: '',
  salePrice: '',
  stockStatus: 'in_stock',
  featured: false,
  visible: true,
  keyInfo: '',
  description: ''
};

const defaultBuildForm: BuildFormState = {
  id: '',
  name: '',
  cpu_family: '',
  build_number: '',
  discount_percent: '0',
  status: 'draft',
  visible: true,
  estimated_system_wattage: '',
  required_psu_wattage: '',
  compatibility_status: 'unknown',
  items: [{ id: cryptoRandomId(), slot_order: 0, component_type: 'cpu', component_id: '', quantity: 1 }]
};

const defaultPasswordForm: PasswordFormState = {
  currentPassword: '',
  nextPassword: '',
  confirmPassword: ''
};

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parsePrice(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? Number.parseInt(digits, 10) : 0;
}

function formatPriceInput(value: string): string {
  const parsed = parsePrice(value);
  return parsed ? parsed.toLocaleString('en-US') : '';
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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

async function uploadToSignedUrl(url: string, file: File, onProgress?: (percent: number) => void) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', resolveImageContentType(file));

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress?.(Math.max(0, Math.min(100, percent)));
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

function formatTimestamp(value: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function formatRelativeTime(value: string): string {
  if (!value) return 'Unknown';

  const diffMs = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diffMs)) return 'Unknown';

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
}

function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

function useIsNarrowScreen(maxWidth = 900) {
  const [isNarrow, setIsNarrow] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= maxWidth;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onResize = () => setIsNarrow(window.innerWidth <= maxWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [maxWidth]);

  return isNarrow;
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <Card className="border-dashed bg-surface/70">
      <CardContent className="flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-secondary">{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const isNarrowScreen = useIsNarrowScreen();

  const [activeSection, setActiveSection] = useState<AdminSectionKey>('dashboard');
  const [isProductPanelOpen, setIsProductPanelOpen] = useState(false);
  const [isBuildPanelOpen, setIsBuildPanelOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  const shouldLoadDashboard = activeSection === 'dashboard';
  const shouldLoadProducts = activeSection === 'products' || activeSection === 'settings' || isProductPanelOpen;
  const shouldLoadBuilds = activeSection === 'builds' || isBuildPanelOpen;
  const shouldLoadUsers = activeSection === 'users';
  const shouldLoadActivity = activeSection === 'activity' || activeSection === 'dashboard';

  const {
    admin,
    token,
    dashboardSummaryQuery,
    activityQuery,
    productsQuery,
    buildsQuery,
    buildComponentsQuery,
    createProductMutation,
    updateProductMutation,
    archiveProductMutation,
    createUploadUrlMutation,
    finalizeUploadMutation,
    createBuildMutation,
    updateBuildMutation,
    deleteBuildMutation,
    deleteUserMutation,
    changePasswordMutation,
    logout
  } = useAdmin({
    loadDashboard: shouldLoadDashboard,
    loadProducts: shouldLoadProducts,
    loadBuilds: shouldLoadBuilds,
    loadBuildComponents: shouldLoadBuilds,
    loadUsers: shouldLoadUsers,
    loadActivity: shouldLoadActivity,
    loadQuotes: false
  });

  const [productSearch, setProductSearch] = useState('');
  const [usersSearch, setUsersSearch] = useState('');
  const debouncedUsersSearch = useDebouncedValue(usersSearch, 250);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingBuildId, setEditingBuildId] = useState<string | null>(null);

  const [productForm, setProductForm] = useState<ProductFormState>(defaultProductForm);
  const [buildForm, setBuildForm] = useState<BuildFormState>(defaultBuildForm);

  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [isDropzoneActive, setIsDropzoneActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null);

  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [buildToDelete, setBuildToDelete] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUsersSummaryPayload['recent_users'][number] | null>(null);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(defaultPasswordForm);

  const usersQuery = useQuery<AdminUsersSummaryPayload>({
    queryKey: [...queryKeys.admin.users(debouncedUsersSearch), 'page-1'],
    queryFn: () => getAdminUsersSummary(token || '', { q: debouncedUsersSearch || undefined, limit: 24, page: 1 }),
    enabled: Boolean(token) && shouldLoadUsers,
    staleTime: 30_000,
    retry: 1
  });

  const products = productsQuery.data || [];
  const builds = buildsQuery.data || [];
  const buildComponents = buildComponentsQuery.data || [];
  const dashboard = dashboardSummaryQuery.data;

  const componentById = useMemo(
    () => new Map(buildComponents.map((component) => [component.id, component])),
    [buildComponents]
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => {
      const title = product.title.toLowerCase();
      const sku = product.sku.toLowerCase();
      return title.includes(q) || sku.includes(q);
    });
  }, [productSearch, products]);

  const filteredBuilds = useMemo(() => {
    return builds.filter((preset) => Boolean(preset));
  }, [builds]);

  const featuredProducts = useMemo(() => {
    return products.filter((product) => product.is_featured).slice(0, 8);
  }, [products]);

  const buildDraftSubtotal = useMemo(() => {
    return buildForm.items.reduce((sum, item) => {
      const component = componentById.get(item.component_id);
      return sum + (component?.price_tzs || 0) * Math.max(1, Number(item.quantity || 1));
    }, 0);
  }, [buildForm.items, componentById]);

  const buildDraftDiscount = useMemo(() => {
    const raw = Number(buildForm.discount_percent || 0);
    if (!Number.isFinite(raw)) return 0;
    return Math.min(99.99, Math.max(0, raw));
  }, [buildForm.discount_percent]);

  const buildDraftTotal = useMemo(() => {
    return Math.max(0, Math.round(buildDraftSubtotal - (buildDraftSubtotal * buildDraftDiscount) / 100));
  }, [buildDraftDiscount, buildDraftSubtotal]);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, [photos]);

  function resetProductForm() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    setPhotos([]);
    setUploadProgress(null);
    setEditingProductId(null);
    setProductForm(defaultProductForm);
  }

  function resetBuildForm() {
    setEditingBuildId(null);
    setBuildForm(defaultBuildForm);
  }

  function openCreateProductPanel() {
    resetProductForm();
    setIsProductPanelOpen(true);
  }

  function openCreateBuildPanel() {
    resetBuildForm();
    setIsBuildPanelOpen(true);
  }

  function updateProductField<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setProductForm((prev) => ({ ...prev, [key]: value }));
  }

  function addPhotos(files: File[]) {
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
        id: cryptoRandomId(),
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }

    if (accepted.length > 0) {
      setPhotos((prev) => [...prev, ...accepted]);
    }
  }

  function handlePhotoInput(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    addPhotos(files);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDropzoneActive(false);
    const files = Array.from(event.dataTransfer.files || []);
    addPhotos(files);
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((photo) => photo.id !== id);
    });
  }

  function movePhoto(id: string, direction: 'left' | 'right') {
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
  }

  async function uploadPhotosForProduct(productId: string, title: string) {
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

      await uploadToSignedUrlWithRetry(original.signed_url, file, (percent) => {
        variantProgress.original = percent;
        pushProgress();
      });
      await uploadToSignedUrlWithRetry(thumb.signed_url, file, (percent) => {
        variantProgress.thumb = percent;
        pushProgress();
      });
      await uploadToSignedUrlWithRetry(full.signed_url, file, (percent) => {
        variantProgress.full = percent;
        pushProgress();
      });

      const finalizePayload: AdminFinalizeUploadPayload = {
        owner_type: 'product',
        owner_id: productId,
        original_path: original.path,
        thumb_path: thumb.path,
        full_path: full.path,
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
  }

  async function handleEditProduct(productId: string) {
    if (!token) return;

    try {
      const detail = await getAdminProductById(productId, token);
      const shortDescription = detail.short_description || '';
      const listPriceMatch = shortDescription.match(/List price\s*:?\s*([0-9]+)/i);

      setEditingProductId(productId);
      setProductForm({
        title: detail.title,
        category: mapProductTypeToCategory(detail.product_type, detail.title),
        condition: mapConditionFromApi(detail.condition),
        listPrice: String(listPriceMatch ? Number.parseInt(listPriceMatch[1], 10) : detail.estimated_price_tzs),
        salePrice: '',
        stockStatus: detail.stock_status,
        featured: detail.is_featured,
        visible: detail.is_visible,
        keyInfo: shortDescription.replace(/List price.*$/i, '').trim(),
        description: detail.long_description || ''
      });

      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      setPhotos([]);
      setUploadProgress(null);
      setIsProductPanelOpen(true);
      setActiveSection('products');
    } catch (error) {
      showToast({
        title: 'Could not load product',
        description: toUserMessage(error, 'Please try again.'),
        variant: 'error'
      });
    }
  }

  async function handleSubmitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = productForm.title.trim();
    const listPrice = parsePrice(productForm.listPrice);
    const salePrice = parsePrice(productForm.salePrice);

    if (!title) {
      showToast({ title: 'Product title is required', variant: 'error' });
      return;
    }

    if (listPrice <= 0) {
      showToast({ title: 'List price is required', variant: 'error' });
      return;
    }

    const effectivePrice = salePrice > 0 && salePrice < listPrice ? salePrice : listPrice;
    const shortParts = [productForm.keyInfo.trim()];
    if (salePrice > 0 && salePrice < listPrice) {
      shortParts.push(`List price ${listPrice} TZS`);
    }

    const payload: AdminProductPayload = {
      sku: `YS-${Date.now().toString().slice(-6)}`,
      slug: slugify(title) || `product-${Date.now()}`,
      title,
      product_type: mapCategoryToProductType(productForm.category),
      brand: 'Unknown',
      model_name: title,
      condition: mapConditionToApi(productForm.condition),
      stock_status: productForm.stockStatus,
      estimated_price_tzs: effectivePrice,
      short_description: shortParts.filter(Boolean).join(' • ') || undefined,
      long_description: productForm.description.trim() || undefined,
      warranty_text: null,
      is_visible: productForm.visible,
      is_featured: productForm.featured,
      featured_tag: productForm.featured ? (salePrice > 0 && salePrice < listPrice ? 'hot_deal' : 'recommended') : null,
      specs: []
    };

    try {
      let productId = editingProductId;

      if (editingProductId) {
        await updateProductMutation.mutateAsync({ productId: editingProductId, payload });
      } else {
        const created = await createProductMutation.mutateAsync(payload);
        productId = created.id;
      }

      if (productId && photos.length > 0) {
        await uploadPhotosForProduct(productId, title);
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.activity(40) });

      showToast({
        title: editingProductId ? 'Product updated' : 'Product uploaded',
        description: editingProductId
          ? 'Your product changes were saved.'
          : 'Your product is now available in the admin catalog.',
        variant: 'success'
      });

      resetProductForm();
      setIsProductPanelOpen(false);
    } catch (error) {
      showToast({
        title: 'Could not save product',
        description: toUserMessage(error, 'Please check the fields and try again.'),
        variant: 'error'
      });
    } finally {
      setUploadProgress(null);
    }
  }

  async function handleDeleteProduct(productId: string) {
    try {
      await archiveProductMutation.mutateAsync(productId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      showToast({ title: 'Product removed', description: 'The product has been hidden from the store.', variant: 'info' });
    } catch (error) {
      showToast({
        title: 'Could not delete product',
        description: toUserMessage(error, 'Please try again.'),
        variant: 'error'
      });
    } finally {
      setProductToDelete(null);
    }
  }

  function updateBuildField<K extends keyof BuildFormState>(key: K, value: BuildFormState[K]) {
    setBuildForm((prev) => ({ ...prev, [key]: value }));
  }

  function addBuildItem() {
    setBuildForm((prev) => {
      const nextSlot = prev.items.length ? Math.max(...prev.items.map((item) => item.slot_order)) + 1 : 0;
      return {
        ...prev,
        items: [...prev.items, { id: cryptoRandomId(), slot_order: nextSlot, component_type: 'cpu', component_id: '', quantity: 1 }]
      };
    });
  }

  function removeBuildItem(itemId: string) {
    setBuildForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId)
    }));
  }

  function updateBuildItem(itemId: string, patch: Partial<BuildItemDraft>) {
    setBuildForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;

        const next = { ...item, ...patch };
        if (patch.component_type && patch.component_type !== item.component_type) {
          next.component_id = '';
        }
        return next;
      })
    }));
  }

  function openEditBuildPanel(build: AdminBuild) {
    const mappedItems: BuildItemDraft[] = (build.pc_build_preset_items || []).map((item, index) => ({
      id: `${item.id || index}`,
      slot_order: item.slot_order,
      component_type: item.component_type,
      component_id: item.component_id,
      quantity: item.quantity
    }));

    setEditingBuildId(build.id);
    setBuildForm({
      id: build.id,
      name: build.name,
      cpu_family: build.cpu_family,
      build_number: build.build_number != null ? String(build.build_number) : '',
      discount_percent: build.discount_percent != null ? String(build.discount_percent) : '0',
      status: build.status || 'draft',
      visible: build.is_visible,
      estimated_system_wattage: build.estimated_system_wattage != null ? String(build.estimated_system_wattage) : '',
      required_psu_wattage: build.required_psu_wattage != null ? String(build.required_psu_wattage) : '',
      compatibility_status: build.compatibility_status || 'unknown',
      items: mappedItems.length > 0 ? mappedItems : defaultBuildForm.items
    });

    setIsBuildPanelOpen(true);
    setActiveSection('builds');
  }

  async function handleSubmitBuild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!buildForm.name.trim()) {
      showToast({ title: 'Build name is required', variant: 'error' });
      return;
    }

    if (!buildForm.cpu_family.trim()) {
      showToast({ title: 'CPU family is required', variant: 'error' });
      return;
    }

    const invalidItem = buildForm.items.find((item) => !item.component_id || !item.component_type);
    if (invalidItem) {
      showToast({ title: 'Each build item needs a type and component', variant: 'error' });
      return;
    }

    const payload: AdminBuildPayload = {
      id: buildForm.id.trim() || undefined,
      name: buildForm.name.trim(),
      cpu_family: buildForm.cpu_family.trim(),
      build_number: buildForm.build_number ? Number(buildForm.build_number) : null,
      discount_percent: Number(buildForm.discount_percent || 0),
      status: buildForm.status || 'draft',
      estimated_system_wattage: buildForm.estimated_system_wattage ? Number(buildForm.estimated_system_wattage) : null,
      required_psu_wattage: buildForm.required_psu_wattage ? Number(buildForm.required_psu_wattage) : null,
      compatibility_status: buildForm.compatibility_status || 'unknown',
      is_visible: buildForm.visible,
      items: buildForm.items.map((item) => ({
        slot_order: item.slot_order,
        component_type: item.component_type,
        component_id: item.component_id,
        quantity: Math.max(1, Number(item.quantity || 1))
      }))
    };

    try {
      if (editingBuildId) {
        await updateBuildMutation.mutateAsync({ buildId: editingBuildId, payload });
      } else {
        await createBuildMutation.mutateAsync(payload);
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.builds });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.activity(40) });

      resetBuildForm();
      setIsBuildPanelOpen(false);
    } catch {
      // Toasts already emitted in hook-level mutation handlers.
    }
  }

  async function handleDeleteBuild(buildId: string) {
    try {
      await deleteBuildMutation.mutateAsync(buildId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.builds });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.activity(40) });
    } catch {
      // Toasts already emitted in hook-level mutation handlers.
    } finally {
      setBuildToDelete(null);
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      await deleteUserMutation.mutateAsync(userId);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      setUserToDelete(null);
    } catch {
      // Toast shown by mutation handler.
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.nextPassword) {
      showToast({ title: 'Password fields are required', variant: 'error' });
      return;
    }

    if (passwordForm.nextPassword !== passwordForm.confirmPassword) {
      showToast({ title: 'New password confirmation does not match', variant: 'error' });
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.nextPassword
      });
      setPasswordForm(defaultPasswordForm);
    } catch {
      // Toast shown by mutation handler.
    }
  }

  const productFormBody = (
    <form className="space-y-5" onSubmit={(event) => void handleSubmitProduct(event)}>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Photos</p>
        <label
          onDragOver={(event) => {
            event.preventDefault();
            if (!isDropzoneActive) setIsDropzoneActive(true);
          }}
          onDragLeave={() => setIsDropzoneActive(false)}
          onDrop={handleDrop}
          className={cn(
            'block cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition',
            isDropzoneActive ? 'border-primary bg-primary/10' : 'border-border bg-background'
          )}
        >
          <p className="text-sm font-semibold text-foreground">Drag files here or tap to upload</p>
          <p className="mt-1 text-xs text-secondary">PNG, JPG, WEBP up to 8MB each</p>
          <input type="file" accept="image/*" multiple onChange={handlePhotoInput} className="sr-only" />
        </label>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo, index) => (
              <div key={photo.id} className="overflow-hidden rounded-lg border border-border bg-background">
                <img src={photo.previewUrl} alt={`Upload ${index + 1}`} className="h-24 w-full object-cover" />
                <div className="grid grid-cols-3 gap-1 p-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => movePhoto(photo.id, 'left')}>Left</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => movePhoto(photo.id, 'right')}>Right</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => removePhoto(photo.id)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-foreground">Product title</label>
          <Input
            value={productForm.title}
            onChange={(event) => updateProductField('title', event.target.value)}
            placeholder="Gaming PC RTX 4060"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Category</label>
          <Select value={productForm.category} onValueChange={(value) => updateProductField('category', value as SimpleCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gaming_pc">Gaming PC</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="laptop">Laptop</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Condition</label>
          <Select value={productForm.condition} onValueChange={(value) => updateProductField('condition', value as SimpleCondition)}>
            <SelectTrigger>
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="refurbished">Refurbished</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">List price (TZS)</label>
          <Input
            inputMode="numeric"
            value={productForm.listPrice}
            onChange={(event) => updateProductField('listPrice', event.target.value.replace(/\D/g, ''))}
            placeholder="850000"
          />
          {formatPriceInput(productForm.listPrice) ? <p className="text-xs text-muted">{formatPriceInput(productForm.listPrice)} TZS</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Sale price (optional)</label>
          <Input
            inputMode="numeric"
            value={productForm.salePrice}
            onChange={(event) => updateProductField('salePrice', event.target.value.replace(/\D/g, ''))}
            placeholder="790000"
          />
          {formatPriceInput(productForm.salePrice) ? <p className="text-xs text-muted">{formatPriceInput(productForm.salePrice)} TZS</p> : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-foreground">Stock / availability</label>
          <Select value={productForm.stockStatus} onValueChange={(value) => updateProductField('stockStatus', value as StockStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Stock status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_stock">In stock</SelectItem>
              <SelectItem value="low_stock">Low stock</SelectItem>
              <SelectItem value="build_on_request">Build on request</SelectItem>
              <SelectItem value="incoming_stock">Incoming stock</SelectItem>
              <SelectItem value="sold_out">Sold out</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-foreground">Highlights</label>
          <Input
            value={productForm.keyInfo}
            onChange={(event) => updateProductField('keyInfo', event.target.value)}
            placeholder="Core i7, 16GB RAM, 1TB SSD"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-foreground">Description</label>
          <Textarea
            rows={5}
            value={productForm.description}
            onChange={(event) => updateProductField('description', event.target.value)}
            placeholder="Describe condition, warranty, and who this machine is best for."
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:col-span-2">
          <div>
            <p className="text-sm font-medium text-foreground">Featured product</p>
            <p className="text-xs text-secondary">Show this product in featured storefront sections.</p>
          </div>
          <Switch checked={productForm.featured} onCheckedChange={(checked) => updateProductField('featured', checked)} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:col-span-2">
          <div>
            <p className="text-sm font-medium text-foreground">Visible in storefront</p>
            <p className="text-xs text-secondary">Hidden products stay available in admin only.</p>
          </div>
          <Switch checked={productForm.visible} onCheckedChange={(checked) => updateProductField('visible', checked)} />
        </div>
      </div>

      {uploadProgress ? (
        <p className="text-xs text-secondary" aria-live="polite">
          Uploading {uploadProgress.current} of {uploadProgress.total}
          {uploadProgress.fileName ? ` (${uploadProgress.fileName})` : ''} - {uploadProgress.percent}%
        </p>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-1 border-t border-border bg-background/95 px-1 pt-3 backdrop-blur sm:static sm:border-none sm:bg-transparent sm:px-0 sm:pt-0">
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            disabled={
              createProductMutation.isPending
              || updateProductMutation.isPending
              || createUploadUrlMutation.isPending
              || finalizeUploadMutation.isPending
            }
          >
            {editingProductId ? 'Save product' : 'Upload product'}
          </Button>
          <Button type="button" variant="outline" onClick={() => { resetProductForm(); setIsProductPanelOpen(false); }}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );

  const buildFormBody = (
    <form className="space-y-5" onSubmit={(event) => void handleSubmitBuild(event)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-foreground">Build name</label>
          <Input value={buildForm.name} onChange={(event) => updateBuildField('name', event.target.value)} placeholder="Creator Pro Build" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Build ID (optional)</label>
          <Input value={buildForm.id} onChange={(event) => updateBuildField('id', event.target.value)} placeholder="creator-pro-build" disabled={Boolean(editingBuildId)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">CPU family</label>
          <Input value={buildForm.cpu_family} onChange={(event) => updateBuildField('cpu_family', event.target.value)} placeholder="Intel Core i7" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Build number</label>
          <Input
            inputMode="numeric"
            value={buildForm.build_number}
            onChange={(event) => updateBuildField('build_number', event.target.value.replace(/\D/g, ''))}
            placeholder="12"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Discount %</label>
          <Input
            inputMode="decimal"
            value={buildForm.discount_percent}
            onChange={(event) => updateBuildField('discount_percent', event.target.value.replace(/[^\d.]/g, ''))}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Status</label>
          <Select value={buildForm.status} onValueChange={(value) => updateBuildField('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Build status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Estimated system wattage</label>
          <Input
            inputMode="numeric"
            value={buildForm.estimated_system_wattage}
            onChange={(event) => updateBuildField('estimated_system_wattage', event.target.value.replace(/\D/g, ''))}
            placeholder="450"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Required PSU wattage</label>
          <Input
            inputMode="numeric"
            value={buildForm.required_psu_wattage}
            onChange={(event) => updateBuildField('required_psu_wattage', event.target.value.replace(/\D/g, ''))}
            placeholder="650"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:col-span-2">
          <div>
            <p className="text-sm font-medium text-foreground">Visible in builder</p>
            <p className="text-xs text-secondary">Only visible builds are shown in the public preset picker.</p>
          </div>
          <Switch checked={buildForm.visible} onCheckedChange={(checked) => updateBuildField('visible', checked)} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Build components</p>
          <Button type="button" variant="outline" size="sm" onClick={addBuildItem}>Add part</Button>
        </div>

        {buildForm.items.map((item) => {
          const optionsForType = buildComponents.filter((component) => component.type === item.component_type);
          return (
            <Card key={item.id} className="bg-surface/60">
              <CardContent className="grid gap-3 p-4 sm:grid-cols-12">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-secondary">Slot</label>
                  <Input
                    inputMode="numeric"
                    value={String(item.slot_order)}
                    onChange={(event) => updateBuildItem(item.id, { slot_order: Number(event.target.value.replace(/\D/g, '')) || 0 })}
                  />
                </div>

                <div className="space-y-1 sm:col-span-3">
                  <label className="text-xs font-medium text-secondary">Type</label>
                  <Input
                    value={item.component_type}
                    onChange={(event) => updateBuildItem(item.id, { component_type: event.target.value.trim().toLowerCase() })}
                    placeholder="cpu"
                  />
                </div>

                <div className="space-y-1 sm:col-span-5">
                  <label className="text-xs font-medium text-secondary">Component</label>
                  <Select value={item.component_id || '__empty'} onValueChange={(value) => updateBuildItem(item.id, { component_id: value === '__empty' ? '' : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose component" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty">Select component</SelectItem>
                      {optionsForType.map((component) => (
                        <SelectItem key={component.id} value={component.id}>
                          {component.name} - {formatTzs(component.price_tzs)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-secondary">Qty</label>
                  <Input
                    inputMode="numeric"
                    value={String(item.quantity)}
                    onChange={(event) => updateBuildItem(item.id, { quantity: Math.max(1, Number(event.target.value.replace(/\D/g, '')) || 1) })}
                  />
                </div>

                <div className="sm:col-span-12 flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <p className="text-xs text-secondary">
                    Line total: {formatTzs((componentById.get(item.component_id)?.price_tzs || 0) * Math.max(1, item.quantity || 1))}
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={() => removeBuildItem(item.id)} disabled={buildForm.items.length <= 1}>
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-background">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary">Subtotal</span>
            <span className="font-medium text-foreground">{formatTzs(buildDraftSubtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary">Discount</span>
            <span className="font-medium text-foreground">{buildDraftDiscount}%</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
            <span className="font-semibold text-foreground">Total build price</span>
            <span className="text-base font-semibold text-foreground">{formatTzs(buildDraftTotal)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-1 border-t border-border bg-background/95 px-1 pt-3 backdrop-blur sm:static sm:border-none sm:bg-transparent sm:px-0 sm:pt-0">
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={createBuildMutation.isPending || updateBuildMutation.isPending}>
            {editingBuildId ? 'Save build' : 'Create build'}
          </Button>
          <Button type="button" variant="outline" onClick={() => { resetBuildForm(); setIsBuildPanelOpen(false); }}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );

  return (
    <>
      <SEO title="Admin Dashboard" description="YS Store Admin" noindex={true} />

      <div className="mx-auto max-w-[1260px] space-y-4 px-3 pb-10 pt-3 sm:space-y-5 sm:px-4 sm:pt-4 lg:px-6">
        <header className="rounded-2xl border border-border bg-surface/90 p-4 shadow-sm sm:p-5 lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-secondary">YS Store Admin</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Commerce Control Center</h1>
              <p className="mt-1 text-sm text-secondary">
                Signed in as {admin?.full_name || admin?.email || 'Admin'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/shop" className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-medium text-foreground hover:bg-secondary/60">
                View storefront
              </Link>
              <Button type="button" variant="ghost" onClick={() => void logout()}>
                Sign out
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:hidden">
            <Button type="button" variant="outline" onClick={() => setIsNavDrawerOpen(true)}>
              Open sections
            </Button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[236px,1fr] lg:items-start">
          <aside className="hidden lg:block">
            <Card className="sticky top-4 border-border/90 bg-surface/85">
              <CardContent className="space-y-2 p-3">
                {sections.map((section) => {
                  const isActive = activeSection === section.key;
                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => setActiveSection(section.key)}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2.5 text-left transition',
                        isActive
                          ? 'border-primary/40 bg-primary/12 text-foreground shadow-sm'
                          : 'border-transparent text-secondary hover:border-border hover:bg-secondary/35 hover:text-foreground'
                      )}
                    >
                      <p className="text-sm font-medium">{section.label}</p>
                      <p className="text-xs text-muted">{section.description}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </aside>

          <main className="space-y-5 overflow-x-hidden">
            <AnimatePresence mode="wait" initial={false}>
            {activeSection === 'dashboard' ? (
              <motion.section
                key="dashboard"
                className="space-y-3 xl:h-[calc(100vh-210px)] xl:overflow-hidden"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: 4, transition: sectionTransition }}
                variants={fadeInUp}
              >
                <AdminSectionHeader
                  title="Dashboard"
                  description="Core business health in a focused, no-clutter command view."
                  action={
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={() => { setActiveSection('products'); openCreateProductPanel(); }}>
                        Upload product
                      </Button>
                      <Button type="button" variant="outline" onClick={() => { setActiveSection('builds'); openCreateBuildPanel(); }}>
                        Create build
                      </Button>
                    </div>
                  }
                />

                {dashboardSummaryQuery.isLoading ? (
                  <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-28 rounded-xl" />
                    ))}
                  </div>
                ) : null}

                {!dashboardSummaryQuery.isLoading && dashboard ? (
                  <>
                    <motion.div className="grid grid-cols-2 gap-3 xl:grid-cols-4" variants={gridStagger}>
                      <AdminStatCard label="Total Users" value={dashboard.stats.total_registered_users.toLocaleString()} helper="Registered accounts" />
                      <AdminStatCard label="Total Products" value={dashboard.stats.total_products.toLocaleString()} />
                      <AdminStatCard label="Total Builds" value={dashboard.stats.total_builds.toLocaleString()} />
                      <AdminStatCard label="WhatsApp Checkout Clicks" value={dashboard.stats.whatsapp_checkout_clicks.toLocaleString()} />
                    </motion.div>

                    <div className="grid gap-4 xl:grid-cols-5 xl:grid-rows-[minmax(0,1fr),auto]">
                      <Card className="xl:col-span-3 overflow-hidden xl:min-h-0">
                        <CardHeader>
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-base">Recent activity</CardTitle>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setActiveSection('activity')}>
                              View all
                            </Button>
                          </div>
                          <CardDescription>Only the latest high-signal updates are shown here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 xl:max-h-[236px] xl:overflow-auto">
                          {dashboard.recent_activity.length === 0 ? (
                            <EmptyState
                              title="No activity yet"
                              description="As users browse, register, and click WhatsApp checkout, activity will show here."
                            />
                          ) : (
                            <div className="space-y-2">
                              {dashboard.recent_activity.slice(0, 2).map((item) => (
                                <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/80 bg-background p-2.5">
                                  <div>
                                    <p className="line-clamp-1 text-sm font-medium text-foreground">{item.title}</p>
                                    {item.description ? <p className="text-xs text-secondary">{item.description}</p> : null}
                                  </div>
                                  <p className="whitespace-nowrap text-xs text-muted">{formatRelativeTime(item.occurred_at)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="xl:col-span-2 overflow-hidden xl:min-h-0">
                        <CardHeader>
                          <CardTitle className="text-base">Top products and builds</CardTitle>
                          <CardDescription>Most selected assets, compressed for fast scanning.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.1em] text-secondary">Top products</p>
                            {dashboard.top_viewed_products.length === 0 ? (
                              <p className="text-sm text-secondary">No product views tracked yet.</p>
                            ) : dashboard.top_viewed_products.slice(0, 3).map((item) => (
                              <div key={item.product_id} className="flex items-center justify-between rounded-lg border border-border/80 p-3">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                                  <p className="text-xs text-secondary">{formatTzs(item.estimated_price_tzs)}</p>
                                </div>
                                <Badge variant="secondary">{item.views} views</Badge>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.1em] text-secondary">Top builds</p>
                            {dashboard.top_selected_builds.length === 0 ? (
                              <p className="text-sm text-secondary">No build selection activity yet.</p>
                            ) : dashboard.top_selected_builds.slice(0, 3).map((item) => (
                              <div key={item.build_id} className="flex items-center justify-between rounded-lg border border-border/80 p-3">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                                  <p className="text-xs text-secondary">{formatTzs(item.total_estimated_price_tzs)}</p>
                                </div>
                                <Badge variant="outline">{item.selections} picks</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="xl:col-span-5">
                        <CardHeader>
                          <CardTitle className="text-base">Quick actions</CardTitle>
                          <CardDescription>Primary creation actions first, operational controls second.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <motion.div whileTap={tapScale} transition={TRANSITIONS.FAST_EASE}>
                              <Button className="w-full" type="button" onClick={() => { setActiveSection('products'); openCreateProductPanel(); }}>
                                Add product
                              </Button>
                            </motion.div>
                            <motion.div whileTap={tapScale} transition={TRANSITIONS.FAST_EASE}>
                              <Button className="w-full" type="button" variant="secondary" onClick={() => { setActiveSection('builds'); openCreateBuildPanel(); }}>
                                Add build
                              </Button>
                            </motion.div>
                            <Button className="w-full" type="button" variant="outline" onClick={() => setActiveSection('users')}>
                              Review users
                            </Button>
                            <Button className="w-full" type="button" variant="outline" onClick={() => setActiveSection('activity')}>
                              Open activity feed
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : null}

                {dashboardSummaryQuery.isError ? (
                  <EmptyState title="Dashboard unavailable" description="We could not load dashboard metrics. Please refresh or try again shortly." />
                ) : null}
              </motion.section>
            ) : null}

            {activeSection === 'products' ? (
              <motion.section
                key="products"
                className="space-y-4"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={sectionTransition}
              >
                <AdminSectionHeader
                  title="Products"
                  description="Upload new products, edit visibility and featured status, and keep catalog quality high."
                  action={
                    <Button type="button" onClick={openCreateProductPanel}>
                      Upload new product
                    </Button>
                  }
                />

                <Card>
                  <CardContent className="p-4">
                    <Input
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Search products by title or SKU"
                    />
                  </CardContent>
                </Card>

                {productsQuery.isLoading ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="h-48 rounded-xl" />
                    ))}
                  </div>
                ) : null}

                {!productsQuery.isLoading && filteredProducts.length === 0 ? (
                  <EmptyState
                    title="No products yet"
                    description="Start by uploading your first product with details, stock status, and images."
                    action={<Button type="button" onClick={openCreateProductPanel}>Upload product</Button>}
                  />
                ) : null}

                {filteredProducts.length > 0 ? (
                  <motion.div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" variants={gridStagger}>
                    {filteredProducts.map((product) => (
                      <AdminProductTile
                        key={product.id}
                        product={product}
                        onEdit={(productId) => void handleEditProduct(productId)}
                        onDelete={(productId) => setProductToDelete(productId)}
                      />
                    ))}
                  </motion.div>
                ) : null}
              </motion.section>
            ) : null}

            {activeSection === 'builds' ? (
              <motion.section
                key="builds"
                className="space-y-4"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={sectionTransition}
              >
                <AdminSectionHeader
                  title="Builds"
                  description="Manage predefined PC builds with clear component selection and pricing."
                  action={<Button type="button" onClick={openCreateBuildPanel}>Create build</Button>}
                />

                {buildsQuery.isLoading ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-40 rounded-xl" />
                    ))}
                  </div>
                ) : null}

                {!buildsQuery.isLoading && filteredBuilds.length === 0 ? (
                  <EmptyState
                    title="No builds yet"
                    description="Create your first preset build to guide shoppers with curated configurations."
                    action={<Button type="button" onClick={openCreateBuildPanel}>Create build</Button>}
                  />
                ) : null}

                {filteredBuilds.length > 0 ? (
                  <motion.div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" variants={gridStagger}>
                    {filteredBuilds.map((build) => (
                      <AdminBuildTile
                        key={build.id}
                        build={build}
                        onEdit={openEditBuildPanel}
                        onDelete={(buildId) => setBuildToDelete(buildId)}
                      />
                    ))}
                  </motion.div>
                ) : null}
              </motion.section>
            ) : null}

            {activeSection === 'users' ? (
              <motion.section
                key="users"
                className="space-y-4"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={sectionTransition}
              >
                <AdminSectionHeader
                  title="Users"
                  description="Monitor real registered users and recent signups from your authentication backend."
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminStatCard
                    label="Total Registered Users"
                    value={String(usersQuery.data?.total_registered_users || dashboard?.stats.total_registered_users || 0)}
                  />
                  <AdminStatCard
                    label="New Users This Week"
                    value={String(usersQuery.data?.new_users_this_week || dashboard?.stats.new_users_this_week || 0)}
                  />
                </div>

                <Card>
                  <CardContent className="p-4">
                    <Input
                      value={usersSearch}
                      onChange={(event) => setUsersSearch(event.target.value)}
                      placeholder="Search by email or phone"
                    />
                  </CardContent>
                </Card>

                {usersQuery.isLoading ? <Skeleton className="h-48 rounded-xl" /> : null}

                {!usersQuery.isLoading && (usersQuery.data?.recent_users || []).length === 0 ? (
                  <EmptyState title="No registered users" description="User profiles will appear here as signups happen." />
                ) : null}

                {(usersQuery.data?.recent_users || []).length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent users</CardTitle>
                      <CardDescription>Showing latest registered accounts and last activity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(usersQuery.data?.recent_users || []).map((user) => (
                        <div key={user.id} className="flex flex-col gap-1 rounded-lg border border-border/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.full_name || user.email || user.phone || 'Unknown user'}</p>
                            <p className="text-xs text-secondary">{user.email || user.phone || 'No contact info'}</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {user.is_admin_account ? <Badge variant="outline">Protected admin</Badge> : null}
                              {user.is_email_confirmed ? <Badge variant="secondary">Email verified</Badge> : <Badge variant="outline">Unverified</Badge>}
                            </div>
                          </div>
                          <div className="flex flex-col items-start gap-2 sm:items-end">
                            <div className="text-xs text-muted">
                              <p>Joined: {formatTimestamp(user.created_at)}</p>
                              <p>Last active: {user.last_active_at ? formatTimestamp(user.last_active_at) : 'No sign-in yet'}</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={user.is_admin_account}
                              onClick={() => setUserToDelete(user)}
                            >
                              Delete user
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}
              </motion.section>
            ) : null}

            {activeSection === 'activity' ? (
              <motion.section
                key="activity"
                className="space-y-4"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={sectionTransition}
              >
                <AdminSectionHeader
                  title="Activity"
                  description="A focused activity feed for checkout intent, registrations, and build interactions."
                />

                {activityQuery.isLoading ? <Skeleton className="h-64 rounded-xl" /> : null}

                {!activityQuery.isLoading && (activityQuery.data || []).length === 0 ? (
                  <EmptyState title="No activity yet" description="When users interact with products and checkout intents, events will appear here." />
                ) : null}

                {(activityQuery.data || []).length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-2 p-4">
                          {(activityQuery.data || []).map((event) => (
                            <div key={event.id} className="rounded-lg border border-border/80 bg-background p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                                  {event.description ? <p className="text-xs text-secondary">{event.description}</p> : null}
                                </div>
                                <p className="text-xs text-muted">{formatRelativeTime(event.occurred_at)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : null}
              </motion.section>
            ) : null}

            {activeSection === 'settings' ? (
              <motion.section
                key="settings"
                className="space-y-4"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={sectionTransition}
              >
                <AdminSectionHeader
                  title="Settings"
                  description="Manage featured products, storefront highlights, and your admin account preferences."
                />

                <div className="grid gap-4 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Featured products</CardTitle>
                      <CardDescription>Highlight selected products in storefront promotional areas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {featuredProducts.length === 0 ? (
                        <EmptyState
                          title="No featured products"
                          description="Mark products as featured from the products section to populate this list."
                          action={<Button type="button" variant="outline" onClick={() => setActiveSection('products')}>Go to products</Button>}
                        />
                      ) : (
                        featuredProducts.map((product) => (
                          <div key={product.id} className="flex items-center justify-between rounded-lg border border-border/80 p-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">{product.title}</p>
                              <p className="text-xs text-secondary">{formatTzs(product.estimated_price_tzs)}</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleEditProduct(product.id)}
                            >
                              Edit
                            </Button>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Admin account</CardTitle>
                      <CardDescription>Safe account-level details and password controls for the current session.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="rounded-lg border border-border/80 p-3">
                        <p className="text-xs uppercase tracking-[0.1em] text-secondary">Name</p>
                        <p className="mt-1 text-foreground">{admin?.full_name || 'Unknown'}</p>
                      </div>
                      <div className="rounded-lg border border-border/80 p-3">
                        <p className="text-xs uppercase tracking-[0.1em] text-secondary">Email</p>
                        <p className="mt-1 text-foreground">{admin?.email || 'Unknown'}</p>
                      </div>
                      <div className="rounded-lg border border-border/80 p-3">
                        <p className="text-xs uppercase tracking-[0.1em] text-secondary">Role</p>
                        <p className="mt-1 text-foreground">{admin?.role || 'owner'}</p>
                      </div>
                      <div className="pt-1">
                        <Button type="button" variant="outline" onClick={() => void logout()}>
                          Sign out
                        </Button>
                      </div>

                      <div className="pt-3">
                        <p className="text-xs uppercase tracking-[0.1em] text-secondary">Change password</p>
                        <form className="mt-2 space-y-2" onSubmit={(event) => void handlePasswordSubmit(event)}>
                          <Input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                            placeholder="Current password"
                            autoComplete="current-password"
                          />
                          <Input
                            type="password"
                            value={passwordForm.nextPassword}
                            onChange={(event) => setPasswordForm((prev) => ({ ...prev, nextPassword: event.target.value }))}
                            placeholder="New password"
                            autoComplete="new-password"
                          />
                          <Input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                          />
                          <p className="text-xs text-muted">Use at least 8 characters with letters and numbers.</p>
                          <Button type="submit" disabled={changePasswordMutation.isPending}>
                            Update password
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.section>
            ) : null}
            </AnimatePresence>
          </main>
        </div>
      </div>

      <Drawer open={isNavDrawerOpen} onOpenChange={setIsNavDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Admin sections</DrawerTitle>
            <DrawerDescription>Switch quickly between dashboard, catalog, builds, users, and settings.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-2 px-4 pb-4">
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => {
                  setActiveSection(section.key);
                  setIsNavDrawerOpen(false);
                }}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-left',
                  activeSection === section.key ? 'border-primary/40 bg-primary/10' : 'border-border bg-background'
                )}
              >
                <p className="text-sm font-medium text-foreground">{section.label}</p>
                <p className="text-xs text-secondary">{section.description}</p>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {isNarrowScreen ? (
        <Drawer open={isProductPanelOpen} onOpenChange={setIsProductPanelOpen}>
          <DrawerContent className="max-h-[95vh]">
            <DrawerHeader>
              <DrawerTitle>{editingProductId ? 'Edit product' : 'Upload product'}</DrawerTitle>
              <DrawerDescription>Create polished product entries with images, stock, and visibility controls.</DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="h-[78vh] px-4 pb-4">
              {productFormBody}
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={isProductPanelOpen} onOpenChange={setIsProductPanelOpen}>
          <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingProductId ? 'Edit product' : 'Upload product'}</SheetTitle>
              <SheetDescription>Create polished product entries with images, stock, and visibility controls.</SheetDescription>
            </SheetHeader>
            <div className="mt-4">{productFormBody}</div>
          </SheetContent>
        </Sheet>
      )}

      {isNarrowScreen ? (
        <Drawer open={isBuildPanelOpen} onOpenChange={setIsBuildPanelOpen}>
          <DrawerContent className="max-h-[95vh]">
            <DrawerHeader>
              <DrawerTitle>{editingBuildId ? 'Edit build' : 'Create build'}</DrawerTitle>
              <DrawerDescription>Compose preset builds with clear components and reliable pricing.</DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="h-[78vh] px-4 pb-4">
              {buildFormBody}
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={isBuildPanelOpen} onOpenChange={setIsBuildPanelOpen}>
          <SheetContent side="right" className="w-full max-w-3xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingBuildId ? 'Edit build' : 'Create build'}</SheetTitle>
              <SheetDescription>Compose preset builds with clear components and reliable pricing.</SheetDescription>
            </SheetHeader>
            <div className="mt-4">{buildFormBody}</div>
          </SheetContent>
        </Sheet>
      )}

      <Dialog open={Boolean(productToDelete)} onOpenChange={(open) => { if (!open) setProductToDelete(null); }}>
        <DialogContent>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={TRANSITIONS.FAST_EASE}>
          <DialogHeader>
            <DialogTitle>Delete product</DialogTitle>
            <DialogDescription>
              This action hides the product from the storefront. You can publish it again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setProductToDelete(null)}>Cancel</Button>
            <Button
              type="button"
              onClick={() => { if (productToDelete) void handleDeleteProduct(productToDelete); }}
              disabled={archiveProductMutation.isPending}
            >
              Confirm delete
            </Button>
          </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(buildToDelete)} onOpenChange={(open) => { if (!open) setBuildToDelete(null); }}>
        <DialogContent>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={TRANSITIONS.FAST_EASE}>
          <DialogHeader>
            <DialogTitle>Delete build</DialogTitle>
            <DialogDescription>
              This permanently removes the preset build from admin and storefront selection.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBuildToDelete(null)}>Cancel</Button>
            <Button
              type="button"
              onClick={() => { if (buildToDelete) void handleDeleteBuild(buildToDelete); }}
              disabled={deleteBuildMutation.isPending}
            >
              Confirm delete
            </Button>
          </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(userToDelete)} onOpenChange={(open) => { if (!open) setUserToDelete(null); }}>
        <DialogContent>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={TRANSITIONS.FAST_EASE}>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This removes their account access permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setUserToDelete(null)}>Cancel</Button>
            <Button
              type="button"
              disabled={deleteUserMutation.isPending || Boolean(userToDelete?.is_admin_account)}
              onClick={() => { if (userToDelete) void handleDeleteUser(userToDelete.id); }}
            >
              Confirm delete
            </Button>
          </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
