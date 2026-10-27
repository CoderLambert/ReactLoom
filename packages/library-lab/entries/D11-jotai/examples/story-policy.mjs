/** Immutable Jotai action policy: use stable business IDs, never array positions. */
export function toggleStoryRead(stories, targetId) {
  if (!Array.isArray(stories)) throw new TypeError('stories must be an array');
  if (typeof targetId !== 'string' || !targetId.trim()) throw new TypeError('targetId must be a stable nonempty string');
  const ids = new Set();
  for (const story of stories) {
    if (!story || typeof story.id !== 'string' || !story.id.trim() || typeof story.read !== 'boolean' || ids.has(story.id)) {
      throw new TypeError('story IDs must be unique nonempty strings and read must be boolean');
    }
    ids.add(story.id);
  }
  if (!ids.has(targetId)) return stories;
  return stories.map(story => story.id === targetId ? {...story, read: !story.read} : story);
}
