// BTW-tarieven op werkzaamheden aan woningen — geldig 2026 (Belastingdienst.nl):
//
// 9% — woningen ouder dan 2 jaar (Tabel I, post b-7, Wet OB 1968):
//   Schilderen · stukadoren · behangen · isolatie-arbeid
//   Let op: bij gemengde panden (woon/werk) geldt 9% alleen voor het
//   aantoonbaar woongedeelte; commercieel deel 21% (wijziging per 1-7-2025).
//
// 9% — geen leeftijdseis:
//   Schoonmaakwerk in woningen
//
// 0% — bijzonder tarief (ongewijzigd in 2026):
//   Levering + installatie van zonnepanelen op of bij woningen
//   (Uitzondering: geïntegreerde panelen op nieuwbouw → 21%)
//
// 21% — alles overige bouw- en installatiewerk:
//   Tegelzetten · laminaat/parket · tapijt/PVC · metselwerk · dakdekken
//   Kozijnen/ramen · CV-installatie · ventilatie · loodgieterwerk · elektra
//   Sloopwerk · timmerwerk · isolatiemateriaal · etc.
//
// Splits bij gecombineerd werk: vermeld 9%- en 21%-posten apart op offerte/factuur.

// Prijzen excl. BTW — bron: Omniworx prijslijst 2025-2026 (gecontroleerd)
export const SERVICES = [
  // ── Primaire diensten ────────────────────────────────────────────────────
  { id: 'renovatie',         icon: '🔨', nl: 'Renovatie',                           en: 'Renovation',                        ar: 'أعمال التجديد',                       isPrimary: true,  defaultBtwRate: 21, unit: 'uur',  defaultPrice: 65,  minPrice: 45,  maxPrice: 95  },
  { id: 'schilderwerk',      icon: '🎨', nl: 'Schilderwerk',                        en: 'Painting',                          ar: 'أعمال الدهانات',                      isPrimary: true,  defaultBtwRate: 9,  unit: 'm²',  defaultPrice: 28,  minPrice: 10,  maxPrice: 32  },
  { id: 'stukadoorwerk',     icon: '🪣', nl: 'Stukadoorwerk',                       en: 'Plastering',                        ar: 'أعمال الجبس والليّاسة',               isPrimary: true,  defaultBtwRate: 9,  unit: 'm²',  defaultPrice: 32,  minPrice: 18,  maxPrice: 55  },
  { id: 'laminaat',          icon: '🪵', nl: 'Laminaat / Parket leggen',             en: 'Laminate / Parquet Flooring',       ar: 'تركيب الباركيه والألواح الخشبية',     isPrimary: true,  defaultBtwRate: 21, unit: 'm²',  defaultPrice: 14,  minPrice: 8,   maxPrice: 25  },
  { id: 'tegels',            icon: '🔲', nl: 'Tegelzetten',                         en: 'Tile Installation',                 ar: 'تركيب البلاط والسيراميك',             isPrimary: true,  defaultBtwRate: 21, unit: 'm²',  defaultPrice: 40,  minPrice: 22,  maxPrice: 70  },
  { id: 'loodgieter',        icon: '🚿', nl: 'Loodgieterwerk',                      en: 'Plumbing Services',                 ar: 'أعمال السباكة',                       isPrimary: true,  defaultBtwRate: 21, unit: 'uur',  defaultPrice: 75,  minPrice: 55,  maxPrice: 105 },
  { id: 'elektra',           icon: '⚡', nl: 'Elektra',                             en: 'Electrical Work',                   ar: 'أعمال الكهرباء',                      isPrimary: true,  defaultBtwRate: 21, unit: 'uur',  defaultPrice: 80,  minPrice: 55,  maxPrice: 115 },
  // ── Overige diensten — 9% ────────────────────────────────────────────────
  { id: 'behangen',          icon: '🖼️', nl: 'Behangen',                            en: 'Wallpapering',                      ar: 'تركيب ورق الجدران',                   isPrimary: false, defaultBtwRate: 9,  unit: 'm²',  defaultPrice: 15,  minPrice: 8,   maxPrice: 26  },
  { id: 'tapijt',            icon: '🛋️', nl: 'Tapijt / PVC-vloer leggen',           en: 'Carpet / PVC Floor Installation',   ar: 'تركيب السجاد والأرضيات البلاستيكية', isPrimary: false, defaultBtwRate: 21, unit: 'm²',  defaultPrice: 10,  minPrice: 5,   maxPrice: 18  },
  { id: 'isoleren',          icon: '🌡️', nl: 'Isolatiewerk',                        en: 'Insulation Work',                   ar: 'أعمال العزل الحراري',                 isPrimary: false, defaultBtwRate: 9,  unit: 'm²',  defaultPrice: 35,  minPrice: 15,  maxPrice: 65  },
  { id: 'schoonmaakwerk',    icon: '🧹', nl: 'Schoonmaakwerk',                      en: 'Cleaning Services',                 ar: 'خدمات التنظيف',                       isPrimary: false, defaultBtwRate: 9,  unit: 'uur',  defaultPrice: 32,  minPrice: 22,  maxPrice: 48  },
  // ── Overige diensten — 0% ────────────────────────────────────────────────
  { id: 'zonnepanelen',      icon: '☀️', nl: 'Zonnepanelen leveren & installeren',   en: 'Solar Panel Supply & Installation', ar: 'توريد وتركيب الألواح الشمسية',        isPrimary: false, defaultBtwRate: 0,  unit: 'stuk', defaultPrice: 400, minPrice: 180, maxPrice: 420 },
  // ── Overige diensten — 21% ───────────────────────────────────────────────
  { id: 'metselwerk',        icon: '🪨', nl: 'Metselwerk',                          en: 'Masonry / Bricklaying',             ar: 'أعمال البناء بالطوب',                 isPrimary: false, defaultBtwRate: 21, unit: 'm²',  defaultPrice: 95,  minPrice: 60,  maxPrice: 160 },
  { id: 'dakwerk',           icon: '🏠', nl: 'Dakdekken / Dakwerk',                 en: 'Roofing / Roof Work',               ar: 'أعمال السطح والتسقيف',                isPrimary: false, defaultBtwRate: 21, unit: 'm²',  defaultPrice: 72,  minPrice: 40,  maxPrice: 130 },
  { id: 'kozijnen',          icon: '🪟', nl: 'Kozijnen / Ramen plaatsen',            en: 'Window and Frame Installation',     ar: 'تركيب النوافذ والإطارات',             isPrimary: false, defaultBtwRate: 21, unit: 'stuk', defaultPrice: 280, minPrice: 150, maxPrice: 600 },
  { id: 'cv_installatie',    icon: '♨️', nl: 'CV-installatie / Verwarming',          en: 'Central Heating Installation',      ar: 'تركيب نظام التدفئة المركزية',         isPrimary: false, defaultBtwRate: 21, unit: 'uur',  defaultPrice: 75,  minPrice: 55,  maxPrice: 105 },
  { id: 'ventilatie',        icon: '💨', nl: 'Ventilatie',                           en: 'Ventilation Installation',          ar: 'تركيب نظام التهوية',                  isPrimary: false, defaultBtwRate: 21, unit: 'uur',  defaultPrice: 70,  minPrice: 50,  maxPrice: 95  },
  { id: 'sloopwerk',         icon: '⛏️', nl: 'Sloopwerk',                           en: 'Demolition',                        ar: 'أعمال الهدم',                         isPrimary: false, defaultBtwRate: 21, unit: 'uur',  defaultPrice: 52,  minPrice: 35,  maxPrice: 75  },
  { id: 'timmerwerk',        icon: '🪚', nl: 'Timmerwerk',                          en: 'Carpentry',                         ar: 'النجارة',                             isPrimary: false, defaultBtwRate: 21, unit: 'uur',  defaultPrice: 65,  minPrice: 45,  maxPrice: 90  },
  { id: 'tuinonderhoud',     icon: '🌿', nl: 'Tuinonderhoud',                       en: 'Garden Maintenance',                ar: 'صيانة الحدائق',                       isPrimary: false, defaultBtwRate: 21, unit: 'uur',  defaultPrice: 42,  minPrice: 25,  maxPrice: 65  },
  { id: 'bouwvoorbereiding', icon: '🏗️', nl: 'Bouwvoorbereiding',                   en: 'Site Preparation',                  ar: 'تحضير الموقع',                        isPrimary: false, defaultBtwRate: 21, unit: 'uur',  defaultPrice: 58,  minPrice: 40,  maxPrice: 85  },
  { id: 'fundering',         icon: '🧱', nl: 'Fundering',                           en: 'Foundation Work',                   ar: 'أعمال الأساسات',                      isPrimary: false, defaultBtwRate: 21, unit: 'm²',  defaultPrice: 185, minPrice: 95,  maxPrice: 320 },
  { id: 'raamwerk',          icon: '🔩', nl: 'Raamwerk',                            en: 'Framing',                           ar: 'الهيكل الإنشائي',                     isPrimary: false, defaultBtwRate: 21, unit: 'm²',  defaultPrice: 80,  minPrice: 45,  maxPrice: 130 },
  { id: 'other',             icon: '📝', nl: 'Anders (vrije tekst)',                 en: 'Other (custom)',                    ar: 'أخرى (نص حر)',                        isPrimary: false, defaultBtwRate: 21, unit: 'uur',  defaultPrice: 0,   minPrice: 0,   maxPrice: 0   },
]

// Beschikbare eenheden voor regelposten
export const UNITS = [
  { value: 'uur',  nl: 'uur',  en: 'hr',  ar: 'ساعة' },
  { value: 'm²',   nl: 'm²',   en: 'm²',  ar: 'm²'   },
  { value: 'm',    nl: 'm',    en: 'm',   ar: 'م'    },
  { value: 'm³',   nl: 'm³',   en: 'm³',  ar: 'm³'   },
  { value: 'stuk', nl: 'stuk', en: 'pc',  ar: 'قطعة' },
  { value: 'dag',  nl: 'dag',  en: 'day', ar: 'يوم'  },
]

export const BTW_RATES = [0, 9, 21]
