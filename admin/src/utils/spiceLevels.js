const SPICE_DISPLAY = {
  en: ['Mild / No spice', 'Lightly spiced', 'Medium spice', 'Hot'],
  fr: ['Doux', 'Légèrement épicé', 'Épices moyennes', 'Très épicé'],
};

/** Normalize stored order labels to current spice wording. */
export const formatItemLabelForDisplay = (label, isFr) => {
  if (!label || typeof label !== 'string') return label || '';
  const [mild, light, medium, hot] = isFr ? SPICE_DISPLAY.fr : SPICE_DISPLAY.en;
  let out = label;

  const enRules = [
    [/\bno spice\b/gi, mild],
    [/\blight spice\b/gi, light],
    [/\bmedium spice\b/gi, medium],
    [/\bheavy spice\b/gi, hot],
    [/\bone spice\b/gi, light],
    [/\btwo spices\b/gi, medium],
    [/\bthree spices\b/gi, hot],
    [/\bUnit (\d+): 0\b/g, `Unit $1: ${mild}`],
    [/\bUnit (\d+): 1\b/g, `Unit $1: ${light}`],
    [/\bUnit (\d+): 2\b/g, `Unit $1: ${medium}`],
    [/\bUnit (\d+): 3\b/g, `Unit $1: ${hot}`],
  ];

  const frRules = [
    [/\bsans épice\b/gi, mild],
    [/\bépices légères\b/gi, light],
    [/\bune épice\b/gi, light],
    [/\bépices moyennes\b/gi, medium],
    [/\bdeux épices\b/gi, medium],
    [/\bépices fortes\b/gi, hot],
    [/\btrois épices\b/gi, hot],
    [/\bPortion (\d+): 0\b/g, `Portion $1: ${mild}`],
    [/\bPortion (\d+): 1\b/g, `Portion $1: ${light}`],
    [/\bPortion (\d+): 2\b/g, `Portion $1: ${medium}`],
    [/\bPortion (\d+): 3\b/g, `Portion $1: ${hot}`],
  ];

  const rules = isFr ? frRules : enRules;
  for (const [pattern, replacement] of rules) {
    out = out.replace(pattern, replacement);
  }
  return out;
};
