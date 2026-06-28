const DRINK_TYPES = [
  'wine',
  'beer',
  'whiskey',
  'brandy',
  'gin',
  'rum',
  'liqueur',
  'grappa',
  'vodka',
  'other',
];
const WINE_TYPES = DRINK_TYPES;
const WINE_COLORS = ['bianco', 'rosso', 'rosato', 'light', 'dark'];
const WINE_SWEETNESS = ['secco', 'abboccato', 'amabile', 'dolce'];
const WINE_TYPES_REQUIRING_REGION = ['wine'];

const isWineType = (type) => WINE_TYPES_REQUIRING_REGION.includes(type);
const isWineSweetness = (value) => WINE_SWEETNESS.includes(value);

module.exports = {
  DRINK_TYPES,
  WINE_SWEETNESS,
  WINE_TYPES_REQUIRING_REGION,
  isWineSweetness,
  isWineType,
  WINE_TYPES,
  WINE_COLORS,
};
