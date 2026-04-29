import { cn } from "@/lib/utils";
import {
  SIDEBAR_CONTROL_RADIUS,
  SIDEBAR_METRIC_RADIUS,
} from "@/features/plugin/lib/style-constants";

export function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className={`${SIDEBAR_CONTROL_RADIUS} border border-[#e8e6dc] bg-[#faf9f5] p-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#d1cfc5] hover:bg-white`}
    >
      <div className="text-[11px] uppercase tracking-wide text-[#87867f]">
        {label}
      </div>
      <div className="mt-1.5 break-words text-base font-semibold text-[#141413]">
        {value}
      </div>
    </div>
  );
}

export function SidebarMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className={`${SIDEBAR_CONTROL_RADIUS} border border-[#e8e6dc] bg-white px-3 py-2.5 transition-all duration-150 hover:border-[#d1cfc5] hover:bg-[#f5f4ed]`}
    >
      <div className="text-[11px] text-[#87867f]">{label}</div>
      <div className="mt-1 break-words text-sm font-medium text-[#141413]">
        {value}
      </div>
    </div>
  );
}

export function SidebarMetricCenter({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        `${SIDEBAR_METRIC_RADIUS} border border-[#e8e6dc] bg-white px-2 py-3 text-center transition-all duration-150 hover:border-[#d1cfc5] hover:bg-[#f5f4ed]`,
        className,
      )}
    >
      <div className="text-[10px] text-[#87867f]">{label}</div>
      <div className="mt-1.5 text-sm font-semibold text-[#141413]">
        {value}
      </div>
    </div>
  );
}

export function SidebarMetricInline({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-center transition-colors hover:bg-[#faf9f5]">
      <div className="inline-flex items-center gap-1 text-[10.5px] text-[#87867f]">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-[13px] font-semibold leading-tight text-[#141413]">
        {value}
      </div>
    </div>
  );
}
