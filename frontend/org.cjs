const fs = require('fs');
const path = require('path');

const dirs = [
  'api', 'lib', 'types', 'store', 'hooks',
  'components/layout', 'components/feedback', 'components/ui',
  'components/cart', 'components/builder', 'components/checkout',
  'pages', 'router'
];

const basePath = path.join(process.cwd(), 'src');

dirs.forEach(d => {
  fs.mkdirSync(path.join(basePath, d), { recursive: true });
});

const filesToTouch = [
  'api/client.ts', 'api/products.ts', 'api/cart.ts', 'api/builds.ts', 'api/quotes.ts', 'api/auth.ts',
  'lib/motion.ts', 'lib/currency.ts', 'lib/session.ts', 'lib/errors.ts', 'lib/guards.ts', 'lib/format.ts', 'lib/queryKeys.ts',
  'types/api.ts', 'types/ui.ts',
  'store/ui.ts', 'store/session.ts',
  'hooks/useProducts.ts', 'hooks/useCart.ts', 'hooks/useBuilds.ts', 'hooks/useQuote.ts', 'hooks/useWishlist.ts', 'hooks/useToast.ts', 'hooks/useGuestSession.ts',
  'components/layout/Layout.tsx', 'components/layout/Header.tsx', 'components/layout/Footer.tsx', 'components/layout/MobileNav.tsx',
  'components/feedback/Toast.tsx', 'components/feedback/ToastProvider.tsx', 'components/feedback/SkeletonCard.tsx', 'components/feedback/SkeletonGrid.tsx', 'components/feedback/EmptyState.tsx', 'components/feedback/ErrorState.tsx', 'components/feedback/PageLoader.tsx',
  'components/ui/ProductCard.tsx', 'components/ui/ProductGrid.tsx', 'components/ui/ProductRail.tsx', 'components/ui/PriceDisplay.tsx', 'components/ui/ConditionBadge.tsx', 'components/ui/StockBadge.tsx', 'components/ui/FilterPanel.tsx', 'components/ui/FilterDrawer.tsx', 'components/ui/ActiveFilters.tsx', 'components/ui/SortControl.tsx', 'components/ui/SectionHeader.tsx', 'components/ui/WhatsAppButton.tsx', 'components/ui/SearchInput.tsx', 'components/ui/QuantityStepper.tsx', 'components/ui/Breadcrumb.tsx', 'components/ui/AuthPromptBanner.tsx',
  'components/cart/CartItemRow.tsx', 'components/cart/CartSummary.tsx', 'components/cart/CartDrawer.tsx',
  'components/builder/BuildSlot.tsx', 'components/builder/BuildPartPicker.tsx', 'components/builder/BuildSummary.tsx', 'components/builder/CompatibilityBanner.tsx',
  'components/checkout/CustomerInfoForm.tsx', 'components/checkout/QuoteConfirmation.tsx',
  'pages/HomePage.tsx', 'pages/ShopPage.tsx', 'pages/ProductDetailPage.tsx', 'pages/BuilderPage.tsx', 'pages/CartPage.tsx', 'pages/CheckoutPage.tsx', 'pages/WishlistPage.tsx', 'pages/NotFoundPage.tsx',
  'router/index.tsx'
];

filesToTouch.forEach(f => {
  const filePath = path.join(basePath, f);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '// TODO: Placeholder for UI component\n');
  }
});
console.log('Structure created successfully');
