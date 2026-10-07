/**
 * VYRA Brand System & Identity Configuration
 * Brand: VYRA — GLOBAL BUSINESS & COMMERCE NETWORK
 * Tagline: "BUILD. CONNECT. SELL. GROW."
 * 
 * Working brand name for a unified, business-first commerce ecosystem connecting
 * manufacturers, exporters, wholesale buyers, retailers, and global enterprises.
 */

export interface BrandConfig {
  name: string;
  wordmark: string;
  expansion: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  theme: {
    primary: string;
    primaryHover: string;
    accent: string;
    darkSurface: string;
    cardBorderLight: string;
    cardBorderDark: string;
  };
  contact: {
    supportEmail: string;
    enterpriseInquiries: string;
  };
  social: {
    twitter: string;
    linkedin: string;
    github: string;
  };
}

export const BRAND: BrandConfig = {
  name: 'VYRA',
  wordmark: 'VYRA',
  expansion: 'Venture Your Reach Anywhere',
  tagline: 'BUILD BEYOND BORDERS.',
  shortDescription: 'Global Commerce Network + AI Business Operating System',
  longDescription:
    'Venture Your Reach Anywhere. Global B2B + B2C commerce and business operating platform for buyers, sellers, manufacturers, exporters, importers, wholesalers, retailers, and service providers.',
  category: 'Global Commerce Network + AI Business Operating System',
  theme: {
    primary: '#2563eb', // blue-600
    primaryHover: '#1d4ed8', // blue-700
    accent: '#38bdf8', // sky-400
    darkSurface: '#090d16', // rich deep navy slate
    cardBorderLight: '#e2e8f0', // slate-200
    cardBorderDark: '#1e293b', // slate-800
  },
  contact: {
    supportEmail: 'contact@vyra.network',
    enterpriseInquiries: 'enterprise@vyra.network',
  },
  social: {
    twitter: 'https://twitter.com/vyranetwork',
    linkedin: 'https://linkedin.com/company/vyranetwork',
    github: 'https://github.com/vyranetwork',
  },
};

