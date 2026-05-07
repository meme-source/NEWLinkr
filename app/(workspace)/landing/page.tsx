"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, ChevronDown, ChevronUp, X } from "lucide-react";

const FAQS = [
  {
    q: "Linkr 和手动找博主有什么本质区别？",
    a: "手动找博主是“大海捞针”——你需要自己定义关键词、逐个翻看主页、手动记录。Linkr 是“点菜”——你只需要丢一个对标账号，AI 会理解你要的调性和数据标准，瞬间拉出一整份名单。从“搜索”变成“筛选”，效率提升不是 10%，是 10 倍。",
  },
  {
    q: "邮箱抓取准确吗？会不会都是过期的？",
    a: "Linkr 的邮箱抓取成功率在 95% 以上，并且会自动验证邮箱有效性。我们不是简单爬取页面文本，而是通过多源交叉验证确保你拿到的是真实可用联系方式。",
  },
  {
    q: "支持哪些平台？",
    a: "目前支持 TikTok、Instagram、YouTube 三大主流平台。Chrome 插件在浏览页面时实时工作，无需切换工具。",
  },
  {
    q: "体验版 ¥9.9 到期后会自动扣费吗？",
    a: "不会。体验版是一次性付费，到期后你可以选择升级到畅享版，或者不续费。没有隐藏扣款。",
  },
  {
    q: "AI 写的邮件质量怎么样？",
    a: "Linkr 的 AI 会分析目标博主的内容风格、受众特征和合作偏好，生成高度个性化建联邮件。不是千篇一律模板，而是让博主觉得你真的做过功课。",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const panelId = `faq-${q}`;
  return (
    <article className="landing-faq-item">
      <button
        type="button"
        className="landing-faq-question"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        {q}
        {open ? (
          <ChevronUp aria-hidden="true" className="h-4 w-4" />
        ) : (
          <ChevronDown aria-hidden="true" className="h-4 w-4" />
        )}
      </button>
      {open && (
        <p id={panelId} className="landing-faq-answer">
          {a}
        </p>
      )}
    </article>
  );
}

export default function Home() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <Link href="/landing" className="landing-brand">
            <span className="landing-logo">
              <Image
                src="/linkr-logo.png"
                alt="Linkr"
                fill
                sizes="40px"
                className="object-contain"
              />
            </span>
            Linkr
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/workspace" className="landing-secondary-btn hidden sm:inline-flex">
              进入工作台
            </Link>
            <Link href="/demo" className="landing-nav-cta">
              安装插件
            </Link>
          </div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">✨ 已替 2,000+ 打工人省下了周末</p>
            <h1 className="landing-title">
              今晚，别再一行行
              <br />
              复制博主了。
            </h1>
            <p className="landing-subtitle">
              找人、找邮箱、写邮件的脏活交给 AI。你只负责点发送，然后，准点下班。
            </p>
            <div className="landing-actions">
              <Link href="/demo" className="landing-primary-btn">
                拿走这 100 个博主名单
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link href="/workspace" className="landing-secondary-btn">
                进入工作台
              </Link>
            </div>
            <div className="landing-trust-row">
              <span>100+博主 / 5 分钟</span>
              <span>199/月不限次，不数数</span>
              <span>3x回复率</span>
            </div>
          </div>

          <div className="landing-stage">
            <div className="landing-screen">
              <div className="landing-screen-bar">
                <span />
                <span />
                <span />
              </div>
              <div className="landing-screen-frame">
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-4 text-[11px] text-[#939084]">
                    <span className="font-semibold text-[#201515]">相似创作者</span>
                    <span>我的列表</span>
                    <span>外联邮件</span>
                    <span>数据总览</span>
                  </div>
                  <div className="rounded-full border border-[#20151514] bg-[#fffefb] px-3 py-2 text-xs text-[#939084]">
                    输入种子账号或关键词...
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                    <span className="rounded-full bg-[#eceae3] px-2 py-1">美妆 · 32K</span>
                    <span className="rounded-full bg-[#eceae3] px-2 py-1">时尚 · 89K</span>
                    <span className="rounded-full bg-[#eceae3] px-2 py-1">生活 · 156K</span>
                  </div>
                </div>
              </div>
              <div className="landing-screen-foot">
                <div>
                  <strong>媒介的日常</strong>
                  <span>一个号翻半天，名单还不齐。</span>
                </div>
                <span className="landing-screen-pill">AI 代劳中</span>
              </div>
            </div>

            <div className="landing-stage-card landing-stage-card-top">
              <p className="landing-stage-kicker">AI找人</p>
              <strong>基于对标账号，找到了38个相似博主，数据已标好</strong>
              <span>以前这活你得翻一下午</span>
            </div>
            <div className="landing-stage-card landing-stage-card-left">
              <p className="landing-stage-kicker">邮箱已找到</p>
              <strong>这个博主的邮箱在个人网站底部，已经抓到了</strong>
              <span>手动找这个能找到怀疑人生</span>
            </div>
            <div className="landing-stage-card landing-stage-card-bottom">
              <p className="landing-stage-kicker">邮件已写好</p>
              <strong>读完 ta 最近 5 条内容写的建联邮件，要看看吗？</strong>
              <span>不是改名字的模板，博主看得出来</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-head landing-section-head-left">
            <h2>这些活，你每天都在干。每一件都不需要你亲手干。</h2>
            <span>找博主、扒邮箱、写邮件。手动，重复，没技术含量。</span>
          </div>
          <div className="landing-pain-grid">
            {[
              [
                "😩",
                "TikTok翻完翻Instagram，Instagram翻完翻YouTube。翻了500个主页，存下来不到20个。",
                "更气的是，有几个一看数据就是假粉，白翻了。你花半天做的事，AI能做得更快，还自带假粉过滤。",
              ],
              [
                "😱",
                "邮箱不在简介里。不在About页。不在链接树。一个博主的联系方式，你找了20分钟。",
                "你打开了ta的个人网站，翻到页脚，终于找到了一个mailto链接。整个过程20分钟。一个博主。",
              ],
              [
                "🤯",
                "群发了100封邮件，回了2封。其中一封是退订。",
                "群发模板博主看都不看。一封一封手写，一天写不了几封。你知道个性化邮件回复率高，但谁有那个时间？",
              ],
            ].map((p) => (
              <article key={p[0]} className="landing-pain-card">
                <span className="landing-pain-index">{p[0]}</span>
                <h3>{p[1]}</h3>
                <p>{p[2]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-contrast">
        <div className="landing-container landing-compare-shell">
          <div className="landing-section-head">
            <p>做个对比</p>
            <h2>同样找50个博主，一个干到半夜，一个下午交差。</h2>
          </div>
          <div className="landing-compare-table">
            <div className="landing-compare-row landing-compare-head">
              <div>对比项</div>
              <div>✕ 没有 Linkr 的日常</div>
              <div>✓ 用了 Linkr 之后</div>
            </div>
            {[
              ["找博主", "三个平台来回切，一天翻500个主页", "丢一个对标账号，AI拉出一批相似博主"],
              ["找邮箱", "邮箱到处找，一个博主能翻20分钟", "邮箱自动抓取，直接填进名单"],
              ["写邮件", "邮件模板群发，博主看都不看", "AI读完博主内容再写邮件，每封都不一样"],
              ["结果", "加班到11点，名单勉强凑齐", "下午交差，名单和邮件都 ready 了"],
            ].map((row) => (
              <div key={row[0]} className="landing-compare-row">
                <div className="landing-compare-label">{row[0]}</div>
                <div className="landing-compare-cell is-highlight">
                  <X aria-hidden="true" className="mr-2 inline h-3.5 w-3.5" />
                  {row[1]}
                </div>
                <div className="landing-compare-cell is-highlight-secondary">
                  <Check aria-hidden="true" className="mr-2 inline h-3.5 w-3.5" />
                  {row[2]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-head">
            <p>三件脏活，AI全包了</p>
            <h2>你不用干了。认真的。</h2>
            <span>找人、联系、写信——从头到尾，你只管拍板。</span>
          </div>
          <div className="landing-workflow-grid">
            {[
              {
                id: "ai-discovery",
                subtitle: "场景一 · AI找博主",
                title: "丢一个对标账号进去，一堆同类型博主排好队等你挑。",
                icon: "🤖",
                showPluginCta: false,
              },
              {
                id: "auto-email-capture",
                subtitle: "场景二 · 自动抓邮箱",
                title: "邮箱这种破活，让Chrome插件去干。",
                icon: "🔌",
                showPluginCta: true,
              },
              {
                id: "ai-outreach",
                subtitle: "场景三 · AI写建联邮件",
                title: "每封邮件都像你花了半小时研究过这个博主。",
                icon: "✍️",
                showPluginCta: false,
              },
            ].map((s) => (
              <article key={s.id} className="landing-workflow-card">
                <span className="landing-workflow-icon text-2xl">{s.icon}</span>
                <h3>{s.title}</h3>
                <p>{s.subtitle}</p>
                {s.showPluginCta && (
                  <Link href="/demo" className="landing-secondary-btn mt-4">
                    ⬇ 下载 Chrome 插件
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-contrast">
        <div className="landing-container">
          <div className="landing-section-head">
            <p>谁在用</p>
            <h2>你的日常被写在下面了。</h2>
          </div>
          <div className="landing-fit-grid">
            {[
              [
                "跨境电商媒介",
                "早上TikTok找人，下午Instagram找邮箱，晚上YouTube做备选。到了十点，表格里还是那几个名字。",
              ],
              [
                "品牌营销经理",
                "品牌方给了调性要求，老板给了deadline，你夹在中间对着Excel发呆。你需要的不是更多选择，是更少但更准的选择。",
              ],
              [
                "MCN 商务",
                "签约靠眼光，但发现靠体力。你知道什么样的博主有潜力，问题是从哪里批量找到他们。",
              ],
              [
                "独立开发者 / 独立站卖家",
                "没有媒介团队，没有Agency预算，产品推广、博主建联全靠你一个人扛。",
              ],
            ].map((u) => (
              <article key={u[0]} className="landing-fit-card">
                <h3>{u[0]}</h3>
                <p>{u[1]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-head">
            <p>价格</p>
            <h2>两个价格，没有套路。</h2>
            <span>找博主、扒邮箱、写邮件——这些体力活外包给 AI。</span>
          </div>
          <div className="landing-pricing-grid">
            <article className="landing-price-card">
              <div className="landing-price-head">
                <div>
                  <p>体验版</p>
                  <strong>全功能开放，用一个月看看合不合适。</strong>
                </div>
              </div>
              <div className="landing-price-value">
                <span>¥9.9</span>
                <small>/ 首月</small>
              </div>
              <ul className="landing-price-list">
                <li>
                  <Check aria-hidden="true" className="h-4 w-4" />
                  每日 30 次 AI 搜索
                </li>
                <li>
                  <Check aria-hidden="true" className="h-4 w-4" />
                  每日 20 次邮箱抓取
                </li>
                <li>
                  <Check aria-hidden="true" className="h-4 w-4" />
                  AI 邮件生成
                </li>
                <li>
                  <Check aria-hidden="true" className="h-4 w-4" />
                  Chrome 插件完整功能
                </li>
              </ul>
              <Link href="/demo" className="landing-price-cta">
                ¥9.9 先试一个月
              </Link>
            </article>
            <article className="landing-price-card is-accent">
              <div className="landing-price-head">
                <div>
                  <p>畅享版</p>
                  <strong>不限次搜索，不限平台。该用的时候随便用。</strong>
                </div>
                <span className="landing-price-badge">最受欢迎</span>
              </div>
              <div className="landing-price-value">
                <span>¥199</span>
                <small>/ 月</small>
              </div>
              <ul className="landing-price-list">
                <li>
                  <Check aria-hidden="true" className="h-4 w-4" />
                  无限 AI 搜索
                </li>
                <li>
                  <Check aria-hidden="true" className="h-4 w-4" />
                  无限邮箱抓取
                </li>
                <li>
                  <Check aria-hidden="true" className="h-4 w-4" />
                  AI 个性化邮件
                </li>
                <li>
                  <Check aria-hidden="true" className="h-4 w-4" />
                  批量导出 CSV
                </li>
              </ul>
              <Link href="/demo" className="landing-price-cta is-accent">
                直接起飞 →
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container max-w-4xl">
          <div className="landing-section-head text-center">
            <p className="mx-auto">常见问题</p>
            <h2>你可能想问的。</h2>
          </div>
          <div className="landing-faq-list">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta-section">
        <div className="landing-container">
          <div className="landing-cta-panel">
            <div className="relative z-10">
              <p className="landing-cta-kicker">最后一件事</p>
              <h2>明天早上你还是会打开TikTok开始翻。</h2>
              <span>或者花9块9，让Linkr替你翻。全功能用一个月，好不好用干一天就知道。</span>
            </div>
            <div className="landing-cta-actions relative z-10">
              <Link href="/demo" className="landing-primary-btn">
                把破活交出去
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link href="/workspace" className="landing-cta-link">
                进入工作台
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <span className="landing-brand-footer">Linkr</span>
          <div className="landing-footer-links">
            <Link href="/demo">插件演示</Link>
            <Link href="/workspace">工作台</Link>
            <span>© 2026 Linkr</span>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .landing-page {
          background:
            radial-gradient(80% 60% at 10% 5%, #ff4f001f, #0000),
            radial-gradient(60% 50% at 90% 10%, #36342e1a, #0000),
            linear-gradient(#fffefb 0%, #fff7f4 44%, #fffefb 100%);
          color: #201515;
          overflow-x: clip;
        }
        .landing-container {
          width: min(1160px, 100% - 32px);
          margin: 0 auto;
        }
        .landing-nav {
          position: sticky;
          top: 0;
          z-index: 40;
          background: #fffefbb8;
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #2015150f;
        }
        .landing-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 74px;
        }
        .landing-brand {
          display: inline-flex;
          gap: 10px;
          align-items: center;
          font-weight: 700;
        }
        .landing-logo {
          position: relative;
          width: 40px;
          height: 40px;
        }
        .landing-nav-cta,
        .landing-primary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #ff4f00, #ff4f00);
          color: #fff;
          border-radius: 14px;
          padding: 12px 18px;
          font-weight: 700;
          box-shadow: 0 14px 30px #ff4f0038;
          transition:
            0.25s transform,
            0.25s box-shadow;
        }
        .landing-nav-cta:hover,
        .landing-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 38px #ff4f0052;
        }
        .landing-secondary-btn,
        .landing-cta-link,
        .landing-price-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #fffefbcc;
          border: 1px solid #2015151f;
          border-radius: 14px;
          padding: 12px 18px;
        }
        .landing-hero {
          padding: 56px 0 92px;
        }
        .landing-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
          align-items: center;
          gap: 52px;
        }
        .landing-eyebrow,
        .landing-section-head p,
        .landing-cta-kicker {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid #20151514;
          background: #fffefbb3;
          font-size: 0.88rem;
          font-weight: 700;
          color: #36342e;
        }
        .landing-title {
          margin: 0;
          line-height: 1.08;
          letter-spacing: -0.05em;
          font-size: clamp(2.6rem, 6vw, 4.8rem);
        }
        .landing-subtitle {
          margin-top: 20px;
          color: #36342e;
          font-size: 1.08rem;
          line-height: 1.85;
          max-width: 650px;
        }
        .landing-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 30px;
        }
        .landing-trust-row {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin-top: 22px;
          color: #36342e;
        }
        .landing-stage {
          position: relative;
          min-height: 620px;
        }
        .landing-screen {
          position: relative;
          background: #fffefbcc;
          backdrop-filter: blur(14px);
          border: 1px solid #20151514;
          border-radius: 30px;
          padding: 18px;
          width: min(100%, 560px);
          margin: 48px auto 0;
          box-shadow: 0 24px 70px #2015151f;
          animation: landing-breathe 6s ease-in-out infinite;
        }
        .landing-screen-frame {
          border: 1px solid #20151514;
          border-radius: 20px;
          overflow: hidden;
          background: #fff;
        }
        .landing-screen-bar {
          display: flex;
          gap: 8px;
          padding: 4px 4px 12px;
        }
        .landing-screen-bar span {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #2015152e;
        }
        .landing-screen-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 14px;
          gap: 14px;
        }
        .landing-screen-foot span {
          color: #36342e;
        }
        .landing-screen-pill,
        .landing-price-badge {
          border-radius: 999px;
          background: #ff4f001f;
          padding: 8px 12px;
          color: #ff4f00;
          font-weight: 700;
        }
        .landing-stage-card {
          position: absolute;
          max-width: 240px;
          background: #fffefbd4;
          backdrop-filter: blur(16px);
          border: 1px solid #20151514;
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 22px 38px #2015151a;
        }
        .landing-stage-card-top {
          top: 10px;
          right: 8px;
          animation: landing-float 6.2s ease-in-out infinite;
        }
        .landing-stage-card-left {
          top: 280px;
          left: 0;
          animation: landing-float 6.8s ease-in-out 0.2s infinite;
        }
        .landing-stage-card-bottom {
          bottom: 18px;
          right: 36px;
          animation: landing-float 7.1s ease-in-out 0.45s infinite;
        }
        .landing-stage-kicker {
          margin: 0 0 8px;
          font-size: 0.78rem;
          color: #939084;
        }
        .landing-stage-card strong {
          display: block;
          line-height: 1.5;
        }
        .landing-stage-card span {
          display: block;
          margin-top: 8px;
          color: #36342e;
          font-size: 0.9rem;
        }
        .landing-section {
          padding: 88px 0;
        }
        .landing-section-contrast {
          background: #fffefb73;
        }
        .landing-section-head {
          max-width: 860px;
          display: grid;
          gap: 12px;
          margin-bottom: 34px;
        }
        .landing-section-head h2,
        .landing-cta-panel h2 {
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1.2;
          letter-spacing: -0.04em;
          margin: 0;
        }
        .landing-section-head span,
        .landing-cta-panel span {
          color: #36342e;
          line-height: 1.9;
        }
        .landing-pain-grid,
        .landing-workflow-grid,
        .landing-fit-grid,
        .landing-pricing-grid {
          display: grid;
          gap: 20px;
        }
        .landing-pain-grid,
        .landing-workflow-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .landing-fit-grid,
        .landing-pricing-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .landing-pain-card,
        .landing-workflow-card,
        .landing-fit-card,
        .landing-price-card,
        .landing-faq-item {
          background: #fffefbb8;
          backdrop-filter: blur(12px);
          border: 1px solid #20151514;
          border-radius: 24px;
          padding: 22px;
          transition:
            0.3s transform,
            0.3s box-shadow;
        }
        .landing-pain-card:hover,
        .landing-workflow-card:hover,
        .landing-fit-card:hover,
        .landing-price-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 48px #2015151a;
        }
        .landing-pain-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: #ff4f001a;
          color: #ff4f00;
          font-weight: 700;
        }
        .landing-compare-table {
          border: 1px solid #20151514;
          border-radius: 28px;
          overflow: hidden;
          background: #fffefbc7;
        }
        .landing-compare-row {
          display: grid;
          grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr) minmax(0, 1fr);
          gap: 16px;
          padding: 16px 20px;
          border-top: 1px solid #20151514;
        }
        .landing-compare-row:first-child {
          border-top: none;
        }
        .landing-compare-head {
          background: #2015150a;
          font-weight: 700;
          color: #36342e;
        }
        .landing-compare-cell {
          border-radius: 16px;
          padding: 12px 14px;
          line-height: 1.7;
        }
        .landing-compare-cell.is-highlight {
          background: #ff4f001a;
          color: #ff4f00;
        }
        .landing-compare-cell.is-highlight-secondary {
          background: #36342e1a;
          color: #36342e;
        }
        .landing-workflow-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, #36342e26, #ff4f0014);
        }
        .landing-price-card.is-accent {
          background: linear-gradient(145deg, #fffefbf5, #ff4f0014);
          border-color: #ff4f0047;
        }
        .landing-price-head {
          display: flex;
          justify-content: space-between;
          gap: 14px;
        }
        .landing-price-value {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-top: 18px;
        }
        .landing-price-value span {
          font-size: clamp(2.5rem, 5vw, 3.6rem);
          font-weight: 700;
          letter-spacing: -0.05em;
        }
        .landing-price-list {
          display: grid;
          gap: 12px;
          margin: 18px 0 0;
          padding: 0;
          list-style: none;
        }
        .landing-price-list li {
          display: inline-flex;
          align-items: flex-start;
          gap: 8px;
        }
        .landing-price-cta {
          width: 100%;
          margin-top: 20px;
        }
        .landing-price-cta.is-accent {
          background: linear-gradient(135deg, #ff4f00, #ff4f00);
          color: #fff;
          border: none;
          box-shadow: 0 10px 28px #ff4f0038;
        }
        .landing-faq-list {
          display: grid;
          gap: 14px;
        }
        .landing-faq-question {
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 22px;
          font-weight: 700;
        }
        .landing-faq-answer {
          margin: 0;
          padding: 0 22px 22px;
          color: #36342e;
          line-height: 1.85;
        }
        .landing-cta-section {
          padding: 0 0 82px;
        }
        .landing-cta-panel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          background: linear-gradient(135deg, #201515f5, #201515f2);
          color: #fff;
          border-radius: 32px;
          padding: 38px;
          position: relative;
          overflow: hidden;
        }
        .landing-cta-panel:before {
          content: "";
          position: absolute;
          inset: -40%;
          background: radial-gradient(circle, #ff4f0038 0, #0000 60%);
          animation: landing-aurora 16s linear infinite;
        }
        .landing-cta-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .landing-footer {
          padding: 0 0 30px;
        }
        .landing-footer-inner {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid #20151514;
          color: #36342e;
        }
        .landing-footer-links {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        @keyframes landing-float {
          0%,
          to {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes landing-breathe {
          0%,
          to {
            transform: scale(1);
          }
          50% {
            transform: scale(1.015);
          }
        }
        @keyframes landing-aurora {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 920px) {
          .landing-hero-grid,
          .landing-pain-grid,
          .landing-workflow-grid,
          .landing-fit-grid,
          .landing-pricing-grid,
          .landing-compare-row,
          .landing-cta-panel {
            grid-template-columns: 1fr;
            display: grid;
          }
          .landing-stage {
            min-height: 0;
            padding-top: 14px;
          }
          .landing-stage-card {
            position: static;
            max-width: none;
            margin-bottom: 14px;
            animation: none;
          }
          .landing-screen {
            margin-top: 24px;
          }
          .landing-container {
            width: min(100% - 24px, 1160px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
