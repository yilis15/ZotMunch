// Search for My posts and My reviews: a dish matches when its name, restaurant, or branch
// (the first part of our addresses, "University Center · 4199 Campus Dr") contains the query.
export function matchesQuery(dish, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const { name, address } = dish.restaurant
  return [dish.name, name, address?.split(' · ')[0]].some((text) => text?.toLowerCase().includes(q))
}
