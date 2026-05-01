# Creator Data Providers

封装第三方达人数据源（TikTok / Instagram / YouTube）。

## 候选

| Provider             | 说明                           | 价格              |
| -------------------- | ------------------------------ | ----------------- |
| Modash               | 数据全，覆盖 IG/TikTok/YouTube | $200+/月          |
| Phyllo               | 偏 SDK，开发友好               | 按调用            |
| Apify TikTok Scraper | 按次付费，最便宜               | ~$0.3/1k profiles |
| TikAPI               | TikTok 专精                    | $100+/月          |

## 接口约定

每个 provider 必须实现：

```ts
export interface CreatorProvider {
  getCreator(handle: string, platform: Platform): Promise<Creator>;
  getRecentPosts(creatorId: string, limit: number): Promise<Post[]>;
  searchByCategory(category: string, platform: Platform): Promise<Creator[]>;
}
```

Phase 1 只需实现一个 provider。
