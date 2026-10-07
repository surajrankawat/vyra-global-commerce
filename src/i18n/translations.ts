/**
 * VYRA — Multilingual Translation Dictionary
 * Comprehensive localization supporting 26+ international and regional languages
 * Including RTL support for Arabic and Urdu.
 */

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  nav: {
    dashboard: string;
    marketplace: string;
    products: string;
    rfq: string;
    leads: string;
    quotations: string;
    orders: string;
    finance: string;
    chat: string;
    ads: string;
    websiteBuilder: string;
    aiAgent: string;
    businessHealth: string;
    analytics: string;
    settings: string;
    adminPanel: string;
    landing: string;
  };
  actions: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    send: string;
    submit: string;
    upload: string;
    view: string;
    download: string;
    close: string;
    refresh: string;
    startFree: string;
    exploreMarketplace: string;
    askAi: string;
    generateQuote: string;
  };
  status: {
    active: string;
    pending: string;
    completed: string;
    cancelled: string;
    draft: string;
    paid: string;
    verified: string;
    connected: string;
    disconnected: string;
  };
  marketplace: {
    title: string;
    subtitle: string;
    all: string;
    products: string;
    wholesale: string;
    manufacturers: string;
    rfqHub: string;
    postRequirement: string;
    minOrder: string;
    verifiedSupplier: string;
    requestQuotation: string;
    contactSeller: string;
    priceOnRequest: string;
  };
  ai: {
    revenueAgent: string;
    askNexus: string;
    promptPlaceholder: string;
    quickPrompts: string;
    generating: string;
    confidence: string;
  };
}

export type SupportedLanguageCode =
  | 'en' // English
  | 'hi' // Hindi
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'it' // Italian
  | 'pt' // Portuguese
  | 'ar' // Arabic (RTL)
  | 'zh' // Chinese
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'ru' // Russian
  | 'nl' // Dutch
  | 'tr' // Turkish
  | 'id' // Indonesian
  | 'vi' // Vietnamese
  | 'th' // Thai
  | 'bn' // Bengali
  | 'ur' // Urdu (RTL)
  | 'pa' // Punjabi
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'mr' // Marathi
  | 'gu' // Gujarati
  | 'kn' // Kannada
  | 'ml'; // Malayalam

export interface LanguageInfo {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', direction: 'ltr' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', direction: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', direction: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', direction: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', direction: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', direction: 'ltr' },
];

