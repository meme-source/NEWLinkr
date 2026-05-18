"use client";

import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  onImport: () => void;
}

export function LibraryHeader({ onImport }: Props) {
  return (
    <div className="flex items-end justify-end gap-4">
      <Button
        unstyled
        type="button"
        onClick={onImport}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3.5 py-1.5 text-[12px] font-medium text-[#36342e] transition-colors hover:bg-[#fffdf9]"
      >
        <Upload className="h-3.5 w-3.5" />
        导入名单
      </Button>
    </div>
  );
}
