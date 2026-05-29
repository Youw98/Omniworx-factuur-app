// BTW-tarieven op werkzaamheden aan woningen — geldig 2026 (Belastingdienst.nl):
//
// 9% — woningen ouder dan 2 jaar (Tabel I, post b-7, Wet OB 1968):
//   Schilderen · stukadoren · behangen · isoleren
//   Vloerbedekking leggen (laminaat, parket, tapijt, PVC — GEEN tegels)
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
//   Tegelzetten · metselwerk · dakdekken · kozijnen/ramen · CV-installatie
//   Ventilatie · loodgieterwerk · elektra · sloopwerk · timmerwerk · etc.
//
// Splits bij gecombineerd werk: vermeld 9%- en 21%-posten apart op offerte/factuur.
export const SERVICES = [
  // ── Primaire diensten ────────────────────────────────────────────────────
  { id: 'renovatie',         icon: '🔨', nl: 'Renovatie',                       en: 'Renovation',                      ar: 'أعمال التجديد',                          isPrimary: true,  defaultBtwRate: 21 },
  { id: 'schilderwerk',      icon: '🎨', nl: 'Schilderwerk',                    en: 'Painting',                        ar: 'أعمال الدهانات',                         isPrimary: true,  defaultBtwRate: 9  },
  { id: 'stukadoorwerk',     icon: '🪣', nl: 'Stukadoorwerk',                   en: 'Plastering',                      ar: 'أعمال الجبس والليّاسة',                  isPrimary: true,  defaultBtwRate: 9  },
  { id: 'laminaat',          icon: '🪵', nl: 'Laminaat / Parket leggen',         en: 'Laminate / Parquet Flooring',     ar: 'تركيب الباركيه والألواح الخشبية',        isPrimary: true,  defaultBtwRate: 9  },
  { id: 'tegels',            icon: '🔲', nl: 'Tegelzetten',                     en: 'Tile Installation',               ar: 'تركيب البلاط والسيراميك',                isPrimary: true,  defaultBtwRate: 21 },
  { id: 'loodgieter',        icon: '🚿', nl: 'Loodgieterwerk',                  en: 'Plumbing Services',               ar: 'أعمال السباكة',                          isPrimary: true,  defaultBtwRate: 21 },
  { id: 'elektra',           icon: '⚡', nl: 'Elektra',                         en: 'Electrical Work',                 ar: 'أعمال الكهرباء',                         isPrimary: true,  defaultBtwRate: 21 },
  // ── Overige diensten — 9% ────────────────────────────────────────────────
  { id: 'behangen',          icon: '🖼️', nl: 'Behangen',                        en: 'Wallpapering',                    ar: 'تركيب ورق الجدران',                      isPrimary: false, defaultBtwRate: 9  },
  { id: 'tapijt',            icon: '🛋️', nl: 'Tapijt / PVC-vloer leggen',       en: 'Carpet / PVC Floor Installation', ar: 'تركيب السجاد والأرضيات البلاستيكية',     isPrimary: false, defaultBtwRate: 9  },
  { id: 'isoleren',          icon: '🌡️', nl: 'Isolatiewerk',                    en: 'Insulation Work',                 ar: 'أعمال العزل الحراري',                    isPrimary: false, defaultBtwRate: 9  },
  { id: 'schoonmaakwerk',    icon: '🧹', nl: 'Schoonmaakwerk',                  en: 'Cleaning Services',               ar: 'خدمات التنظيف',                          isPrimary: false, defaultBtwRate: 9  },
  // ── Overige diensten — 0% ────────────────────────────────────────────────
  { id: 'zonnepanelen',      icon: '☀️', nl: 'Zonnepanelen installeren',         en: 'Solar Panel Installation',        ar: 'تركيب الألواح الشمسية',                  isPrimary: false, defaultBtwRate: 0  },
  // ── Overige diensten — 21% ───────────────────────────────────────────────
  { id: 'metselwerk',        icon: '🪨', nl: 'Metselwerk',                      en: 'Masonry / Bricklaying',           ar: 'أعمال البناء والبنّاء',                   isPrimary: false, defaultBtwRate: 21 },
  { id: 'dakwerk',           icon: '🏠', nl: 'Dakdekken / Dakwerk',             en: 'Roofing',                         ar: 'أعمال السطح والتسقيف',                   isPrimary: false, defaultBtwRate: 21 },
  { id: 'kozijnen',          icon: '🪟', nl: 'Kozijnen / Ramen plaatsen',        en: 'Window Frame Installation',       ar: 'تركيب النوافذ والإطارات',                isPrimary: false, defaultBtwRate: 21 },
  { id: 'cv_installatie',    icon: '♨️', nl: 'CV-installatie / Verwarming',      en: 'Central Heating Installation',    ar: 'تركيب نظام التدفئة المركزية',            isPrimary: false, defaultBtwRate: 21 },
  { id: 'ventilatie',        icon: '💨', nl: 'Ventilatie',                       en: 'Ventilation',                     ar: 'تركيب نظام التهوية',                     isPrimary: false, defaultBtwRate: 21 },
  { id: 'sloopwerk',         icon: '⛏️', nl: 'Sloopwerk',                       en: 'Demolition',                      ar: 'أعمال الهدم',                            isPrimary: false, defaultBtwRate: 21 },
  { id: 'timmerwerk',        icon: '🪚', nl: 'Timmerwerk',                      en: 'Carpentry',                       ar: 'النجارة',                                isPrimary: false, defaultBtwRate: 21 },
  { id: 'tuinonderhoud',     icon: '🌿', nl: 'Tuinonderhoud',                   en: 'Landscaping',                     ar: 'تنسيق الحدائق',                          isPrimary: false, defaultBtwRate: 21 },
  { id: 'bouwvoorbereiding', icon: '🏗️', nl: 'Bouwvoorbereiding',               en: 'Site Preparation',                ar: 'تحضير الموقع',                           isPrimary: false, defaultBtwRate: 21 },
  { id: 'fundering',         icon: '🧱', nl: 'Fundering',                       en: 'Foundation Work',                 ar: 'أعمال الأساسات',                         isPrimary: false, defaultBtwRate: 21 },
  { id: 'raamwerk',          icon: '🔩', nl: 'Raamwerk',                        en: 'Framing',                         ar: 'الهيكل الإنشائي',                        isPrimary: false, defaultBtwRate: 21 },
  { id: 'other',             icon: '📝', nl: 'Anders (vrije tekst)',             en: 'Other (custom)',                  ar: 'أخرى (نص حر)',                           isPrimary: false, defaultBtwRate: 21 },
]

export const BTW_RATES = [0, 9, 21]
