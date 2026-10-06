/**
 * Sub-day playback progress. Map markers read this between React day ticks
 * so a glide does not re-render the whole app on every frame.
 */
const listeners = new Set<() => void>();

export const playClock = {
  fraction: 0,
  playing: false,
};

export function setPlayClock(fraction: number, playing: boolean): void {
  if (playClock.fraction === fraction && playClock.playing === playing) return;
  playClock.fraction = fraction;
  playClock.playing = playing;
  if (!playing) return;
  for (const listener of listeners) listener();
}

export function subscribePlayClock(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
