// Native element ownership cleanup; this does not impersonate a Video.js dispose API.
export function releaseNativeMedia(media) {
  const errors = []
  for (const action of [
    () => media.pause(),
    () => media.removeAttribute('src'),
    () => media.load(),
  ]) {
    try {
      action()
    } catch (error) {
      errors.push(String(error))
    }
  }
  return errors
}
