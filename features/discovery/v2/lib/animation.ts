/**
 * Animation primitives for the agent reasoning canvas.
 * Mirrors the mock at /tmp/agent-canvas-mock.html §5 — the timing constants
 * have been play-tested in the mock and should be preserved.
 */

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Stream `text` char-by-char into `el.textContent`. Default 28ms / char. */
export async function typeText(el: HTMLElement, text: string, charDelay = 28): Promise<void> {
  el.textContent = "";
  for (const ch of text) {
    el.textContent += ch;
    await sleep(charDelay);
  }
}

/** Append a styled line to `parent` and stream the text into it. */
export async function typeLine(
  parent: HTMLElement,
  text: string,
  kind?: "strong" | "meta",
  charDelay = 28,
): Promise<void> {
  const div = document.createElement("div");
  div.className = "result-line" + (kind ? ` result-${kind}` : "");
  parent.appendChild(div);
  await typeText(div, text, charDelay);
}

/** Cubic ease-out count-up. `target` is the final integer; `duration` ms. */
export function countUp(el: HTMLElement, target: number, duration = 900): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

/** Reveal a list of brand pills with a stagger of `delay` ms. */
export async function revealPills(
  parent: HTMLElement,
  items: string[],
  delay = 130,
): Promise<void> {
  parent.innerHTML = "";
  for (const item of items) {
    const span = document.createElement("span");
    span.className = "brand-pill";
    span.textContent = item;
    parent.appendChild(span);
    await sleep(20);
    requestAnimationFrame(() => span.classList.add("shown"));
    await sleep(delay);
  }
}

/** Render a "{number} {label}" row inside `parent` and animate the count-up. */
export async function renderCount(
  parent: HTMLElement,
  target: number,
  label: string,
): Promise<void> {
  const row = document.createElement("div");
  row.className = "count-row";
  const num = document.createElement("span");
  num.className = "count-num";
  num.textContent = "0";
  const lbl = document.createElement("span");
  lbl.className = "count-label";
  lbl.textContent = label;
  row.append(num, lbl);
  parent.appendChild(row);
  await countUp(num, target, target > 1000 ? 1400 : 1000);
}
