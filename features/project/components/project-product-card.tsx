"use client";

import { ArrowUpRight, ImagePlus, Link2, Package, Paperclip, Upload, X } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import type { ProjectProduct } from "@/features/project/components/project-context";
import {
  CATEGORY_OPTIONS,
  FieldLabel,
  TextInput,
} from "@/features/project/components/project-sheet-fields";
import { cn } from "@/lib/utils";

// 产品信息 —— 一个项目绑定一个产品（1:1）。产品字段已融进抽屉顶部的项目信息区。
//   预览态：产品图片 / 图标 + 名称 + 一行 meta（品类·品牌·链接·Brief）+ 目标建联人数。
//   编辑态：图片上传 + 名称 / 品类 / 品牌 / 链接 / Brief（上传或链接）+ 目标建联人数。
// 图片 / Brief 上传在前端读成 data URL 存进 draft（无后端阶段也能持久化到 localStorage），
// 超过体积上限的文件会被跳过。

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_BRIEF_BYTES = 3 * 1024 * 1024;

interface ProductError {
  name?: string;
  category?: string;
}

// 把文件读成 data URL；超过上限或读取失败时返回 null。
function readFileAsDataUrl(file: File, maxBytes: number): Promise<string | null> {
  return new Promise((resolve) => {
    if (file.size > maxBytes) {
      console.warn(`文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），已跳过上传。`);
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => {
      console.warn("文件读取失败。");
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}

export function ProjectProductCard({
  product,
  editing,
  error,
  outreachTarget,
  onUpdate,
  onTargetChange,
}: {
  product: ProjectProduct;
  editing: boolean;
  error?: ProductError;
  outreachTarget: number | null;
  onUpdate: (patch: Partial<ProjectProduct>) => void;
  onTargetChange: (value: number | null) => void;
}) {
  return editing ? (
    <ProductForm
      product={product}
      error={error}
      outreachTarget={outreachTarget}
      onUpdate={onUpdate}
      onTargetChange={onTargetChange}
    />
  ) : (
    <ProductPreview product={product} outreachTarget={outreachTarget} />
  );
}

function ProductPreview({
  product,
  outreachTarget,
}: {
  product: ProjectProduct;
  outreachTarget: number | null;
}) {
  const name = product.name.trim();
  const link = product.link.trim();
  const briefUrl = product.briefUrl.trim();

  const meta: { key: string; content: React.ReactNode }[] = [];
  if (product.category.trim()) {
    meta.push({ key: "category", content: product.category.trim() });
  }
  if (product.brand.trim()) {
    meta.push({ key: "brand", content: product.brand.trim() });
  }
  if (link) {
    meta.push({
      key: "link",
      content: (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[#ff4f00] transition-colors hover:text-[#e04700]"
        >
          <ArrowUpRight className="h-3 w-3" />
          产品链接
        </a>
      ),
    });
  }
  if (briefUrl) {
    meta.push({
      key: "brief",
      content: (
        <a
          href={briefUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[#ff4f00] transition-colors hover:text-[#e04700]"
        >
          <Paperclip className="h-3 w-3" />
          {product.briefName.trim() || "Brief"}
        </a>
      ),
    });
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={name || "产品图片"}
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-lg border border-[#c5c0b1] object-cover"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#fff7f4]">
            <Package className="h-5 w-5 text-[#ff4f00]" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[#201515]">
            {name || <span className="font-normal text-[#939084]">未填写产品名称</span>}
          </div>
          {meta.length > 0 ? (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#939084]">
              {meta.map((item, itemIndex) => (
                <span key={item.key} className="inline-flex items-center gap-2">
                  {itemIndex > 0 ? (
                    <span aria-hidden className="text-[#c5c0b1]">
                      ·
                    </span>
                  ) : null}
                  {item.content}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-[#e4ddca] pt-2.5 text-xs">
        <span className="text-[#939084]">目标建联人数</span>
        <span className="font-medium text-[#201515] tabular-nums">
          {outreachTarget != null ? `${outreachTarget} 人` : "未设置"}
        </span>
      </div>
    </div>
  );
}

function ProductForm({
  product,
  error,
  outreachTarget,
  onUpdate,
  onTargetChange,
}: {
  product: ProjectProduct;
  error?: ProductError;
  outreachTarget: number | null;
  onUpdate: (patch: Partial<ProjectProduct>) => void;
  onTargetChange: (value: number | null) => void;
}) {
  const handleImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file, MAX_IMAGE_BYTES);
    if (dataUrl) onUpdate({ imageUrl: dataUrl });
  };

  const handleBriefFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file, MAX_BRIEF_BYTES);
    if (dataUrl) onUpdate({ briefName: file.name, briefUrl: dataUrl });
  };

  const handleTargetChange = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") {
      onTargetChange(null);
      return;
    }
    const parsed = Number(trimmed);
    onTargetChange(Number.isFinite(parsed) && parsed >= 0 ? parsed : null);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="shrink-0">
          <FieldLabel label="产品图片" />
          {product.imageUrl ? (
            <div className="relative h-[58px] w-[58px]">
              <Image
                src={product.imageUrl}
                alt={product.name || "产品图片"}
                width={58}
                height={58}
                className="h-[58px] w-[58px] rounded-lg border border-[#c5c0b1] object-cover"
              />
              <Button
                unstyled
                type="button"
                onClick={() => onUpdate({ imageUrl: "" })}
                aria-label="移除产品图片"
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-[#c5c0b1] bg-[#fffefb] text-[#939084] transition-colors hover:text-[#b00020]"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <label className="flex h-[58px] w-[58px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-[#c5c0b1] bg-[#fffefb] text-[#939084] transition-colors hover:border-[#ff4f00]/50 hover:text-[#ff4f00]">
              <ImagePlus className="h-4 w-4" />
              <span className="text-[10px]">上传</span>
              <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
            </label>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <FieldLabel label="产品名称" required />
          <TextInput
            value={product.name}
            onChange={(value) => onUpdate({ name: value })}
            placeholder="例如：防蓝光护眼面霜"
            error={error?.name}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
        <div>
          <FieldLabel label="品类" required />
          <select
            value={product.category}
            onChange={(event) => onUpdate({ category: event.target.value })}
            className={cn(
              "w-full rounded-lg border bg-[#fffefb] px-3.5 py-2.5 text-sm text-[#201515] focus:outline-none",
              error?.category
                ? "border-[#ff4f00]/45"
                : "border-[#c5c0b1] focus:border-[#ff4f00]/35",
            )}
          >
            <option value="">请选择品类</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {error?.category ? (
            <p className="mt-1.5 text-[11px] text-[#ff4f00]">{error.category}</p>
          ) : null}
        </div>
        <div>
          <FieldLabel label="品牌" />
          <TextInput
            value={product.brand}
            onChange={(value) => onUpdate({ brand: value })}
            placeholder="例如：MyBrand"
          />
        </div>
      </div>

      <div>
        <FieldLabel label="产品链接" />
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#939084]">
            <Link2 className="h-3.5 w-3.5" />
          </span>
          <input
            type="url"
            value={product.link}
            onChange={(event) => onUpdate({ link: event.target.value })}
            placeholder="https://"
            className="w-full rounded-lg border border-[#c5c0b1] bg-[#fffefb] py-2.5 pr-3.5 pl-9 text-sm text-[#201515] placeholder:text-[#b5b2aa] focus:border-[#ff4f00]/35 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <FieldLabel label="Brief" hint="上传文件或粘贴链接" />
        {product.briefName.trim() ? (
          <div className="flex items-center gap-2 rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-2">
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-[#939084]" />
            <span className="min-w-0 flex-1 truncate text-xs text-[#36342e]">
              {product.briefName}
            </span>
            <Button
              unstyled
              type="button"
              onClick={() => onUpdate({ briefName: "", briefUrl: "" })}
              aria-label="移除 Brief"
              className="shrink-0 text-[#939084] transition-colors hover:text-[#b00020]"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="url"
              value={product.briefUrl}
              onChange={(event) => onUpdate({ briefUrl: event.target.value })}
              placeholder="粘贴 Brief 链接"
              className="min-w-0 flex-1 rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3.5 py-2.5 text-sm text-[#201515] placeholder:text-[#b5b2aa] focus:border-[#ff4f00]/35 focus:outline-none"
            />
            <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-2.5 text-sm font-medium text-[#36342e] transition-colors hover:bg-[#eceae3]">
              <Upload className="h-3.5 w-3.5" />
              上传
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.key,image/*"
                onChange={handleBriefFile}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      <div>
        <FieldLabel label="目标建联人数" hint="计划触达的达人数量，由你自行设定" />
        <TextInput
          type="number"
          value={outreachTarget == null ? "" : String(outreachTarget)}
          onChange={handleTargetChange}
          placeholder="例如：50"
        />
      </div>
    </div>
  );
}
