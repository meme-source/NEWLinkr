// CPM 设置 — 国家字典与默认分类
// 用于"地区分类管理"中的搜索补全（输入"土耳" → 推荐"土耳其"）。
// 中文名为唯一标识；aliases 用于额外匹配口径，例如英文 / 简称 / 旧称。

export type CpmTier = "developed" | "developing" | "underdeveloped";

export interface CpmCountry {
  name: string;
  flag: string;
  aliases?: string[];
}

export const CPM_COUNTRY_DICT: CpmCountry[] = [
  // 北美 / 大洋洲
  { name: "美国", flag: "🇺🇸", aliases: ["美利坚", "USA", "United States", "America"] },
  { name: "加拿大", flag: "🇨🇦", aliases: ["Canada"] },
  { name: "墨西哥", flag: "🇲🇽", aliases: ["Mexico"] },
  { name: "澳大利亚", flag: "🇦🇺", aliases: ["澳洲", "Australia"] },
  { name: "新西兰", flag: "🇳🇿", aliases: ["New Zealand"] },

  // 欧洲（西欧 / 北欧 / 南欧）
  { name: "英国", flag: "🇬🇧", aliases: ["大不列颠", "UK", "United Kingdom", "Britain"] },
  { name: "爱尔兰", flag: "🇮🇪", aliases: ["Ireland"] },
  { name: "德国", flag: "🇩🇪", aliases: ["Germany"] },
  { name: "法国", flag: "🇫🇷", aliases: ["France"] },
  { name: "意大利", flag: "🇮🇹", aliases: ["Italy"] },
  { name: "西班牙", flag: "🇪🇸", aliases: ["Spain"] },
  { name: "葡萄牙", flag: "🇵🇹", aliases: ["Portugal"] },
  { name: "荷兰", flag: "🇳🇱", aliases: ["Netherlands"] },
  { name: "比利时", flag: "🇧🇪", aliases: ["Belgium"] },
  { name: "瑞士", flag: "🇨🇭", aliases: ["Switzerland"] },
  { name: "奥地利", flag: "🇦🇹", aliases: ["Austria"] },
  { name: "卢森堡", flag: "🇱🇺", aliases: ["Luxembourg"] },
  { name: "瑞典", flag: "🇸🇪", aliases: ["Sweden"] },
  { name: "挪威", flag: "🇳🇴", aliases: ["Norway"] },
  { name: "丹麦", flag: "🇩🇰", aliases: ["Denmark"] },
  { name: "芬兰", flag: "🇫🇮", aliases: ["Finland"] },
  { name: "冰岛", flag: "🇮🇸", aliases: ["Iceland"] },
  { name: "希腊", flag: "🇬🇷", aliases: ["Greece"] },

  // 中东欧
  { name: "波兰", flag: "🇵🇱", aliases: ["Poland"] },
  { name: "捷克", flag: "🇨🇿", aliases: ["Czech"] },
  { name: "匈牙利", flag: "🇭🇺", aliases: ["Hungary"] },
  { name: "罗马尼亚", flag: "🇷🇴", aliases: ["Romania"] },
  { name: "保加利亚", flag: "🇧🇬", aliases: ["Bulgaria"] },
  { name: "乌克兰", flag: "🇺🇦", aliases: ["Ukraine"] },
  { name: "俄罗斯", flag: "🇷🇺", aliases: ["俄国", "Russia"] },
  { name: "白俄罗斯", flag: "🇧🇾", aliases: ["Belarus"] },

  // 东亚
  { name: "中国", flag: "🇨🇳", aliases: ["中华人民共和国", "China"] },
  { name: "中国香港", flag: "🇭🇰", aliases: ["香港", "Hong Kong"] },
  { name: "中国台湾", flag: "🇹🇼", aliases: ["台湾", "Taiwan"] },
  { name: "日本", flag: "🇯🇵", aliases: ["Japan"] },
  { name: "韩国", flag: "🇰🇷", aliases: ["南韩", "Korea"] },
  { name: "蒙古", flag: "🇲🇳", aliases: ["蒙古国", "Mongolia"] },

  // 东南亚
  { name: "新加坡", flag: "🇸🇬", aliases: ["Singapore"] },
  { name: "马来西亚", flag: "🇲🇾", aliases: ["大马", "Malaysia"] },
  { name: "泰国", flag: "🇹🇭", aliases: ["Thailand"] },
  { name: "越南", flag: "🇻🇳", aliases: ["Vietnam"] },
  { name: "印度尼西亚", flag: "🇮🇩", aliases: ["印尼", "Indonesia"] },
  { name: "菲律宾", flag: "🇵🇭", aliases: ["Philippines"] },
  { name: "缅甸", flag: "🇲🇲", aliases: ["Myanmar", "Burma"] },
  { name: "柬埔寨", flag: "🇰🇭", aliases: ["Cambodia"] },
  { name: "老挝", flag: "🇱🇦", aliases: ["Laos"] },
  { name: "文莱", flag: "🇧🇳", aliases: ["Brunei"] },
  { name: "东帝汶", flag: "🇹🇱", aliases: ["Timor-Leste"] },

  // 南亚
  { name: "印度", flag: "🇮🇳", aliases: ["India"] },
  { name: "巴基斯坦", flag: "🇵🇰", aliases: ["Pakistan"] },
  { name: "孟加拉国", flag: "🇧🇩", aliases: ["Bangladesh"] },
  { name: "斯里兰卡", flag: "🇱🇰", aliases: ["Sri Lanka"] },
  { name: "尼泊尔", flag: "🇳🇵", aliases: ["Nepal"] },
  { name: "马尔代夫", flag: "🇲🇻", aliases: ["Maldives"] },
  { name: "阿富汗", flag: "🇦🇫", aliases: ["Afghanistan"] },

  // 中东 / 西亚
  { name: "土耳其", flag: "🇹🇷", aliases: ["Turkey", "Türkiye"] },
  { name: "以色列", flag: "🇮🇱", aliases: ["Israel"] },
  { name: "阿联酋", flag: "🇦🇪", aliases: ["阿拉伯联合酋长国", "UAE", "迪拜"] },
  { name: "沙特阿拉伯", flag: "🇸🇦", aliases: ["沙特", "Saudi Arabia"] },
  { name: "卡塔尔", flag: "🇶🇦", aliases: ["Qatar"] },
  { name: "科威特", flag: "🇰🇼", aliases: ["Kuwait"] },
  { name: "巴林", flag: "🇧🇭", aliases: ["Bahrain"] },
  { name: "阿曼", flag: "🇴🇲", aliases: ["Oman"] },
  { name: "约旦", flag: "🇯🇴", aliases: ["Jordan"] },
  { name: "黎巴嫩", flag: "🇱🇧", aliases: ["Lebanon"] },
  { name: "伊朗", flag: "🇮🇷", aliases: ["Iran"] },
  { name: "伊拉克", flag: "🇮🇶", aliases: ["Iraq"] },
  { name: "叙利亚", flag: "🇸🇾", aliases: ["Syria"] },
  { name: "也门", flag: "🇾🇪", aliases: ["Yemen"] },

  // 中亚
  { name: "哈萨克斯坦", flag: "🇰🇿", aliases: ["Kazakhstan"] },
  { name: "乌兹别克斯坦", flag: "🇺🇿", aliases: ["Uzbekistan"] },
  { name: "吉尔吉斯斯坦", flag: "🇰🇬", aliases: ["Kyrgyzstan"] },
  { name: "塔吉克斯坦", flag: "🇹🇯", aliases: ["Tajikistan"] },
  { name: "土库曼斯坦", flag: "🇹🇲", aliases: ["Turkmenistan"] },

  // 拉丁美洲
  { name: "巴西", flag: "🇧🇷", aliases: ["Brazil"] },
  { name: "阿根廷", flag: "🇦🇷", aliases: ["Argentina"] },
  { name: "智利", flag: "🇨🇱", aliases: ["Chile"] },
  { name: "哥伦比亚", flag: "🇨🇴", aliases: ["Colombia"] },
  { name: "秘鲁", flag: "🇵🇪", aliases: ["Peru"] },
  { name: "委内瑞拉", flag: "🇻🇪", aliases: ["Venezuela"] },
  { name: "厄瓜多尔", flag: "🇪🇨", aliases: ["Ecuador"] },
  { name: "乌拉圭", flag: "🇺🇾", aliases: ["Uruguay"] },
  { name: "巴拉圭", flag: "🇵🇾", aliases: ["Paraguay"] },
  { name: "玻利维亚", flag: "🇧🇴", aliases: ["Bolivia"] },
  { name: "古巴", flag: "🇨🇺", aliases: ["Cuba"] },
  { name: "多米尼加", flag: "🇩🇴", aliases: ["Dominican Republic"] },
  { name: "海地", flag: "🇭🇹", aliases: ["Haiti"] },
  { name: "危地马拉", flag: "🇬🇹", aliases: ["Guatemala"] },
  { name: "洪都拉斯", flag: "🇭🇳", aliases: ["Honduras"] },
  { name: "尼加拉瓜", flag: "🇳🇮", aliases: ["Nicaragua"] },

  // 非洲
  { name: "南非", flag: "🇿🇦", aliases: ["South Africa"] },
  { name: "埃及", flag: "🇪🇬", aliases: ["Egypt"] },
  { name: "摩洛哥", flag: "🇲🇦", aliases: ["Morocco"] },
  { name: "阿尔及利亚", flag: "🇩🇿", aliases: ["Algeria"] },
  { name: "突尼斯", flag: "🇹🇳", aliases: ["Tunisia"] },
  { name: "尼日利亚", flag: "🇳🇬", aliases: ["Nigeria"] },
  { name: "肯尼亚", flag: "🇰🇪", aliases: ["Kenya"] },
  { name: "埃塞俄比亚", flag: "🇪🇹", aliases: ["Ethiopia"] },
  { name: "加纳", flag: "🇬🇭", aliases: ["Ghana"] },
  { name: "坦桑尼亚", flag: "🇹🇿", aliases: ["Tanzania"] },
  { name: "乌干达", flag: "🇺🇬", aliases: ["Uganda"] },
  { name: "卢旺达", flag: "🇷🇼", aliases: ["Rwanda"] },
  { name: "塞内加尔", flag: "🇸🇳", aliases: ["Senegal"] },
  { name: "津巴布韦", flag: "🇿🇼", aliases: ["Zimbabwe"] },
  { name: "莫桑比克", flag: "🇲🇿", aliases: ["Mozambique"] },
  { name: "安哥拉", flag: "🇦🇴", aliases: ["Angola"] },
  { name: "苏丹", flag: "🇸🇩", aliases: ["Sudan"] },
];

