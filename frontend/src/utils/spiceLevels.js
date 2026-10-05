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
  '0': { en: 'Mild / No spice', fr: 'Doux' },
  '1': { en: 'Lightly spiced', fr: 'Légèrement épicé' },
  '2': { en: 'Medium spice', fr: 'Épices moyennes' },
  '3': { en: 'Hot', fr: 'Très épicé' },
};

export const SPICE_LEVEL_OPTIONS = ['0', '1', '2', '3'];

export const getSpiceLevelLabel = (code, isFr) => {
  const entry = SPICE_LEVEL_LABELS[String(code)] ?? SPICE_LEVEL_LABELS['0'];
  return isFr ? entry.fr : entry.en;
};

/** Menu items that need a sauce choice on checkout (one sauce per cart line) */
export const MENU_IDS_NEED_SAUCE = new Set([
  'fried-naan',
  'chapati-special',
  'curry-tikka-naan',
  'vegetable-naan',
]);

export const itemNeedsSauce = (id) => {
  if (typeof id !== 'string') return false;
  if (MENU_IDS_NEED_SAUCE.has(id)) return true;
  return id.startsWith('menu-naan-1495__') || id.startsWith('menu-naan-1595__');
};

export const SAUCE_OPTIONS = [
  { value: 'curry', en: 'Curry sauce', fr: 'Sauce curry' },
  { value: 'mint', en: 'Mint sauce', fr: 'Sauce menthe fraîche' },
];

export const SAUCE_LABELS = SAUCE_OPTIONS.reduce((acc, o) => {
  acc[o.value] = { en: o.en, fr: o.fr };
  return acc;
}, {});

export const getSauceLabel = (code, isFr) => {
  const entry = SAUCE_LABELS[String(code)] ?? SAUCE_LABELS.curry;
  return isFr ? entry.fr : entry.en;
};

export const DEFAULT_SAUCE = 'curry';

/** Normalize an item so it carries `sauces[]` of length qty, one per portion. */
export const normalizeSauces = (item) => {
  if (!itemNeedsSauce(item.id)) return item;
  const q = Math.max(1, item.qty || 1);
  let sauces = Array.isArray(item.sauces) ? [...item.sauces] : [];
  if (sauces.length === 0 && item.sauce) sauces = [item.sauce];
  while (sauces.length < q) sauces.push(DEFAULT_SAUCE);
  sauces = sauces.slice(0, q);
  return { ...item, sauces };
};

/** Build order label sent to API (includes spice per portion + sauce per portion). */
export const appendSpiceToLabel = (item, isFr) => {
  let label = item.label;
  // Menu Naan Sandwich bundle label already includes "Sauce: …"
  const isBundle =
    typeof item.id === 'string' &&
    (item.id.startsWith('menu-naan-1495__') || item.id.startsWith('menu-naan-1595__'));
  if (itemNeedsSauce(item.id) && !isBundle) {
    const q = item.qty || 1;
    const sauces = [...(item.sauces || [])];
    while (sauces.length < q) sauces.push(DEFAULT_SAUCE);
    const slice = sauces.slice(0, q);
    const distinct = Array.from(new Set(slice));
    if (distinct.length === 1) {
      label = `${label} (${getSauceLabel(slice[0], isFr)})`;
    } else {
      const parts = slice.map((code, idx) =>
        `${isFr ? 'Portion' : 'Unit'} ${idx + 1}: ${getSauceLabel(code, isFr)}`,
      );
      label = `${label} [${isFr ? 'Sauce' : 'Sauce'}: ${parts.join(isFr ? ' ; ' : '; ')}]`;
    }
  }
  if (!itemNeedsSpice(item.id)) return label;
  const q = item.qty || 1;
  const levels = [...(item.spiceLevels || [])];
  while (levels.length < q) levels.push('0');
  const slice = levels.slice(0, q);
  const parts = slice.map((code, idx) =>
    `${isFr ? 'Portion' : 'Unit'} ${idx + 1}: ${getSpiceLevelLabel(code, isFr)}`,
  );
  return `${label} [${isFr ? 'Épices' : 'Spice'}: ${parts.join(isFr ? ' ; ' : '; ')}]`;
};
