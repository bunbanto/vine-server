const DRINK_TYPES = [
  'wine',
  'whiskey',
  'brandy',
  'gin',
  'rum',
  'liqueur',
  'grappa',
  'vodka',
  'other',
];
const LEGACY_WINE_TYPES = ['secco', 'abboccato', 'amabile', 'dolce'];
const WINE_TYPES = [...DRINK_TYPES, ...LEGACY_WINE_TYPES];
const WINE_COLORS = ['bianco', 'rosso', 'rosato'];
const WINE_TYPES_REQUIRING_REGION = ['wine', ...LEGACY_WINE_TYPES];

const isWineType = (type) => WINE_TYPES_REQUIRING_REGION.includes(type);

module.exports = {
  DRINK_TYPES,
  LEGACY_WINE_TYPES,
  WINE_TYPES_REQUIRING_REGION,
  isWineType,
  WINE_TYPES,
  WINE_COLORS,
};