export const DEFAULT_TIER_COUNTRIES: Record<CpmTier, string[]> = {
  developed: [
    "美国",
    "加拿大",
    "英国",
    "德国",
    "法国",
    "日本",
    "韩国",
    "新加坡",
    "澳大利亚",
    "新西兰",
    "荷兰",
    "瑞士",
    "瑞典",
    "丹麦",
    "挪威",
  ],
  developing: [
    "中国",
    "巴西",
    "印度",
    "印度尼西亚",
    "墨西哥",
    "土耳其",
    "泰国",
    "马来西亚",
    "越南",
    "菲律宾",
    "南非",
    "波兰",
    "俄罗斯",
    "阿根廷",
  ],
  underdeveloped: ["尼日利亚", "孟加拉国", "巴基斯坦", "埃塞俄比亚", "缅甸", "柬埔寨", "尼泊尔"],
};

export type CpmCurrency = "USD" | "EUR" | "GBP" | "JPY" | "CNY";

export const CPM_CURRENCY_OPTIONS: Array<{
  code: CpmCurrency;
  symbol: string;
  label: string;
}> = [
  { code: "USD", symbol: "$", label: "美元 USD" },
  { code: "EUR", symbol: "€", label: "欧元 EUR" },
  { code: "GBP", symbol: "£", label: "英镑 GBP" },
  { code: "JPY", symbol: "¥", label: "日元 JPY" },
  { code: "CNY", symbol: "¥", label: "人民币 CNY" },
];
