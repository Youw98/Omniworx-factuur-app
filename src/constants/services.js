// 9% BTW (Tabel I, post b-7 Wet OB 1968, Belastingdienst):
//   - Isoleren, schilderen, stukadoren en behangen van woningen ouder dan 2 jaar → 9%
//   - Schoonmaakwerk in woningen → 9% (geen leeftijdseis)
//   - Laminaat/parket leggen in woningen ouder dan 2 jaar → 9%
//   - Tegelzetten is géén verminderd tarief → 21%
// All other construction and installation work: 21%.
export const SERVICES = [
  // ── Primaire diensten ────────────────────────────────────────────────────
  { id: 'renovatie',         icon: '🔨', nl: 'Renovatie',                       en: 'Renovation',                    ar: 'أعمال التجديد',                        isPrimary: true,  defaultBtwRate: 21 },
  { id: 'schilderwerk',      icon: '🎨', nl: 'Schilderwerk',                    en: 'Painting',                      ar: 'أعمال الدهانات',                       isPrimary: true,  defaultBtwRate: 9  },
  { id: 'stukadoorwerk',     icon: '🪣', nl: 'Stukadoorwerk',                   en: 'Plastering',                    ar: 'أعمال الجبس والليّاسة',                isPrimary: true,  defaultBtwRate: 9  },
  { id: 'laminaat',          icon: '🪵', nl: 'Laminaat / Parket leggen',         en: 'Laminate / Parquet Flooring',   ar: 'تركيب الباركيه والألواح الخشبية',      isPrimary: true,  defaultBtwRate: 9  },
  { id: 'tegels',            icon: '🔲', nl: 'Tegelzetten',                     en: 'Tile Installation',             ar: 'تركيب البلاط والسيراميك',              isPrimary: true,  defaultBtwRate: 21 },
  { id: 'loodgieter',        icon: '🚿', nl: 'Loodgieterwerk',                  en: 'Plumbing Services',             ar: 'أعمال السباكة',                        isPrimary: true,  defaultBtwRate: 21 },
  { id: 'elektra',           icon: '⚡', nl: 'Elektra',                         en: 'Electrical Work',               ar: 'أعمال الكهرباء',                       isPrimary: true,  defaultBtwRate: 21 },
  // ── Overige diensten ─────────────────────────────────────────────────────
  { id: 'behangen',          icon: '🖼️', nl: 'Behangen',                        en: 'Wallpapering',                  ar: 'تركيب ورق الجدران',                    isPrimary: false, defaultBtwRate: 9  },
  { id: 'isoleren',          icon: '🌡️', nl: 'Isolatiewerk',                    en: 'Insulation Work',               ar: 'أعمال العزل الحراري',                  isPrimary: false, defaultBtwRate: 9  },
  { id: 'schoonmaakwerk',    icon: '🧹', nl: 'Schoonmaakwerk',                  en: 'Cleaning Services',             ar: 'خدمات التنظيف',                        isPrimary: false, defaultBtwRate: 9  },
  { id: 'sloopwerk',         icon: '⛏️', nl: 'Sloopwerk',                       en: 'Demolition',                    ar: 'أعمال الهدم',                          isPrimary: false, defaultBtwRate: 21 },
  { id: 'timmerwerk',        icon: '🪚', nl: 'Timmerwerk',                      en: 'Carpentry',                     ar: 'النجارة',                              isPrimary: false, defaultBtwRate: 21 },
  { id: 'tuinonderhoud',     icon: '🌿', nl: 'Tuinonderhoud',                   en: 'Landscaping',                   ar: 'تنسيق الحدائق',                        isPrimary: false, defaultBtwRate: 21 },
  { id: 'bouwvoorbereiding', icon: '🏗️', nl: 'Bouwvoorbereiding',               en: 'Site Preparation',              ar: 'تحضير الموقع',                         isPrimary: false, defaultBtwRate: 21 },
  { id: 'fundering',         icon: '🧱', nl: 'Fundering',                       en: 'Foundation Work',               ar: 'أعمال الأساسات',                       isPrimary: false, defaultBtwRate: 21 },
  { id: 'raamwerk',          icon: '🔩', nl: 'Raamwerk',                        en: 'Framing',                       ar: 'الهيكل الإنشائي',                      isPrimary: false, defaultBtwRate: 21 },
  { id: 'other',             icon: '📝', nl: 'Anders (vrije tekst)',             en: 'Other (custom)',                ar: 'أخرى (نص حر)',                         isPrimary: false, defaultBtwRate: 21 },
]

export const BTW_RATES = [0, 9, 21]
