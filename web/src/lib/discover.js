// Client-side ranking and temporary filters for Discover (Swipe and Feed share them).

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

// Within a category any selected tag matches ("or"); across categories all must match ("and").
export function matchesFilters(dish, filters, tagsById) {
  const byCategory = new Map()
  for (const id of filters.tagIds) {
    const category = tagsById.get(id)?.category
    if (!byCategory.has(category)) byCategory.set(category, [])
    byCategory.get(category).push(id)
  }
  for (const ids of byCategory.values()) {
    if (!ids.some((id) => dish.tagIds.includes(id))) return false
  }
  if (filters.budgets.length) {
    if (dish.price == null) return false
    const price = Number(dish.price)
    const fits = BUDGETS.filter((b) => filters.budgets.includes(b.id)).some((b) => price >= b.min && price < b.max)
    if (!fits) return false
  }
  if (filters.distance) {
    const max = DISTANCES.find((d) => d.id === filters.distance)?.meters ?? Infinity
    if (dish.distance == null || dish.distance > max) return false
  }
  return true
}

// Hide dishes containing the user's allergens; put dishes that fit more of their diets first, then nearer ones.
export function rankForUser(dishes, preferenceTagIds, tagsById) {
  const allergies = preferenceTagIds.filter((id) => tagsById.get(id)?.category === 'allergy')
  const diets = preferenceTagIds.filter((id) => tagsById.get(id)?.category === 'dietary')
  const dietScore = (d) => diets.filter((id) => d.tagIds.includes(id)).length
  return dishes
    .filter((d) => !allergies.some((id) => d.tagIds.includes(id)))
    .sort((a, b) => dietScore(b) - dietScore(a) || (a.distance ?? Infinity) - (b.distance ?? Infinity))
}

export function priceLabel(price) {
  return price == null ? null : `$${Number(price).toFixed(2)}`
}
