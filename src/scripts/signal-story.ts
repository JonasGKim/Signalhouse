import { advanceProgress, chapterAt, clamp } from '../lib/signal-scene';
import {
  createSignalRenderer,
  type SignalRenderer,
} from '../lib/signal-renderer';
export function initializeSignalStory(): void {
  const root = document.querySelector<HTMLElement>('[data-signal-story]');
  if (!root) return;
  const sticky = root.querySelector<HTMLElement>('.story-sticky')!;
  const art = root.querySelector<HTMLElement>('.signal-art')!;
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const panels = [...root.querySelectorAll<HTMLElement>('[data-panel]')];
  const chapters = [
    ...root.querySelectorAll<HTMLButtonElement>('[data-chapter]'),
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const short = matchMedia('(max-height: 650px)');
  let renderer: SignalRenderer | null = null,
    progress = 0,
    start = 0,
    range = 1,
    pending = 0,
    active = -1,
    enhanced = false,
    disposed = false;
  function render() {
    const stage = enhanced ? chapterAt(progress) : 0;
    renderer?.draw(enhanced ? progress : 0);
    if (stage !== active || !enhanced) {
      active = stage;
      panels.forEach((panel, i) => {
        panel.inert = enhanced && i !== stage;
        panel.setAttribute('aria-hidden', String(enhanced && i !== stage));
        panel.dataset.active = String(i === stage);
      });
      chapters.forEach((button, i) => {
        if (i === stage) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
    }
    root!.dataset.progress = progress.toFixed(5);
  }
  function onScroll() {
    if (!enhanced || pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      progress = advanceProgress(progress, 0, scrollY, start, range);
      render();
    });
  }
  function measure() {
    const previous = enhanced;
    enhanced = !!renderer && !reduced.matches && !short.matches;
    root!.dataset.enhanced = String(enhanced);
    if (previous !== enhanced) active = -1;
    start = scrollY + root!.getBoundingClientRect().top;
    range = Math.max(1, root!.offsetHeight - sticky.offsetHeight);
    progress = clamp((scrollY - start) / range);
    const rect = sticky.getBoundingClientRect();
    renderer?.resize(rect.width, rect.height);
    art.dataset.renderer = enhanced ? 'webgl' : 'poster';
    render();
  }
  chapters.forEach((button, i) =>
    button.addEventListener('click', () => {
      if (enhanced) {
        scrollTo({
          top: start + range * ((i + 0.35) / 5),
          behavior: 'instant',
        });
      } else panels[i].scrollIntoView({ behavior: 'instant' });
    }),
  );
  const observer = new ResizeObserver(measure);
  observer.observe(sticky);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('pageshow', measure);
  reduced.addEventListener('change', measure);
  short.addEventListener('change', measure);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    renderer?.dispose();
    renderer = null;
    measure();
  });
  canvas.addEventListener('webglcontextrestored', () => void initialize());
  async function initialize() {
    if (reduced.matches || short.matches) {
      measure();
      return;
    }
    const next = await createSignalRenderer(canvas);
    if (disposed) {
      next?.dispose();
      return;
    }
    renderer = next;
    measure();
    if (location.hash)
      requestAnimationFrame(() =>
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ behavior: 'instant' }),
      );
  }
  reduced.addEventListener('change', () => {
    if (!renderer && !reduced.matches) void initialize();
  });
  short.addEventListener('change', () => {
    if (!renderer && !short.matches) void initialize();
  });
  window.addEventListener(
    'pagehide',
    (event) => {
      if (event.persisted) return;
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(pending);
      renderer?.dispose();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      window.removeEventListener('pageshow', measure);
      reduced.removeEventListener('change', measure);
      short.removeEventListener('change', measure);
    },
    { once: true },
  );
  measure();
  void initialize();
}
