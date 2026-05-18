// 「受众人群」维度的 mock 分析数据,按博主 id 索引。
//
// 这是对真实后台产出的模拟 —— 真实环境下,受众维度由后台分析任务产出、随卡
// 片数据一起下发(见 deriveAnalysis 的 audience 入参)。此处用一张静态表占
// 位,让深度分析在 Phase 0 就能展示「内容主题 / 受众人群 / 内容形式…」多个
// 维度的效果。接入真实数据后整个文件可删。
//
// 注:维度归属(「受众人群」)在 deriveAnalysis 里固定,不写进数据 —— 维度
// 名不需要额外标出来。

export const audienceByCreatorId: Record<string, string[]> = {
  // comprehensive
  "outdoor-jane": ["女性受众为主", "25-34 岁", "北美都市"],
  "camp-mike": ["男性受众为主", "青年群体", "户外硬核"],
  "wildfern-sky": ["女性受众为主", "青年群体", "加拿大本土"],
  "alpine-lia": ["女性受众偏多", "Z 世代", "轻户外新手"],
  "river-and-pine": ["性别均衡", "25-34 岁", "家庭用户"],
  "sage-and-stone": ["性别均衡", "熟龄受众", "欧洲受众"],
  "prairie-noon": ["女性受众偏多", "青年群体", "学生群体"],
  "moss-walks": ["男性受众偏多", "25-34 岁", "澳洲本土"],
  "harbor-folk": ["性别均衡", "青年群体", "海岸生活圈"],
  "northbound-ev": ["男性受众为主", "25-44 岁", "公路旅行爱好者"],
  "field-and-fern": ["女性受众为主", "Z 世代", "轻户外新手"],
  "kindling-co": ["性别均衡", "25-44 岁", "泛户外大众"],
  "mira-trails": ["女性受众偏多", "青年群体", "徒步圈层"],
  "valley-stitch": ["女性受众为主", "Z 世代", "家庭用户"],
  "twin-peaks-co": ["男性受众偏多", "25-34 岁", "山系玩家"],
  "softwild-dy": ["女性受众偏多", "青年群体", "新西兰本土"],

  // budget
  "trail-daily": ["男性受众为主", "25-34 岁", "装备测评受众"],
  "camping-weekend": ["性别均衡", "青年群体", "加拿大本土"],
  "budget-ridge-jay": ["男性受众偏多", "Z 世代", "轻户外新手"],
  "budget-tin-cup": ["性别均衡", "25-34 岁", "露营圈层"],
  "budget-lakehouse": ["女性受众为主", "熟龄受众", "湖区生活圈"],
  "budget-foglands": ["性别均衡", "25-44 岁", "英国本土"],
  "budget-sundown-co": ["女性受众偏多", "青年群体", "情绪生活受众"],
  "budget-cinder-pine": ["男性受众偏多", "Z 世代", "学生群体"],
  "budget-quietwoods": ["性别均衡", "25-34 岁", "加拿大本土"],
  "budget-saltvalley": ["男性受众为主", "青年群体", "澳洲本土"],
  "budget-stonebrook": ["女性受众偏多", "Z 世代", "轻户外新手"],
  "budget-pinepost": ["性别均衡", "25-44 岁", "泛户外大众"],
  "budget-driftway": ["男性受众为主", "青年群体", "公路旅行爱好者"],
  "budget-fernsong": ["女性受众偏多", "青年群体", "新西兰本土"],

  // seed
  "north-woods-ava": ["女性受众为主", "青年群体", "北美都市"],
  "roam-family": ["性别均衡", "熟龄受众", "家庭用户"],
  "seed-tide-and-trail": ["性别均衡", "25-34 岁", "海岸生活圈"],
  "seed-quiet-coast": ["女性受众偏多", "青年群体", "加拿大本土"],
  "seed-fellow-pine": ["男性受众偏多", "25-44 岁", "社群型受众"],
  "seed-amber-tides": ["女性受众为主", "青年群体", "澳洲本土"],
  "seed-evergreen-co": ["性别均衡", "25-34 岁", "泛户外大众"],
  "seed-thatch-and-thread": ["女性受众偏多", "Z 世代", "英国本土"],
  "seed-greylight": ["男性受众偏多", "青年群体", "摄影爱好者"],

  // tier
  "camp-headline": ["性别均衡", "25-44 岁", "泛户外大众"],
  "micro-camp-log": ["男性受众偏多", "Z 世代", "硬核露营圈"],

  // geo
  "alpine-escape-de": ["性别均衡", "25-34 岁", "德国本土"],
  "forest-weekend-jp": ["女性受众偏多", "青年群体", "日系户外受众"],

  // brand
  "gear-partner": ["男性受众为主", "25-44 岁", "装备发烧友"],
  "camp-review-lab": ["性别均衡", "25-34 岁", "测评关注者"],
};
