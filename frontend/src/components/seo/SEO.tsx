import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  canoncalUrl?: string; // Optional if you need to override current pathname
  noindex?: boolean;
}

export function SEO({ 
  title, 
  description = 'YS Store - The best destination for premium gaming PCs, laptops, and components in Dar es Salaam.',
  image = 'https://ysstore.co.tz/og-image.jpg', 
  type = 'website',
  author = 'YS Store',
  canoncalUrl,
  noindex = false
}: SEOProps) {
  const location = useLocation();
  
  // Assume a base URL. Use env ideally.
  const baseUrl = import.meta.env.VITE_APP_URL || 'https://ysstore.co.tz';
  const url = canoncalUrl || `${baseUrl}${location.pathname}`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title} | YS Store</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {/* Required for responsiveness? Usually in index.html already, but can ensure here */}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={`${title} | YS Store`} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="YS Store" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={`${title} | YS Store`} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical */}
      <link rel="canonical" href={url} />
      
      {/* Author */}
      <meta name="author" content={author} />
    </Helmet>
  );
}
