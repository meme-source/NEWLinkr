export function AudienceBar({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs text-[#87867f]">
        <span>{label}</span>
        <span className="font-medium text-[#4d4c48]">{value}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#e8e6dc]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#c96442] to-[#d97757]"
          style={{ width: value }}
        />
      </div>
    </div>
  );
}
