// First-time guide: the steps and the practice dish. Swiping the practice dish teaches the real
// gestures without skipping or saving a real dish, so nothing here is ever written to the database.

export const PRACTICE_ID = 'practice'

// `allow` is what the user may touch on that step; `keys` the arrow keys that also work.
export const TOUR_STEPS = {
  discover: {
    n: 1,
    title: 'Find your next bite',
    body: 'Discover dishes loved by fellow Anteaters.',
    route: '/',
    targets: ['.nav__item[href="/"]'],
    fixedTarget: true,
    place: 'above',
    next: 'devices',
    back: null,
  },
  // Figma 02 · Swipe your way: a centered card, nothing spotlit, showing both ways to swipe.
  devices: {
    n: 2,
    title: 'Swipe your way',
    devices: true,
    route: '/',
    targets: [],
    next: 'left',
    back: 'discover',
  },
  left: {
    n: 3,
    title: 'Swipe left to pass',
    body: 'Not your craving? Swipe left or tap × Skip.',
    route: '/',
    targets: ['.deck__stack', '[data-tour="skip"]'],
    place: 'above',
    cue: 'left',
    allow: ['.swipe-card', '[data-tour="skip"]'],
    keys: ['ArrowLeft'],
    next: 'right',
    back: 'devices',
  },
  leftResult: {
    n: 3,
    title: 'On to the next bite',
    body: 'That bite was skipped. In real browsing, the next dish comes up.',
    route: '/',
    targets: ['.deck__stack'],
    place: 'above',
    next: 'right',
    back: 'left',
  },
  right: {
    n: 4,
    title: 'Swipe right to save',
    body: 'Like this bite? Swipe right or tap ❤️ Want it.',
    route: '/',
    targets: ['.deck__stack', '[data-tour="want"]'],
    place: 'above',
    cue: 'right',
    allow: ['.swipe-card', '[data-tour="want"]'],
    keys: ['ArrowRight'],
    next: 'view',
    back: 'left',
  },
  rightResult: {
    n: 4,
    title: 'Saved for later!',
    body: 'Real dishes go to your food list in Saved. This one was just practice.',
    route: '/',
    targets: ['.deck__stack'],
    place: 'above',
    next: 'view',
    back: 'right',
  },
  view: {
    n: 5,
    title: 'Take a closer look',
    body: 'Tap the dish or View dish for the full story.',
    route: '/',
    targets: ['.deck__stack', '[data-tour="view"]'],
    place: 'above',
    allow: ['.swipe-card', '[data-tour="view"]'],
    next: 'detail',
    back: 'right',
  },
  detail: {
    n: 5,
    title: 'The full story, right here',
    body: 'Tap Directions to find this dish on Google Maps. (You can open it after this tour.)',
    route: `/dish/${PRACTICE_ID}`,
    targets: ['.place-card'],
    place: 'below',
    next: 'saved',
    back: 'view',
  },
  saved: {
    n: 6,
    title: 'Your food list',
    body: "Tap Want it or swipe right on a dish, and it lands in your food list here. (Peter's Pancakes is just for this tour.)",
    route: '/saved',
    targets: ['.nav__item[href="/saved"]'],
    fixedTarget: true,
    avoid: '.saved-group',
    place: 'above',
    next: 'filters',
    back: 'detail',
  },
  filters: {
    n: 7,
    title: 'Make it your kind of bite',
    body: 'Filter by cuisine, budget, distance, and more.',
    route: '/',
    targets: ['.sheet .filter-group'],
    place: 'below',
    next: 'post',
    back: 'saved',
  },
  post: {
    n: 8,
    title: 'Share a happy bite',
    body: 'Fill in the details of a dish you recommend, and other Anteaters will come across it as they browse.',
    route: '/post',
    targets: ['[data-tour="photos"]', '[data-tour="dish-name"]', '[data-tour="restaurant"]'],
    mergeTargets: true,
    place: 'below',
    next: 'me',
    back: 'filters',
  },
  me: {
    n: 9,
    title: 'Your food journal',
    body: 'Manage your profile, posts, reviews, and preferences here.',
    route: '/me',
    targets: ['.nav__item[href="/me"]'],
    fixedTarget: true,
    place: 'above',
    next: null,
    nextLabel: "Let's eat!",
    back: 'post',
  },
}

export const TOUR_TOTAL = 9

// Which swipe directions the deck accepts on each step.
export const TOUR_SWIPES = { left: ['left'], right: ['right'] }

// Shaped like the dishes from api.js. Tags are looked up by name so ids can't drift.
export function practiceDish(tags) {
  const tagIds = [
    ['cuisine', 'American'],
    ['food_type', 'Desserts & Boba'],
  ]
    .map(([category, name]) => tags.find((t) => t.category === category && t.name === name)?.id)
    .filter(Boolean)
  const now = new Date().toISOString()
  return {
    id: PRACTICE_ID,
    practice: true,
    name: "Peter's Pancakes",
    price: 520,
    createdAt: now,
    createdBy: null,
    restaurant: { id: PRACTICE_ID, name: 'UCI', address: null, google_place_id: null },
    tagIds,
    tagAddedBy: new Map(),
    photos: [],
    photo: '/mascots/hero.png',
    rating: 5,
    reviewCount: 1,
    distance: null,
    saveCount: 300,
    reviews: [
      {
        id: PRACTICE_ID,
        rating: 5,
        body: 'The fluffiest stack on campus. Worth every dollar!',
        createdAt: now,
        updatedAt: now,
        userId: null,
        author: { display_name: 'Peter', avatar_url: null },
        photos: [],
      },
    ],
  }
}

// Shown on Saved during the guide only, shaped like an item from groupItems (lib/lists.js). It is never stored.
export function practiceSave(tags) {
  return {
    key: PRACTICE_ID,
    id: PRACTICE_ID,
    dish: practiceDish(tags),
    deleted: false,
    savedAt: new Date().toISOString(),
    tried: false,
    saveIds: [],
    savers: [],
  }
}
