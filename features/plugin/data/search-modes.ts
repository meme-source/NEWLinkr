export const searchModes = [
  {
    key: "comprehensive" as const,
    label: "找相似",
    summary: "内容和调性风格相近的博主推荐。",
    eta: "预计 8-12 秒",
  },
  {
    key: "budget" as const,
    label: "找平替",
    summary: "风格/受众相似，但报价更低的博主。",
    eta: "预计 6-10 秒",
  },
  {
    key: "seed" as const,
    label: "找种子达人",
    summary: "打开后台博主发现，从零物色一批适合的种子博主。",
    eta: "预计 8-12 秒",
  },
];