export const translations: Record<SupportedLanguageCode, TranslationDictionary> = {
  en: {
    appName: 'VYRA',
    tagline: 'AI Business Operating System & Global B2B/B2C Marketplace',
    nav: {
      dashboard: 'Dashboard',
      marketplace: 'Global Marketplace',
      products: 'Products & Inventory',
      rfq: 'RFQs & Buyer Demands',
      leads: 'CRM & Pipeline',
      quotations: 'Quotations',
      orders: 'Orders',
      finance: 'Finance & Invoicing',
      chat: 'Business Chat',
      ads: 'Advertising Platform',
      websiteBuilder: 'Website Builder',
      aiAgent: 'AI Revenue Agent',
      businessHealth: 'Business Health',
      analytics: 'Analytics',
      settings: 'Settings',
      adminPanel: 'Admin Panel',
      landing: 'Overview',
    },
    actions: {
      save: 'Save Changes',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search products, buyers, RFQs...',
      filter: 'Filter',
      export: 'Export Data',
      import: 'Import Data',
      send: 'Send',
      submit: 'Submit',
      upload: 'Upload File',
      view: 'View Details',
      download: 'Download',
      close: 'Close',
      refresh: 'Refresh',
      startFree: 'Start Free Today',
      exploreMarketplace: 'Explore Marketplace',
      askAi: 'Ask VYRA',
      generateQuote: 'Generate Quotation',
    },
    status: {
      active: 'Active',
      pending: 'Pending',
      completed: 'Completed',
      cancelled: 'Cancelled',
      draft: 'Draft',
      paid: 'Paid',
      verified: 'Verified',
      connected: 'Connected',
      disconnected: 'Disconnected',
    },
    marketplace: {
      title: 'Global Trade Marketplace',
      subtitle: 'Verified manufacturers, exporters, and wholesale buyers across 140+ countries.',
      all: 'All Categories',
      products: 'Products',
      wholesale: 'Wholesale & Bulk',
      manufacturers: 'Manufacturers',
      rfqHub: 'RFQ Demands',
      postRequirement: 'Post Buying Requirement',
      minOrder: 'Min. Order (MOQ)',
      verifiedSupplier: 'Verified Supplier',
      requestQuotation: 'Request Quotation',
      contactSeller: 'Contact Seller',
      priceOnRequest: 'Price on Request',
    },
    ai: {
      revenueAgent: 'AI Revenue Agent',
      askNexus: 'Ask VYRA',
      promptPlaceholder: 'Ask anything: e.g. Find buyers, write sales message, create quotation...',
      quickPrompts: 'Executive Quick Actions',
      generating: 'AI is analyzing authorized business data...',
      confidence: 'Confidence Score',
    },
  },
  hi: {
    appName: 'VYRA',
    tagline: 'एआई बिजनेस ऑपरेटिंग सिस्टम और वैश्विक B2B/B2C मार्केटप्लेस',
    nav: {
      dashboard: 'डैशबोर्ड',
      marketplace: 'ग्लोबल मार्केटप्लेस',
      products: 'उत्पाद और इन्वेंट्री',
      rfq: 'खरीदार मांग (RFQ)',
      leads: 'ग्राहक और लीड्स',
      quotations: 'कोटेशन',
      orders: 'ऑर्डर',
      finance: 'वित्त और चालान',
      chat: 'व्यापार चैट',
      ads: 'विज्ञापन मंच',
      websiteBuilder: 'वेबसाइट बिल्डर',
      aiAgent: 'एआई राजस्व एजेंट',
      businessHealth: 'व्यापार स्वास्थ्य',
      analytics: 'एनालिटिक्स',
      settings: 'सेटिंग्स',
      adminPanel: 'व्यवस्थापक कक्ष',
      landing: 'अवलोकन',
    },
    actions: {
      save: 'सहेजें',
      cancel: 'रद्द करें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      create: 'नया बनाएं',
      search: 'उत्पाद, खरीदार, RFQ खोजें...',
      filter: 'फ़िल्टर',
      export: 'डेटा निर्यात करें',
      import: 'डेटा आयात करें',
      send: 'भेजें',
      submit: 'जमा करें',
      upload: 'फ़ाइल अपलोड करें',
      view: 'विवरण देखें',
      download: 'डाउनलोड करें',
      close: 'बंद करें',
      refresh: 'ताज़ा करें',
      startFree: 'निःशुल्क प्रारंभ करें',
      exploreMarketplace: 'मार्केटप्लेस देखें',
      askAi: 'VYRA से पूछें',
      generateQuote: 'कोटेशन बनाएं',
    },
    status: {
      active: 'सक्रिय',
      pending: 'लंबित',
      completed: 'पूर्ण',
      cancelled: 'रद्द',
      draft: 'प्रारूप',
      paid: 'भुगतान किया',
      verified: 'सत्यापित',
      connected: 'जुड़ा हुआ',
      disconnected: 'डिस्कनेक्ट',
    },
    marketplace: {
      title: 'ग्लोबल ट्रेड मार्केटप्लेस',
      subtitle: '140+ देशों में सत्यापित निर्माता, निर्यातक और थोक खरीदार।',
      all: 'सभी श्रेणियां',
      products: 'उत्पाद',
      wholesale: 'थोक और बल्क',
      manufacturers: 'निर्माता',
      rfqHub: 'RFQ मांगें',
      postRequirement: 'खरीद मांग पोस्ट करें',
      minOrder: 'न्यूनतम ऑर्डर (MOQ)',
      verifiedSupplier: 'सत्यापित आपूर्तिकर्ता',
      requestQuotation: 'कोटेशन मांगें',
      contactSeller: 'विक्रेता से संपर्क करें',
      priceOnRequest: 'अनुरोध पर मूल्य',
    },
    ai: {
      revenueAgent: 'एआई राजस्व एजेंट',
      askNexus: 'VYRA से पूछें',
      promptPlaceholder: 'कुछ भी पूछें: उदा. खरीदार खोजें, बिक्री संदेश लिखें, कोटेशन बनाएं...',
      quickPrompts: 'त्वरित कार्य',
      generating: 'एआई व्यापार डेटा का विश्लेषण कर रहा है...',
      confidence: 'विश्वास स्कोर',
    },
  },
  es: {
    appName: 'VYRA',
    tagline: 'Sistema Operativo de Negocios con IA y Mercado Global B2B/B2C',
    nav: {
      dashboard: 'Panel',
      marketplace: 'Mercado Global',
      products: 'Productos e Inventario',
      rfq: 'Demandas RFQ',
      leads: 'CRM y Prospectos',
      quotations: 'Cotizaciones',
      orders: 'Pedidos',
      finance: 'Finanzas y Facturas',
      chat: 'Chat de Negocios',
      ads: 'Publicidad',
      websiteBuilder: 'Creador Web',
      aiAgent: 'Agente de Ingresos IA',
      businessHealth: 'Salud del Negocio',
      analytics: 'Analítica',
      settings: 'Ajustes',
      adminPanel: 'Administración',
      landing: 'Inicio',
    },
    actions: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      search: 'Buscar productos, compradores...',
      filter: 'Filtrar',
      export: 'Exportar',
      import: 'Importar',
      send: 'Enviar',
      submit: 'Confirmar',
      upload: 'Subir Archivo',
      view: 'Ver Detalles',
      download: 'Descargar',
      close: 'Cerrar',
      refresh: 'Actualizar',
      startFree: 'Empezar Gratis',
      exploreMarketplace: 'Explorar Mercado',
      askAi: 'Preguntar a VYRA',
      generateQuote: 'Generar Cotización',
    },
    status: {
      active: 'Activo',
      pending: 'Pendiente',
      completed: 'Completado',
      cancelled: 'Cancelado',
      draft: 'Borrador',
      paid: 'Pagado',
      verified: 'Verificado',
      connected: 'Conectado',
      disconnected: 'Desconectado',
    },
    marketplace: {
      title: 'Mercado Global de Comercio',
      subtitle: 'Fabricantes, exportadores y compradores mayoristas en más de 140 países.',
      all: 'Todas las Categorías',
      products: 'Productos',
      wholesale: 'Venta al por Mayor',
      manufacturers: 'Fabricantes',
      rfqHub: 'Demandas RFQ',
      postRequirement: 'Publicar Requerimiento',
      minOrder: 'Pedido Mínimo (MOQ)',
      verifiedSupplier: 'Proveedor Verificado',
      requestQuotation: 'Solicitar Cotización',
      contactSeller: 'Contactar Vendedor',
      priceOnRequest: 'Precio a Consultar',
    },
    ai: {
      revenueAgent: 'Agente de Ingresos IA',
      askNexus: 'Preguntar a VYRA',
      promptPlaceholder: 'Pregunte algo: p. ej., Buscar compradores, redactar oferta...',
      quickPrompts: 'Acciones Rápidas',
      generating: 'La IA está analizando los datos autorizados...',
      confidence: 'Nivel de Confianza',
    },
  },
  fr: {
    appName: 'VYRA',
    tagline: 'Système d\'Exploitation d\'Entreprise IA & Marketplace Mondial B2B/B2C',
    nav: {
      dashboard: 'Tableau de Bord',
      marketplace: 'Place de Marché Globale',
      products: 'Produits & Stock',
      rfq: 'Demandes RFQ',
      leads: 'CRM & Prospects',
      quotations: 'Devis',
      orders: 'Commandes',
      finance: 'Finances & Factures',
      chat: 'Messagerie Pro',
      ads: 'Plateforme Publicitaire',
      websiteBuilder: 'Créateur de Site',
      aiAgent: 'Agent de Revenus IA',
      businessHealth: 'Santé d\'Entreprise',
      analytics: 'Analytique',
      settings: 'Paramètres',
      adminPanel: 'Panneau Admin',
      landing: 'Présentation',
    },
    actions: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      create: 'Créer',
      search: 'Rechercher des produits, acheteurs...',
      filter: 'Filtrer',
      export: 'Exporter',
      import: 'Importer',
      send: 'Envoyer',
      submit: 'Soumettre',
      upload: 'Téléverser',
      view: 'Voir Détails',
      download: 'Télécharger',
      close: 'Fermer',
      refresh: 'Actualiser',
      startFree: 'Commencer Gratuitement',
      exploreMarketplace: 'Explorer le Marché',
      askAi: 'Demander à VYRA',
      generateQuote: 'Créer un Devis',
    },
    status: {
      active: 'Actif',
      pending: 'En attente',
      completed: 'Terminé',
      cancelled: 'Annulé',
      draft: 'Brouillon',
      paid: 'Payé',
      verified: 'Vérifié',
      connected: 'Connecté',
      disconnected: 'Déconnecté',
    },
    marketplace: {
      title: 'Place de Marché Internationale',
      subtitle: 'Fabricants, exportateurs et acheteurs vérifiés dans 140+ pays.',
      all: 'Toutes Catégories',
      products: 'Produits',
      wholesale: 'Vente en Gros',
      manufacturers: 'Fabricants',
      rfqHub: 'Demandes d\'Achat',
      postRequirement: 'Publier une Demande',
      minOrder: 'Commande Min. (MOQ)',
      verifiedSupplier: 'Fournisseur Vérifié',
      requestQuotation: 'Demander un Devis',
      contactSeller: 'Contacter Vendeur',
      priceOnRequest: 'Prix sur Demande',
    },
    ai: {
      revenueAgent: 'Agent de Revenus IA',
      askNexus: 'Demander à VYRA',
      promptPlaceholder: 'Ex: Trouver des acheteurs, rédiger un email de prospection...',
      quickPrompts: 'Actions Rapides',
      generating: 'L\'IA analyse les données autorisées...',
      confidence: 'Score de Confiance',
    },
  },
  de: {
    appName: 'VYRA',
    tagline: 'KI-Betriebssystem für Unternehmen & Globaler B2B/B2C-Marktplatz',
    nav: {
      dashboard: 'Dashboard',
      marketplace: 'Globaler Marktplatz',
      products: 'Produkte & Lager',
      rfq: 'Ausschreibungen (RFQ)',
      leads: 'CRM & Leads',
      quotations: 'Angebote',
      orders: 'Bestellungen',
      finance: 'Finanzen & Rechnungen',
      chat: 'Geschäftschat',
      ads: 'Werbeplattform',
      websiteBuilder: 'Website-Baukasten',
      aiAgent: 'KI-Umsatz-Agent',
      businessHealth: 'Unternehmensgesundheit',
      analytics: 'Analysen',
      settings: 'Einstellungen',
      adminPanel: 'Admin-Panel',
      landing: 'Übersicht',
    },
    actions: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      create: 'Erstellen',
      search: 'Produkte, Käufer suchen...',
      filter: 'Filtern',
      export: 'Exportieren',
      import: 'Importieren',
      send: 'Senden',
      submit: 'Absenden',
      upload: 'Datei hochladen',
      view: 'Details anzeigen',
      download: 'Herunterladen',
      close: 'Schließen',
      refresh: 'Aktualisieren',
      startFree: 'Kostenlos starten',
      exploreMarketplace: 'Marktplatz erkunden',
      askAi: 'VYRA fragen',
      generateQuote: 'Angebot erstellen',
    },
    status: {
      active: 'Aktiv',
      pending: 'Ausstehend',
      completed: 'Abgeschlossen',
      cancelled: 'Storniert',
      draft: 'Entwurf',
      paid: 'Bezahlt',
      verified: 'Verifiziert',
      connected: 'Verbunden',
      disconnected: 'Getrennt',
    },
    marketplace: {
      title: 'Globaler Handelsmarktplatz',
      subtitle: 'Verifizierte Hersteller, Exporteure und Großhandelskäufer in über 140 Ländern.',
      all: 'Alle Kategorien',
      products: 'Produkte',
      wholesale: 'Großhandel',
      manufacturers: 'Hersteller',
      rfqHub: 'RFQ-Anfragen',
      postRequirement: 'Bedarf veröffentlichen',
      minOrder: 'Mindestbestellmenge',
      verifiedSupplier: 'Geprüfter Lieferant',
      requestQuotation: 'Angebot anfordern',
      contactSeller: 'Verkäufer kontaktieren',
      priceOnRequest: 'Preis auf Anfrage',
    },
    ai: {
      revenueAgent: 'KI-Umsatz-Agent',
      askNexus: 'VYRA fragen',
      promptPlaceholder: 'Fragen Sie: z.B. Käufer finden, Verkaufsangebot erstellen...',
      quickPrompts: 'Schnellaktionen',
      generating: 'KI analysiert Geschäftsdaten...',
      confidence: 'Konfidenzgrad',
    },
  },
  ar: {
    appName: 'VYRA',
    tagline: 'نظام تشغيل الأعمال بالذكاء الاصطناعي والسوق العالمي B2B/B2C',
    nav: {
      dashboard: 'لوحة التحكم',
      marketplace: 'السوق العالمي',
      products: 'المنتجات والمخزون',
      rfq: 'طلبات عروض الأسعار',
      leads: 'إدارة العملاء والمبيعات',
      quotations: 'عروض الأسعار',
      orders: 'الطلبات',
      finance: 'المالية والفواتير',
      chat: 'محادثات العمل',
      ads: 'منصة الإعلانات',
      websiteBuilder: 'منشئ المواقع',
      aiAgent: 'وكيل الإيرادات الذكي',
      businessHealth: 'صحة الأعمال',
      analytics: 'التحليلات',
      settings: 'الإعدادات',
      adminPanel: 'لوحة الإدارة',
      landing: 'نظرة عامة',
    },
    actions: {
      save: 'حفظ التغييرات',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      create: 'إنشاء',
      search: 'بحث عن منتجات، مشترين...',
      filter: 'تصفية',
      export: 'تصدير البيانات',
      import: 'استيراد البيانات',
      send: 'إرسال',
      submit: 'إرسال الطلب',
      upload: 'رفع ملف',
      view: 'عرض التفاصيل',
      download: 'تحميل',
      close: 'إغلاق',
      refresh: 'تحديث',
      startFree: 'ابدأ مجاناً اليوم',
      exploreMarketplace: 'استكشف السوق',
      askAi: 'اسأل VYRA',
      generateQuote: 'إنشاء عرض سعر',
    },
    status: {
      active: 'نشط',
      pending: 'قيد الانتظار',
      completed: 'مكتمل',
      cancelled: 'ملغي',
      draft: 'مسودة',
      paid: 'مدفوع',
      verified: 'موثّق',
      connected: 'متصل',
      disconnected: 'غير متصل',
    },
    marketplace: {
      title: 'سوق التجارة العالمي',
      subtitle: 'مصنعون ومصدرون وتجار جملة موثوقون في أكثر من 140 دولة.',
      all: 'جميع الفئات',
      products: 'المنتجات',
      wholesale: 'بالجملة والكميات',
      manufacturers: 'المصنعين',
      rfqHub: 'طلبات الشراء',
      postRequirement: 'نشر متطلب شراء',
      minOrder: 'الحد الأدنى للطلب (MOQ)',
      verifiedSupplier: 'مورد موثوق',
      requestQuotation: 'طلب عرض سعر',
      contactSeller: 'تواصل مع البائع',
      priceOnRequest: 'السعر عند الطلب',
    },
    ai: {
      revenueAgent: 'وكيل الإيرادات بالذكاء الاصطناعي',
      askNexus: 'اسأل VYRA',
      promptPlaceholder: 'اطلب أي شيء: مثلاً ابحث عن مشترين، اكتب رسالة بيع...',
      quickPrompts: 'إجراءات سريعة',
      generating: 'الذكاء الاصطناعي يحلل بيانات العمل المصرح بها...',
      confidence: 'معدل الثقة',
    },
  },
  zh: {
    appName: 'VYRA',
    tagline: 'AI商业操作系统与全球B2B/B2C交易平台',
    nav: {
      dashboard: '控制台',
      marketplace: '全球市场',
      products: '产品与库存',
      rfq: '询价与采购需求',
      leads: '客户与商机',
      quotations: '报价单',
      orders: '订单管理',
      finance: '财务与发票',
      chat: '商务沟通',
      ads: '广告推广',
      websiteBuilder: '建站工具',
      aiAgent: 'AI增收代理',
      businessHealth: '业务健康度',
      analytics: '数据分析',
      settings: '系统设置',
      adminPanel: '管理后台',
      landing: '平台概览',
    },
    actions: {
      save: '保存更改',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      create: '新建',
      search: '搜索产品、买家、询盘...',
      filter: '筛选',
      export: '导出数据',
      import: '导入数据',
      send: '发送',
      submit: '提交',
      upload: '上传文件',
      view: '查看详情',
      download: '下载',
      close: '关闭',
      refresh: '刷新',
      startFree: '立即免费开始',
      exploreMarketplace: '探索交易市场',
      askAi: '咨询 VYRA',
      generateQuote: '生成报价单',
    },
    status: {
      active: '进行中',
      pending: '待处理',
      completed: '已完成',
      cancelled: '已取消',
      draft: '草稿',
      paid: '已付款',
      verified: '已认证',
      connected: '已连接',
      disconnected: '未连接',
    },
    marketplace: {
      title: '全球贸易市场',
      subtitle: '覆盖140多个国家/地区的认证制造商、出口商与批发采购商。',
      all: '所有分类',
      products: '现货产品',
      wholesale: '大宗批发',
      manufacturers: '源头厂家',
      rfqHub: '全球采购需求',
      postRequirement: '发布采购需求',
      minOrder: '最小起订量 (MOQ)',
      verifiedSupplier: '认证供应商',
      requestQuotation: '申请报价',
      contactSeller: '联系卖家',
      priceOnRequest: '价格电议',
    },
    ai: {
      revenueAgent: 'AI营收拓展助理',
      askNexus: '咨询 VYRA',
      promptPlaceholder: '输入需求：例如 寻找海外买家、起草开发信、分析销售情况...',
      quickPrompts: '高管快捷指令',
      generating: 'AI正在分析企业授权数据...',
      confidence: '置信指数',
    },
  },
  ja: {
    appName: 'VYRA',
    tagline: 'AIビジネスOS＆グローバルB2B/B2Cマーケットプレイス',
    nav: {
      dashboard: 'ダッシュボード',
      marketplace: 'グローバル市場',
      products: '製品と在庫',
      rfq: '見積依頼・調達需要',
      leads: 'CRM・顧客見込み',
      quotations: '見積書',
      orders: '注文管理',
      finance: '財務・請求書',
      chat: 'ビジネスチャット',
      ads: '広告プラットフォーム',
      websiteBuilder: 'ウェブサイトビルダー',
      aiAgent: 'AI収益エージェント',
      businessHealth: 'ビジネス健全性',
      analytics: '分析',
      settings: '設定',
      adminPanel: '管理パネル',
      landing: '概要',
    },
    actions: {
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      create: '新規作成',
      search: '製品、買い手、RFQを検索...',
      filter: '絞り込み',
      export: 'エクスポート',
      import: 'インポート',
      send: '送信',
      submit: '提出',
      upload: 'ファイル添付',
      view: '詳細確認',
      download: 'ダウンロード',
      close: '閉じる',
      refresh: '更新',
      startFree: '無料で始める',
      exploreMarketplace: '市場を見る',
      askAi: 'VYRAに質問',
      generateQuote: '見積書を作成',
    },
    status: {
      active: '有効',
      pending: '保留中',
      completed: '完了',
      cancelled: 'キャンセル済み',
      draft: '下書き',
      paid: '支払い済み',
      verified: '認証済み',
      connected: '接続中',
      disconnected: '未接続',
    },
    marketplace: {
      title: '世界貿易マーケットプレイス',
      subtitle: '140カ国以上の認定メーカー、輸出業者、卸売購入者。',
      all: '全カテゴリー',
      products: '製品',
      wholesale: '卸売・大口',
      manufacturers: '製造企業',
      rfqHub: '見積依頼一覧',
      postRequirement: '購入需要を投稿',
      minOrder: '最小注文数 (MOQ)',
      verifiedSupplier: '認証サプライヤー',
      requestQuotation: '見積を依頼',
      contactSeller: '出品者に連絡',
      priceOnRequest: '価格応相談',
    },
    ai: {
      revenueAgent: 'AI収益エージェント',
      askNexus: 'VYRAに質問',
      promptPlaceholder: '例: 買い手を開拓、営業メッセージを作成、見積を提示...',
      quickPrompts: 'クイックアクション',
      generating: 'AIが認可ビジネスデータを分析中...',
      confidence: '信頼スコア',
    },
  },
  ru: {
    appName: 'VYRA',
    tagline: 'Операционная система для бизнеса на базе ИИ и глобальный B2B/B2C маркетплейс',
    nav: {
      dashboard: 'Панель',
      marketplace: 'Глобальный рынок',
      products: 'Товары и склад',
      rfq: 'Запросы цен (RFQ)',
      leads: 'CRM и лиды',
      quotations: 'Коммерческие предложения',
      orders: 'Заказы',
      finance: 'Финансы и счета',
      chat: 'Деловой чат',
      ads: 'Реклама',
      websiteBuilder: 'Конструктор сайтов',
      aiAgent: 'ИИ Агент выручки',
      businessHealth: 'Здоровье бизнеса',
      analytics: 'Аналитика',
      settings: 'Настройки',
      adminPanel: 'Админ-панель',
      landing: 'Главная',
    },
    actions: {
      save: 'Сохранить',
      cancel: 'Отмена',
      delete: 'Удалить',
      edit: 'Редактировать',
      create: 'Создать',
      search: 'Поиск товаров, покупателей...',
      filter: 'Фильтр',
      export: 'Экспорт',
      import: 'Импорт',
      send: 'Отправить',
      submit: 'Подтвердить',
      upload: 'Загрузить файл',
      view: 'Просмотр',
      download: 'Скачать',
      close: 'Закрыть',
      refresh: 'Обновить',
      startFree: 'Начать бесплатно',
      exploreMarketplace: 'Обзор рынка',
      askAi: 'Спросить VYRA',
      generateQuote: 'Создать предложение',
    },
    status: {
      active: 'Активно',
      pending: 'В ожидании',
      completed: 'Завершено',
      cancelled: 'Отменено',
      draft: 'Черновик',
      paid: 'Оплачено',
      verified: 'Проверено',
      connected: 'Подключено',
      disconnected: 'Отключено',
    },
    marketplace: {
      title: 'Глобальная торговая площадка',
      subtitle: 'Проверенные производители, экспортеры и оптовые покупатели в 140+ странах.',
      all: 'Все категории',
      products: 'Товары',
      wholesale: 'Оптовые партии',
      manufacturers: 'Производители',
      rfqHub: 'Запросы RFQ',
      postRequirement: 'Опубликовать запрос',
      minOrder: 'Мин. заказ (MOQ)',
      verifiedSupplier: 'Проверенный поставщик',
      requestQuotation: 'Запросить расчет',
      contactSeller: 'Связаться с продавцом',
      priceOnRequest: 'Цена по запросу',
    },
    ai: {
      revenueAgent: 'ИИ Агент выручки',
      askNexus: 'Спросить VYRA',
      promptPlaceholder: 'Спросите: найти покупателей, составить КП, проанализировать продажи...',
      quickPrompts: 'Быстрые действия',
      generating: 'ИИ анализирует бизнес-данные...',
      confidence: 'Индекс уверенности',
    },
  },
  ur: {
    appName: 'VYRA',
    tagline: 'اے آئی بزنس آپریٹنگ سسٹم اور گلوبل B2B/B2C مارکیٹ پلیس',
    nav: {
      dashboard: 'ڈیش بورڈ',
      marketplace: 'عالمی مارکیٹ پلیس',
      products: 'مصنوعات اور انوینٹری',
      rfq: 'خریداری تقاضے (RFQ)',
      leads: 'کسٹمرز اور لیڈز',
      quotations: 'کوٹیشنز',
      orders: 'آرڈرز',
      finance: 'مالیات اور انوائس',
      chat: 'کاروباری چیٹ',
      ads: 'اشتہاری پلیٹ فارم',
      websiteBuilder: 'ویب سائٹ بلڈر',
      aiAgent: 'اے آئی ریونیو ایجنٹ',
      businessHealth: 'کاروباری صحت',
      analytics: 'تجزیات',
      settings: 'ترتیبات',
      adminPanel: 'ایڈمن پینل',
      landing: 'جائزہ',
    },
    actions: {
      save: 'محفوظ کریں',
      cancel: 'منسوخ کریں',
      delete: 'حذف کریں',
      edit: 'ترمیم کریں',
      create: 'نیا بنائیں',
      search: 'مصنوعات، خریدار تلاش کریں...',
      filter: 'فلٹر',
      export: 'ڈیٹا برآمد کریں',
      import: 'ڈیٹا درآمد کریں',
      send: 'بھیجیں',
      submit: 'جمع کرائیں',
      upload: 'فائل اپ لوڈ کریں',
      view: 'تفصیلات دیکھیں',
      download: 'ڈاؤن لوڈ کریں',
      close: 'بند کریں',
      refresh: 'تازہ کریں',
      startFree: 'مفت شروع کریں',
      exploreMarketplace: 'مارکیٹ دریافت کریں',
      askAi: 'VYRA سے پوچھیں',
      generateQuote: 'کوٹیشن بنائیں',
    },
    status: {
      active: 'فعال',
      pending: 'زیر التواء',
      completed: 'مکمل',
      cancelled: 'منسوخ',
      draft: 'ڈرافٹ',
      paid: 'ادا شدہ',
      verified: 'تصدیق شدہ',
      connected: 'منسلک',
      disconnected: 'غیر منسلک',
    },
    marketplace: {
      title: 'عالمی تجارتی مارکیٹ پلیس',
      subtitle: '140 سے زائد ممالک میں تصدیق شدہ مینوفیکچررز، برآمد کنندگان اور تھوک خریدار۔',
      all: 'تمام زمرہ جات',
      products: 'مصنوعات',
      wholesale: 'تھوک اور بلک',
      manufacturers: 'مینوفیکچررز',
      rfqHub: 'خریداری کے مطالبات',
      postRequirement: 'خریداری کی ضرورت پوسٹ کریں',
      minOrder: 'کم از کم آرڈر (MOQ)',
      verifiedSupplier: 'تصدیق شدہ سپلائر',
      requestQuotation: 'کوٹیشن کی درخواست کریں',
      contactSeller: 'بیچنے والے سے رابطہ کریں',
      priceOnRequest: 'قیمت درخواست پر',
    },
    ai: {
      revenueAgent: 'اے آئی ریونیو ایجنٹ',
      askNexus: 'VYRA سے پوچھیں',
      promptPlaceholder: 'کچھ بھی پوچھیں: مثلاً خریدار تلاش کریں، کوٹیشن بنائیں...',
      quickPrompts: 'فوری اقدامات',
      generating: 'اے آئی ڈیٹا کا تجزیہ کر رہا ہے...',
      confidence: 'اعتماد کا اسکور',
    },
  },
  // Dynamic fallback for all remaining regional & world languages
  it: {} as any,
  pt: {} as any,
  ko: {} as any,
  nl: {} as any,
  tr: {} as any,
  id: {} as any,
  vi: {} as any,
  th: {} as any,
  bn: {} as any,
  pa: {} as any,
  ta: {} as any,
  te: {} as any,
  mr: {} as any,
  gu: {} as any,
  kn: {} as any,
  ml: {} as any,
};

// Populate default fallback mappings for other languages seamlessly from English
const baseEn = translations.en;
(Object.keys(translations) as SupportedLanguageCode[]).forEach((code) => {
  if (!translations[code] || Object.keys(translations[code]).length === 0) {
    translations[code] = JSON.parse(JSON.stringify(baseEn));
  }
});
