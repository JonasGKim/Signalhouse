/** The pencil tip and ink masks share sampled path coordinates and one clock. */
export function initializeNotebook() {
  const stage = document.querySelector<HTMLElement>('[data-notebook]');
  if (!stage || stage.dataset.initialized) return;
  stage.dataset.initialized = 'true';
  const pencil = stage.querySelector<SVGGElement>('[data-pencil]')!;
  const strokes = [...stage.querySelectorAll<SVGPathElement>('[data-ink]')];
  const masks = [...stage.querySelectorAll<SVGRectElement>('[data-ink-mask]')];
  const replaySurface = stage.querySelector<HTMLElement>(
    '[data-replay-target]',
  )!;
  const label = stage.querySelector<HTMLElement>('[data-scene-status]')!;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const ease = getComputedStyle(stage).getPropertyValue('--ease-in-out').trim();
  const rest = { x: 648, y: 520 };
  const total = 8800;
  let animations: Animation[] = [];
  let playing = false;
  let started = false;
  let frame = 0;

  function stop() {
    cancelAnimationFrame(frame);
    animations.forEach((a) => a.cancel());
    animations = [];
    playing = false;
    stage!.dataset.playing = 'false';
    label.textContent = 'Always a work in progress';
  }

  function play() {
    stop();
    started = true;
    if (reduce.matches) return;
    playing = true;
    stage!.dataset.playing = 'true';
    // Local pencil origin is its graphite tip. Rotate around that exact point.
    const transform = (x: number, y: number, angle = 25) =>
      `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    const pencilFrames: Keyframe[] = [
      { transform: transform(rest.x, rest.y, 16), offset: 0, easing: ease },
      { transform: transform(132, 391, 29), offset: 650 / total, easing: ease },
      { transform: transform(132, 409), offset: 950 / total },
    ];
    const timings = [
      { start: 950, duration: 1500 },
      { start: 3150, duration: 520 },
      { start: 4170, duration: 520 },
      { start: 5190, duration: 520 },
      { start: 6470, duration: 1300 },
    ];
    const clock = document.timeline.currentTime;
    const animate = (
      element: Element,
      frames: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => {
      const animation = element.animate(frames, { ...options, fill: 'both' });
      if (clock !== null) animation.startTime = clock;
      animations.push(animation);
      return animation;
    };
    strokes.forEach((stroke, index) => {
      const { start, duration } = timings[index];
      const length = stroke.getTotalLength();
      const points = Array.from({ length: 101 }, (_, i) =>
        stroke.getPointAtLength((length * i) / 100),
      );
      const first = points[0];
      const last = points[100];
      if (index > 0) {
        const previous = timings[index - 1];
        const previousEnd = strokes[index - 1].getPointAtLength(
          strokes[index - 1].getTotalLength(),
        );
        // Lift the tip clear of the page, travel, then touch down before drawing.
        pencilFrames.push(
          {
            transform: transform(previousEnd.x, previousEnd.y - 15, 29),
            offset: (previous.start + previous.duration + 170) / total,
            easing: ease,
          },
          {
            transform: transform(first.x, first.y - 15, 29),
            offset: (start - 180) / total,
            easing: ease,
          },
        );
      }
      points.forEach((point, i) => {
        pencilFrames.push({
          transform: transform(point.x, point.y),
          offset: (start + (duration * i) / 100) / total,
          easing: i === 100 ? ease : 'linear',
        });
      });
      // Every stroke moves left to right, so translating its mask reveals ink
      // exactly where the pencil has traveled, including each bend of a check.
      animate(
        masks[index],
        points.map((point, i) => ({
          transform: `translateX(${point.x - 720 + (i === 0 ? -2 : 2)}px)`,
          offset: i / 100,
        })),
        { duration, delay: start, easing: 'linear' },
      );
      if (index === strokes.length - 1) {
        pencilFrames.push(
          {
            transform: transform(last.x, last.y - 18, 29),
            offset: 7970 / total,
            easing: ease,
          },
          {
            transform: transform(rest.x, rest.y - 13, 16),
            offset: 8570 / total,
            easing: ease,
          },
          { transform: transform(rest.x, rest.y, 16), offset: 1 },
        );
      }
    });
    const movement = animate(pencil, pencilFrames, {
      duration: total,
      easing: 'linear',
    });
    const head = stage!.querySelector('[data-researcher-head]')!;
    animate(
      head,
      [
        { transform: 'rotate(0deg)', offset: 0 },
        { transform: 'rotate(-3deg)', offset: 0.13 },
        { transform: 'rotate(-3deg)', offset: 0.28 },
        { transform: 'rotate(3deg)', offset: 0.38 },
        { transform: 'rotate(3deg)', offset: 0.66 },
        { transform: 'rotate(-2deg)', offset: 0.77 },
        { transform: 'rotate(0deg)', offset: 1 },
      ],
      { duration: total, easing: ease },
    );
    animate(
      stage!.querySelector('[data-eyes]')!,
      [
        { transform: 'scaleY(1)' },
        { transform: 'scaleY(.1)' },
        { transform: 'scaleY(1)' },
      ],
      { delay: 2820, duration: 180 },
    );
    function updateLabel() {
      if (!playing) return;
      const time = Number(movement.currentTime ?? 0);
      label.textContent =
        time < 2700
          ? '01 / Ask a better question'
          : time < 6100
            ? '02 / Do the homework'
            : time < 8000
              ? '03 / Keep the receipts'
              : 'Always a work in progress';
      frame = requestAnimationFrame(updateLabel);
    }
    updateLabel();
    movement.onfinish = stop;
  }
  replaySurface.addEventListener('click', () => play());
  replaySurface.addEventListener('keydown', (event) => {
    if (
      event instanceof KeyboardEvent &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      play();
    }
  });
  reduce.addEventListener('change', () => {
    if (reduce.matches) stop();
  });
  // Pause the entire sequence together when the scene leaves view.
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        if (!started) play();
        else if (playing) animations.forEach((a) => a.play());
      } else if (playing) animations.forEach((a) => a.pause());
    },
    { threshold: 0.2 },
  ).observe(stage);
}
