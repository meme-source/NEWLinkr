// 项目 —— 全项目唯一的"项目实体"模型。
//
// 背景：此前插件端（features/plugin 的 ProjectSummary）和网页端
// （features/project 的 WorkspaceProject）各维护一套项目类型、各有一套
// 创建逻辑。本模块把两者收敛成一个权威 `Project` 形状 + 一个 `createProject`
// 创建核心：
//   - 网页端 WorkspaceProject 直接 = Project（见 project-context.tsx）。
//   - 插件端 ProjectSummary 是 Project 的投影视图（见 features/plugin/types.ts），
//     通过 toProjectSummary() 映射。
//   - 三个创建入口（插件「新建项目」、网页 ProjectBar「+」、discovery 秒建）
//     都调 createProject()，必填规则与默认值由这里统一。
//
// types/api.ts 里的 `Project` 是 API 层的瘦形状（Phase 1 stub）。两者将在真实
// 后端接通时合并 —— 在那之前，UI 侧统一用本模块的 `Project`。

export type ProjectStatus = "draft" | "running" | "paused" | "completed";

export type ProjectCurrency = "USD" | "EUR" | "GBP" | "CNY";

// §3.2 合作形式 —— 决定后续是否需要折扣码 / 寄样信息等分支字段。空串 = 尚未选择。
// "mixed" = 项目允许多种合作方式并存；具体每个达人用哪种由 ProjectCreatorLink
// 各自记录（见 features/project/lib/project-creator-link.ts）。
export type ProjectCollaborationType = "" | "gifted" | "paid" | "affiliate" | "mixed";

// 内容简报 —— 给达人的交付要求与内容规范。与项目起止日期区分：起止是合作期，
// publishWindow 是内容上线期。
export interface ProjectContentBrief {
  // 每位达人需交付的内容条数。null = 未设定。
  deliverablesPerCreator: number | null;
  publishWindow: { start: string; end: string };
  requiredHashtags: string[];
  mentionAccounts: string[];
  // 是否需要达人授权品牌做白名单 / 二次投流。
  needsWhitelisting: boolean;
  bannedWords: string[];
}

// 产品 —— 网页端一个项目绑定一个产品（1:1）。products 数组保留为兼容载体，
// 网页端始终只放一个元素。
export interface ProjectProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  link: string;
  // 产品图片 —— 上传后存为 data URL（前端 mock，无后端时也能持久化到 localStorage）。
  imageUrl: string;
  // Brief —— briefUrl 是链接，或上传文件的 data URL；briefName 是上传文件名（链接时为空）。
  briefName: string;
  briefUrl: string;
}

// 目标 KPI —— 与执行后的实际效果（deriveProjectStats 的 actual）对照成闭环。
// 建联人数目标沿用 Project.outreachTarget，不在这里重复。
export interface ProjectTargetMetrics {
  impressions: number | null;
  engagementRate: number | null; // 0–1
  conversions: number | null;
  gmv: number | null;
  roi: number | null;
}

export interface Project {
  // ── 身份 ──────────────────────────────────────────────────────────────
  id: string;
  name: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;

  // ── 产品 ──────────────────────────────────────────────────────────────
  // 一个项目绑定一个产品 —— products 数组始终只有一个元素。productName /
  // productDescription / category / brand / productLink 保留为 products[0] 的
  // 镜像，供插件端 ProjectSummary、概览卡等仍按单产品读取的旧调用点使用，
  // 由网页端保存项目时回写同步。
  products: ProjectProduct[];
  productName: string;
  productDescription: string;
  category: string;
  brand: string;
  productLink: string;

  // ── 约束 / 目标 ───────────────────────────────────────────────────────
  startDate: string;
  endDate: string;
  budgetAmount: string;
  budgetCurrency: ProjectCurrency;
  outreachTarget: number | null;
  // §3.6.3 CPM 项目级系数。null === 1.0（无调整）。
  cpmMultiplier: number | null;

  // ── 营销活动信息 ──────────────────────────────────────────────────────
  // targetMarkets / platforms 可由「发现达人」环节选定的国家 / 平台自动回填；
  // sellingPoints / targetAudience 可由产品链接抽取或发现环节回填。均可手动覆盖。
  targetMarkets: string[];
  platforms: string[];
  collaborationType: ProjectCollaborationType;
  contentFormats: string[];
  sellingPoints: string;
  targetAudience: string;

