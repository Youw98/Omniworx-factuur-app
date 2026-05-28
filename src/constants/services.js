// defaultBtwRate: 9% applies to painting/plastering/floor-laying on homes older than 2 years
// (Tabel I, post b-7 Wet OB 1968, Belastingdienst). All other construction services: 21%.
export const SERVICES = [
  { id: 'renovatie',         icon: '🔨', nl: 'Renovatie',                       en: 'Renovation',               ar: 'التجديد',                              isPrimary: true,  defaultBtwRate: 21 },
  { id: 'binnen_buiten',     icon: '🎨', svgIcon: 'paint-roller', nl: 'Binnen- & Buitenafwerkingen',     en: 'Interior & Exterior Finishes', ar: 'التشطيبات الداخلية والخارجية',      isPrimary: true,  defaultBtwRate: 9  },
  { id: 'afwerkingen',       icon: '✨', svgIcon: 'paint-roller', nl: 'Afwerkingen',                     en: 'Finishes',                 ar: 'التشطيبات',                            isPrimary: true,  defaultBtwRate: 9  },
  { id: 'vloerleggen',       icon: '🪵', nl: 'Vloerleggen',                     en: 'Flooring Installation',    ar: 'تركيب الأرضيات',                       isPrimary: true,  defaultBtwRate: 9  },
  { id: 'loodgieter',        icon: '🚿', nl: 'Loodgieterwerk',                  en: 'Plumbing Services',        ar: 'أعمال السباكة',                        isPrimary: true,  defaultBtwRate: 21 },
  { id: 'elektra',           icon: '⚡', nl: 'Elektra',                         en: 'Electrical Work',          ar: 'أعمال الكهرباء',                       isPrimary: true,  defaultBtwRate: 21 },
  { id: 'sloopwerk',         icon: '⛏️', nl: 'Sloopwerk',                       en: 'Demolition',               ar: 'أعمال الهدم',                          isPrimary: false, defaultBtwRate: 21 },
  { id: 'timmerwerk',        icon: '🪚', nl: 'Timmerwerk',                      en: 'Carpentry',                ar: 'النجارة',                              isPrimary: false, defaultBtwRate: 21 },
  { id: 'tuinonderhoud',     icon: '🌿', nl: 'Tuinonderhoud',                   en: 'Landscaping',              ar: 'تنسيق الحدائق',                        isPrimary: false, defaultBtwRate: 21 },
  { id: 'bouwvoorbereiding', icon: '🏗️', nl: 'Bouwvoorbereiding',               en: 'Site Preparation',         ar: 'تحضير الموقع',                         isPrimary: false, defaultBtwRate: 21 },
  { id: 'fundering',         icon: '🧱', nl: 'Fundering',                       en: 'Foundation Work',          ar: 'أعمال الأساسات',                       isPrimary: false, defaultBtwRate: 21 },
  { id: 'raamwerk',          icon: '🔩', nl: 'Raamwerk',                        en: 'Framing',                  ar: 'الهيكل الإنشائي',                      isPrimary: false, defaultBtwRate: 21 },
  { id: 'other',             icon: '📝', nl: 'Anders (vrije tekst)',             en: 'Other (custom)',           ar: 'أخرى (نص حر)',                          isPrimary: false, defaultBtwRate: 21 },
]

export const BTW_RATES = [0, 9, 21]
