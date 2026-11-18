import { gsap } from 'gsap'

export function createCardTween(
  target: gsap.TweenTarget,
  ease: string,
  publish: (progress: number) => void,
) {
  return gsap.fromTo(
    target,
    { x: 0, opacity: 0.35 },
    {
      x: 60,
      opacity: 1,
      duration: 1.2,
      ease,
      paused: true,
      onUpdate: function (this: gsap.core.Tween) {
        publish(this.progress())
      },
    },
  )
}

export function createCardSequence(
  cards: gsap.TweenTarget,
  detail: gsap.TweenTarget,
  publish: (progress: number) => void,
) {
  return gsap
    .timeline({
      paused: true,
      onUpdate: function (this: gsap.core.Timeline) {
        publish(this.progress())
      },
    })
    .addLabel('cards', 0)
    .fromTo(
      cards,
      { y: 24, opacity: 0.35 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.14,
        ease: 'power1.out',
      },
      'cards',
    )
    .addLabel('detail', 0.7)
    .fromTo(
      detail,
      { y: 8, opacity: 0.35 },
      {
        y: 0,
        opacity: 1,
        duration: 0.4,
        ease: 'none',
      },
      'detail',
    )
}
