// Helpers for showing what the content check turned down (ModerationDialog), shared by Post and Review.

// What the dialog lists: the form's photos the check rejected (with their previews), then the text fields.
// `verdict` comes from rejectedIn() in api.js.
export function rejectionOf(photos, verdict) {
  return {
    photos: photos
      .filter((p) => verdict.photos.has(p.path))
      .map((p) => ({ key: p.key, url: p.url, verdict: verdict.photos.get(p.path) })),
    texts: ['name', 'body'].filter((field) => verdict.texts[field]),
  }
}

// After "Fix it": bring the first thing to fix into view, and put the cursor in it if it's a text field.
// `where` maps photos / name / body to a CSS selector on the page.
export function showFirstProblem(rejection, where) {
  if (!rejection) return
  const first = rejection.photos.length ? 'photos' : rejection.texts[0]
  const el = where[first] && document.querySelector(where[first])
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  if (first !== 'photos') el.focus({ preventScroll: true })
}
