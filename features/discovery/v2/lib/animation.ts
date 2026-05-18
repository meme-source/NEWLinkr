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

// ─── Mid-stage primitives for tab-aware analysis flows ─────────────────────

/**
 * Reveal category-style pills (Light Sand variant). Each pill stacks a label
 * with an optional priority qualifier separated by `·`. Used by the scenario
 * tab's Step C.
 */
export async function revealTypePills(
  parent: HTMLElement,
  items: ReadonlyArray<{ label: string; priority?: string }>,
  delay = 130,
): Promise<void> {
  for (const item of items) {
    const span = document.createElement("span");
    span.className = "type-pill";
    const main = document.createElement("span");
    main.className = "type-pill-label";
    main.textContent = item.label;
    span.appendChild(main);
    if (item.priority) {
      const sep = document.createElement("span");
      sep.className = "type-pill-sep";
      sep.textContent = "·";
      const prio = document.createElement("span");
      prio.className = "type-pill-priority";
      prio.textContent = item.priority;
      span.append(sep, prio);
    }
    parent.appendChild(span);
    await sleep(20);
    requestAnimationFrame(() => span.classList.add("shown"));
    await sleep(delay);
  }
}

/**
 * Render the scenario tab's Step D — left column = creator type, right
 * column = method pills. Streams row-by-row so the AI feels like it's filling
 * in each type's playbook.
 */
export async function revealMethodRows(
  parent: HTMLElement,
  rows: ReadonlyArray<{ type: string; methods: readonly string[] }>,
  rowDelay = 280,
  pillDelay = 90,
): Promise<void> {
  const wrap = document.createElement("div");
  wrap.className = "method-rows";
  parent.appendChild(wrap);
  for (const row of rows) {
    const rowEl = document.createElement("div");
    rowEl.className = "method-row";
    const typeEl = document.createElement("span");
    typeEl.className = "method-row-type";
    typeEl.textContent = row.type;
    const pills = document.createElement("span");
    pills.className = "method-row-pills";
    rowEl.append(typeEl, pills);
    wrap.appendChild(rowEl);
    await sleep(20);
    requestAnimationFrame(() => rowEl.classList.add("shown"));
    for (const m of row.methods) {
      const pill = document.createElement("span");
      pill.className = "method-pill";
      pill.textContent = m;
      pills.appendChild(pill);
      await sleep(20);
      requestAnimationFrame(() => pill.classList.add("shown"));
      await sleep(pillDelay);
    }
    await sleep(rowDelay);
  }
}

/** Reveal scenario combo cards in a 2-column grid with stagger. */
export async function revealComboCards(
  parent: HTMLElement,
  items: ReadonlyArray<{ type: string; method: string; rationale: string; score?: number }>,
  delay = 160,
): Promise<void> {
  const grid = document.createElement("div");
  grid.className = "combo-grid";
  parent.appendChild(grid);
  for (const item of items) {
    const card = document.createElement("div");
    card.className = "combo-card";
    const head = document.createElement("div");
    head.className = "combo-card-head";
    const title = document.createElement("span");
    title.className = "combo-card-title";
    title.textContent = `${item.type} × ${item.method}`;
    head.appendChild(title);
    if (typeof item.score === "number") {
      const score = document.createElement("span");
      score.className = "combo-card-score";
      score.textContent = String(item.score);
      head.appendChild(score);
    }
    const rationale = document.createElement("div");
    rationale.className = "combo-card-rationale";
    rationale.textContent = item.rationale;
    card.append(head, rationale);
    grid.appendChild(card);
    await sleep(20);
    requestAnimationFrame(() => card.classList.add("shown"));
    await sleep(delay);
  }
}

/**
 * Render the trending tab's Step C — a 4-cell baseline grid using the Solid
 * Tile variant from DESIGN.md §6.5.2.
 */
export async function revealBaselineTiles(
  parent: HTMLElement,
  basisLine: string,
  tiles: ReadonlyArray<{ label: string; value: string }>,
): Promise<void> {
  const basis = document.createElement("div");
  basis.className = "baseline-basis";
  basis.textContent = basisLine;
  parent.appendChild(basis);
  const grid = document.createElement("div");
  grid.className = "baseline-grid";
  parent.appendChild(grid);
  for (const tile of tiles) {
    const cell = document.createElement("div");
    cell.className = "baseline-tile";
    const label = document.createElement("div");
    label.className = "baseline-tile-label";
    label.textContent = tile.label;
    const value = document.createElement("div");
    value.className = "baseline-tile-value";
    value.textContent = tile.value;
    cell.append(label, value);
    grid.appendChild(cell);
    await sleep(20);
    requestAnimationFrame(() => cell.classList.add("shown"));
    await sleep(120);
  }
}

/** Reveal trend label pills with embedded counts (trending tab Step E). */
export async function revealTrendLabels(
  parent: HTMLElement,
  items: ReadonlyArray<{ label: string; count: number }>,
  delay = 130,
): Promise<void> {
  for (const item of items) {
    const span = document.createElement("span");
    span.className = "trend-pill";
    const label = document.createElement("span");
    label.className = "trend-pill-label";
    label.textContent = item.label;
    const count = document.createElement("span");
    count.className = "trend-pill-count";
    count.textContent = String(item.count);
    span.append(label, count);
    parent.appendChild(span);
    await sleep(20);
    requestAnimationFrame(() => span.classList.add("shown"));
    await sleep(delay);
  }
}
