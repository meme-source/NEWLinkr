// Sidebar visual rhythm tokens shared across plugin components.
// Tailwind class strings — purely presentational, no behavior.

export const SIDEBAR_CARD_RADIUS = "rounded-[24px]";
export const SIDEBAR_CONTROL_RADIUS = "rounded-[20px]";
export const SIDEBAR_METRIC_RADIUS = "rounded-[16px]";

export const SIDEBAR_PANEL_CARD_CLASSES = `${SIDEBAR_CARD_RADIUS} border border-[#e8e6dc] bg-white p-4`;
export const SIDEBAR_GRADIENT_CARD_CLASSES = `${SIDEBAR_CARD_RADIUS} border border-[#e8e6dc] bg-[linear-gradient(180deg,#ffffff_0%,#f5f4ed_100%)] p-4`;
export const SIDEBAR_SECTION_CARD_CLASSES = `${SIDEBAR_CARD_RADIUS} border border-[#e8e6dc] bg-[#f5f4ed] p-4`;

export const SIDEBAR_CONTROL_CLASSES = `w-full appearance-none ${SIDEBAR_CONTROL_RADIUS} border border-[#e8e6dc] bg-[#faf9f5] px-3 py-3 pr-10 text-sm text-[#141413] outline-none transition-colors focus:border-[#c96442]/35`;
export const SIDEBAR_SECONDARY_BUTTON_CLASSES = `${SIDEBAR_CONTROL_RADIUS} border border-[#e8e6dc] bg-white px-4 py-2.5 text-sm font-semibold transition-all hover:border-[#d1cfc5] hover:bg-[#f5f4ed] active:scale-[0.98]`;
export const SIDEBAR_FILLED_BUTTON_CLASSES = `${SIDEBAR_CONTROL_RADIUS} bg-[#c96442] px-4 py-2.5 text-sm font-semibold text-[#faf9f5] transition-all hover:bg-[#d97757] active:scale-[0.98]`;
