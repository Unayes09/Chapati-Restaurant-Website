/** Menu items that need per-portion spice level on checkout */
export const MENU_IDS_NEED_SPICE = new Set([
  'menu-sagorika',
  'chicken-curry',
  'lamb-curry',
  'chicken-korma',
  'lamb-korma',
  'chicken-dhansak',
  'lamb-dhansak',
  'butter-chicken',
  'chicken-tikka-masala',
  'lamb-tikka-masala',
  'chicken-jalfrezi',
  'lamb-jalfrezi',
  'chicken-balti',
  'lamb-balti',
  'chicken-biryani',
  'lamb-biryani',
  'vegetable-biryani',
  'special-biryani',
]);

export const itemNeedsSpice = (id) =>
  MENU_IDS_NEED_SPICE.has(id) ||
  (typeof id === 'string' && id.startsWith('menu-sagorika__'));

/** Internal codes stored in cart / orders: '0' | '1' | '2' | '3' */
export const SPICE_LEVEL_LABELS = {
  '0': { en: 'No spice', fr: 'Sans épice' },
  '1': { en: 'Light spice', fr: 'Épices légères' },
  '2': { en: 'Medium spice', fr: 'Épices moyennes' },
  '3': { en: 'Heavy spice', fr: 'Épices fortes' },
};

export const SPICE_LEVEL_OPTIONS = ['0', '1', '2', '3'];

export const getSpiceLevelLabel = (code, isFr) => {
  const entry = SPICE_LEVEL_LABELS[String(code)] ?? SPICE_LEVEL_LABELS['0'];
  return isFr ? entry.fr : entry.en;
};

/** Build order label sent to API (includes spice per portion). */
export const appendSpiceToLabel = (item, isFr) => {
  if (!itemNeedsSpice(item.id)) return item.label;
  const q = item.qty || 1;
  const levels = [...(item.spiceLevels || [])];
  while (levels.length < q) levels.push('0');
  const slice = levels.slice(0, q);
  const parts = slice.map((code, idx) =>
    `${isFr ? 'Portion' : 'Unit'} ${idx + 1}: ${getSpiceLevelLabel(code, isFr)}`,
  );
  return `${item.label} [${isFr ? 'Épices' : 'Spice'}: ${parts.join(isFr ? ' ; ' : '; ')}]`;
};
