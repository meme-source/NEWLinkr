import { sleep } from "./animation";
import { AGENT_STEPS } from "./agent-steps";

interface RunAgentFlowArgs {
  stepsContainer: HTMLElement;
  summaryEl: HTMLElement | null;
  /** Called after the steps + summary finish — used to fade in the canvas. */
  onComplete: () => Promise<void> | void;
  /** Called to flip the header pill from `thinking` → `ready`. */
  onReady: () => void;
}

/**
 * Imperatively mounts each step into `stepsContainer`, runs its render(),
 * waits min `step.duration`, marks it done, optionally appends narration,
 * then flips status + reveals the summary + canvas. Call once per intake.
 *
 * The function takes raw DOM nodes rather than React state because the
 * step result body is built by per-step renderers that DOM-append directly
 * (typeText, countUp, revealPills) — bridging that to React state would
 * cost more than it's worth for a one-shot animation.
 */
export async function runAgentFlow({
  stepsContainer,
  summaryEl,
  onComplete,
  onReady,
}: RunAgentFlowArgs): Promise<void> {
  // Reset
  stepsContainer.replaceChildren();
  summaryEl?.classList.remove("visible");

  await sleep(400); // initial pause

  for (const step of AGENT_STEPS) {
    const stepEl = document.createElement("div");
    stepEl.className = "agent-step";
    stepEl.innerHTML = `
      <div class="step-icon-wrap"><div class="step-icon-circle"></div></div>
      <div class="step-body">
        <div class="step-title">
          <span class="step-title-text"></span>
          <span class="step-time">${escapeHtml(step.time)}</span>
        </div>
        <div class="step-result"></div>
      </div>
    `;
    stepsContainer.appendChild(stepEl);

    await sleep(40);
    stepEl.classList.add("visible");

    const titleEl = stepEl.querySelector<HTMLSpanElement>(".step-title-text");
    if (titleEl) titleEl.textContent = step.title;

    stepEl.classList.add("active");

    const resultEl = stepEl.querySelector<HTMLDivElement>(".step-result");
    if (resultEl) {
      await Promise.all([step.render(resultEl), sleep(step.duration)]);
    } else {
      await sleep(step.duration);
    }

    stepEl.classList.remove("active");
    stepEl.classList.add("done");

    if (step.narration) {
      const narrEl = document.createElement("div");
      narrEl.className = "step-narration";
      narrEl.textContent = step.narration;
      stepsContainer.appendChild(narrEl);
      await sleep(40);
      narrEl.classList.add("visible");
    }

    await sleep(280);
  }

  await sleep(200);
  summaryEl?.classList.add("visible");
  onReady();

  await sleep(400);
  await onComplete();
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}