  // ── 内容简报 / 目标 KPI ───────────────────────────────────────────────
  contentBrief: ProjectContentBrief;
  targetMetrics: ProjectTargetMetrics;

  // ── 已有达人名单 ──────────────────────────────────────────────────────
  // 创建项目时可选上传的名单文件名。两端创建流程都支持，选填。
  uploadedListNames: string[];
}

// 创建项目的入参 —— 只有 name 必填，其余都有默认值。各端 UI 自行决定更严格的
// 必填规则（网页端额外要求产品名 + 品类，插件端额外要求产品描述）。
export type ProjectCreateInput = { name: string } & Partial<
  Omit<Project, "id" | "name" | "createdAt" | "updatedAt">
>;

// 一个项目除身份字段外的"空白底板"。withProjectDefaults 用它补齐缺失字段，
// 让旧 localStorage 数据（可能缺新增字段）也能安全升级到完整 Project。
const PROJECT_BLANK: Omit<Project, "id" | "createdAt" | "updatedAt"> = {
  name: "未命名项目",
  status: "draft",
  products: [],
  productName: "",
  productDescription: "",
  category: "",
  brand: "",
  productLink: "",
  startDate: "",
  endDate: "",
  budgetAmount: "",
  budgetCurrency: "USD",
  outreachTarget: null,
  cpmMultiplier: null,
  targetMarkets: [],
  platforms: [],
  collaborationType: "",
  contentFormats: [],
  sellingPoints: "",
  targetAudience: "",
  contentBrief: {
    deliverablesPerCreator: null,
    publishWindow: { start: "", end: "" },
    requiredHashtags: [],
    mentionAccounts: [],
    needsWhitelisting: false,
    bannedWords: [],
  },
  targetMetrics: {
    impressions: null,
    engagementRate: null,
    conversions: null,
    gmv: null,
    roi: null,
  },
  uploadedListNames: [],
};

// 生成一个空白产品 —— 新建项目、抽屉「添加产品」入口共用。
export function createBlankProduct(): ProjectProduct {
  const rand = Math.random().toString(36).slice(2, 8);
  return {
    id: `product-${Date.now()}-${rand}`,
    name: "",
    category: "",
    brand: "",
    link: "",
    imageUrl: "",
    briefName: "",
    briefUrl: "",
  };
}

// 把一个可能缺字段的产品对象补齐成完整 ProjectProduct。
// 旧 localStorage 数据可能缺 imageUrl / briefName / briefUrl 等后加字段。
function withProductDefaults(partial: Partial<ProjectProduct>, fallbackId: string): ProjectProduct {
  return {
    id: partial.id ?? fallbackId,
    name: partial.name ?? "",
    category: partial.category ?? "",
    brand: partial.brand ?? "",
    link: partial.link ?? "",
    imageUrl: partial.imageUrl ?? "",
    briefName: partial.briefName ?? "",
    briefUrl: partial.briefUrl ?? "",
  };
}

// 把一个可能不完整的项目对象补齐成完整 Project。
// 缺失的键回落到 PROJECT_BLANK 默认值；id / 时间戳缺失时即时生成。
export function withProjectDefaults(partial: Partial<Project>): Project {
  const now = new Date().toISOString();
  const base: Project = {
    ...PROJECT_BLANK,
    ...partial,
    id: partial.id ?? `project-${Date.now()}`,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
  // 旧 localStorage 数据没有 products 数组 —— 用旧的单产品字段合成首个产品，
  // 让历史项目也能安全升级到多产品模型。
  if (
    base.products.length === 0 &&
    (base.productName || base.category || base.brand || base.productLink)
  ) {
    return {
      ...base,
      products: [
        withProductDefaults(
          {
            id: `product-${base.id}-0`,
            name: base.productName,
            category: base.category,
            brand: base.brand,
            link: base.productLink,
          },
          `product-${base.id}-0`,
        ),
      ],
    };
  }
  // 已有 products 数组的旧数据也要逐个补齐后加字段，否则缺 briefUrl 等会在 UI 层崩。
  return {
    ...base,
    products: base.products.map((product, index) =>
      withProductDefaults(product, `product-${base.id}-${index}`),
    ),
  };
}

// 统一创建核心 —— 所有"新建项目"入口都走这里。
export function createProject(input: ProjectCreateInput): Project {
  return withProjectDefaults({
    ...input,
    name: input.name.trim() || PROJECT_BLANK.name,
  });
}
