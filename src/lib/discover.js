// Discover's temporary filters (Swipe and Feed share them). The ranking and the filtering themselves
// run in the database (discover_dishes, called through discoverPage in api.js): within a category any
// selected tag matches ("or"), across categories all must match ("and"); budgets; one distance.

// Display names for the tag categories, in filter-panel order. Dietary/allergy are long-term preferences, not filters.
export const FILTER_CATEGORIES = [
  ['cuisine', 'Cuisine'],
  ['food_type', 'Food type'],
  ['flavor', 'Flavor'],
  ['meal_time', 'Meal time'],
  ['scene', 'Scene'],
  ['eating_custom', 'Eating custom'],
]

export const BUDGETS = [
  { id: 'under20', label: '$1–20', min: 0, max: 20 },
  { id: '20to50', label: '$20–50', min: 20, max: 50 },
  { id: 'over50', label: '$50+', min: 50, max: Infinity },
]

// Pick one. Rough reach at ~3 mph walking and ~25–30 mph driving.
export const DISTANCES = [
  { id: 'walk10', label: 'Walk <10 min', meters: 805 },
  { id: 'drive10', label: 'Drive <10 min', meters: 6437 },
  { id: 'drive20', label: 'Drive <20 min', meters: 16093 },
  { id: 'drive30', label: 'Drive <30 min', meters: 24140 },
  { id: 'drive60', label: 'Drive <60 min', meters: 48280 },
]

export const EMPTY_FILTERS = { tagIds: [], budgets: [], distance: null }

export function filterCount(filters) {
  return filters.tagIds.length + filters.budgets.length + (filters.distance ? 1 : 0)
}

export function priceLabel(price) {
  return price == null ? null : `$${Number(price).toFixed(2)}`
}

// Feed's sort orders, grouped as in the Sort menu. `key` is discover_dishes' p_order. Ties fall back to
// more of your diets, then nearer; dishes without a price come last in both price orders.
export const SORTS = [
  { key: 'price_asc', group: 'Price', label: 'Low to high', heading: 'Price: Low to high', mark: '$ ↑' },
  { key: 'price_desc', group: 'Price', label: 'High to low', heading: 'Price: High to low', mark: '$ ↓' },
  { key: 'newest', group: 'Date posted', label: 'Newest first', heading: 'Newest first', mark: '↓' },
  { key: 'oldest', group: 'Date posted', label: 'Oldest first', heading: 'Oldest first', mark: '↑' },
  { key: 'saves_desc', group: 'Popularity · saves', label: 'Most saved', heading: 'Most saved', mark: '↓' },
  { key: 'saves_asc', group: 'Popularity · saves', label: 'Fewest saved', heading: 'Fewest saved', mark: '↑' },
]
export const DEFAULT_SORT = 'saves_desc'
export const sortOf = (key) => SORTS.find((s) => s.key === key) ?? SORTS.find((s) => s.key === DEFAULT_SORT)
