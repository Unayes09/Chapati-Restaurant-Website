/** Normalize stored order labels (legacy "one/two/three spice" or raw 1/2/3) for display. */
export const formatItemLabelForDisplay = (label, isFr) => {
  if (!label || typeof label !== 'string') return label || '';
  let out = label;

  const enLegacy = [
    [/\bone spice\b/gi, 'light spice'],
    [/\btwo spices\b/gi, 'medium spice'],
    [/\bthree spices\b/gi, 'heavy spice'],
    [/\bUnit (\d+): 1\b/g, 'Unit $1: light spice'],
    [/\bUnit (\d+): 2\b/g, 'Unit $1: medium spice'],
    [/\bUnit (\d+): 3\b/g, 'Unit $1: heavy spice'],
  ];
  const frLegacy = [
    [/\bune épice\b/gi, 'épices légères'],
    [/\bdeux épices\b/gi, 'épices moyennes'],
    [/\btrois épices\b/gi, 'épices fortes'],
    [/\bPortion (\d+): 1\b/g, 'Portion $1: épices légères'],
    [/\bPortion (\d+): 2\b/g, 'Portion $1: épices moyennes'],
    [/\bPortion (\d+): 3\b/g, 'Portion $1: épices fortes'],
  ];

  const rules = isFr ? frLegacy : enLegacy;
  for (const [pattern, replacement] of rules) {
    out = out.replace(pattern, replacement);
  }
  return out;
};
