import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardView } from './components/DashboardView';
import { AIRevenueAgentView } from './components/AIRevenueAgentView';
import { BusinessHealthView } from './components/BusinessHealthView';
import { ProductsView } from './components/ProductsView';
import { SellersView } from './components/SellersView';
import { BuyersView } from './components/BuyersView';
import { LeadsView } from './components/LeadsView';
import { QuotationsView } from './components/QuotationsView';
import { FollowUpsView } from './components/FollowUpsView';
import { OrdersView } from './components/OrdersView';
import { LogisticsView } from './components/logistics/LogisticsView';
import { AnalyticsView } from './components/AnalyticsView';
import { AIAssistantView } from './components/AIAssistantView';
import { SettingsView } from './components/SettingsView';
import { LandingPageView } from './components/LandingPageView';
import { PublicWebsite } from './components/public/PublicWebsite';
import { MarketplaceView } from './components/MarketplaceView';
import { WebsiteBuilderView } from './components/WebsiteBuilderView';
import { AdvertisingView } from './components/AdvertisingView';
import { ChatView } from './components/ChatView';
import { DisputesView } from './components/DisputesView';
import { AdminPanelView } from './components/AdminPanelView';
import { LaunchCenterView } from './components/LaunchCenterView';
import { CommandPalette } from './components/CommandPalette';
import { AICreativeStudioModal } from './components/AICreativeStudioModal';
import { AuthModal } from './components/AuthModal';
import { CartProvider } from './context/CartContext';
import { CartDrawer } from './components/cart/CartDrawer';
import { Lead, Quotation, Product } from './types';
import { BRAND } from './config/brand';

const AppShell: React.FC = () => {
  const { user, currentBusiness, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [requireBusinessInModal, setRequireBusinessInModal] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isCreativeStudioOpen, setIsCreativeStudioOpen] = useState<boolean>(false);

  // Cross-view handoffs
  const [productForAgent, setProductForAgent] = useState<Product | null>(null);
  const [quotationLead, setQuotationLead] = useState<Lead | null>(null);
  const [quotationForFollowUp, setQuotationForFollowUp] = useState<Quotation | null>(null);
  const [chatPartner, setChatPartner] = useState<{ id: string; name: string } | null>(null);

  // Global Command Palette Shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenAuth = (isNewBusiness = false) => {
    setRequireBusinessInModal(isNewBusiness);
    setIsAuthModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Loading {BRAND.name}...</p>
        </div>
      </div>
    );
  }

  // Full-screen Public Website & Marketplace Portal mode
  if (currentView === 'landing') {
    return (
      <>
        <PublicWebsite
          onEnterApp={(targetView) => setCurrentView(targetView || 'dashboard')}
          onOpenAuth={(isSignUp) => handleOpenAuth(isSignUp || false)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          requireBusiness={requireBusinessInModal}
        />
        <CommandPalette
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectView={(v) => {
            setCurrentView(v);
            setIsSearchOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100/70 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased overflow-hidden">
      {/* Sidebar Navigation (Slim rail on desktop) */}
      <div className="hidden md:flex shrink-0">
        <Sidebar currentView={currentView} onSelectView={setCurrentView} />
      </div>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenSettings={() => setCurrentView('settings')}
          onOpenNewBusinessModal={() => handleOpenAuth(true)}
          onSelectView={setCurrentView}
          onOpenLanding={() => setCurrentView('landing')}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        {/* Scrollable View Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-100/60 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto pb-12">
            {currentView === 'dashboard' && <DashboardView onSelectView={setCurrentView} />}
            {currentView === 'revenue-agent' && (
              <AIRevenueAgentView
                initialProduct={productForAgent}
                onProceedToOutreach={() => setCurrentView('leads')}
              />
            )}
            {currentView === 'business-health' && <BusinessHealthView />}
            {currentView === 'products' && (
              <ProductsView
                onSelectProductForAI={(prod: Product) => {
                  setProductForAgent(prod);
                  setCurrentView('revenue-agent');
                }}
              />
            )}
            {currentView === 'sellers' && (
              <SellersView
                onMessageSeller={(id, name) => {
                  setChatPartner({ id, name });
                  setCurrentView('chat');
                }}
              />
            )}
            {currentView === 'buyers' && <BuyersView />}
            {currentView === 'leads' && (
              <LeadsView
                onCreateQuoteForLead={(lead: Lead) => {
                  setQuotationLead(lead);
                  setCurrentView('quotations');
                }}
              />
            )}
            {currentView === 'quotations' && (
              <QuotationsView
                initialLead={quotationLead}
                onScheduleFollowUp={(quote) => {
                  setQuotationForFollowUp(quote);
                  setCurrentView('follow-ups');
                }}
              />
            )}
            {currentView === 'follow-ups' && (
              <FollowUpsView initialQuotation={quotationForFollowUp} />
            )}
            {currentView === 'orders' && (
              <OrdersView onNavigateToLogistics={() => setCurrentView('logistics')} />
            )}
            {currentView === 'logistics' && <LogisticsView />}
            {currentView === 'marketplace' && (
              <MarketplaceView
                initialTab="all"
                onOpenChatWithSeller={(sellerId, sellerName) => {
                  setChatPartner({ id: sellerId, name: sellerName });
                  setCurrentView('chat');
                }}
              />
            )}
            {currentView === 'rfq' && (
              <MarketplaceView
                initialTab="rfqs"
                onOpenChatWithSeller={(sellerId, sellerName) => {
                  setChatPartner({ id: sellerId, name: sellerName });
                  setCurrentView('chat');
                }}
              />
            )}
            {currentView === 'website-builder' && <WebsiteBuilderView />}
            {currentView === 'advertising' && <AdvertisingView />}
            {currentView === 'chat' && (
              <ChatView
                initialSellerId={chatPartner?.id}
                initialSellerName={chatPartner?.name}
              />
            )}
            {currentView === 'launch-center' && (
              <LaunchCenterView onSelectView={setCurrentView} />
            )}
            {currentView === 'disputes' && <DisputesView />}
            {currentView === 'admin' && <AdminPanelView />}
            {currentView === 'analytics' && <AnalyticsView />}
            {currentView === 'ai-assistant' && <AIAssistantView />}
            {currentView === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectView={(v) => {
          setCurrentView(v);
          setIsSearchOpen(false);
        }}
      />

      {/* AI Creative Studio Modal */}
      <AICreativeStudioModal
        isOpen={isCreativeStudioOpen}
        onClose={() => setIsCreativeStudioOpen(false)}
      />

      {/* Auth & Business Profile Creation Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        requireBusiness={requireBusinessInModal}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav currentView={currentView} onSelectView={setCurrentView} />

      {/* Shopping Cart & B2C Checkout Drawer */}
      <CartDrawer onNavigateToOrders={() => setCurrentView('orders')} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <AppShell />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
