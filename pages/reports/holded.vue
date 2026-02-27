<script setup lang="ts">
definePageMeta({
  layout: false
})

useHead({
  title: 'Holded × Metadata',
  link: [
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display&display=swap' }
  ]
})
</script>

<template>
  <div class="holded-report">
    <!-- Nav -->
    <nav class="nav">
      <a href="#" class="nav-logo">metadata<span>.</span></a>
      <a href="https://metadata.io/book-a-demo/?utm_source=outbound&utm_medium=email&utm_term=other&utm_campaign=demo&utm_content=demo&utm_type=email" target="_blank" rel="noopener" class="nav-cta">Book an Intro</a>
    </nav>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-to">Prepared for Lucas @ Holded</div>
      <h1>We pulled your ads.<br>You look <span class="highlight">just like Pendo</span> did.</h1>
      <p class="hero-sub">
        Holded is the leading cloud ERP for SMEs in Spain, with <strong>80,000+ companies</strong> on the platform, Visma backing, and expansion into Latin America. You have the product, the creative, and the channels. But your ad execution looks exactly like Pendo's did before they switched to Metadata — and generated <strong>~32,000 net new leads</strong> and <strong>$5M+ in influenced pipeline</strong>. Here's the breakdown.
      </p>
    </section>

    <!-- Content -->
    <section class="content">
      <!-- SECTION 1: What we found -->
      <div class="section-label">What we found</div>
      <h2>We pulled 1,028 of Holded's active ads</h2>
      <p class="section-sub">Here's a snapshot of what's running right now across your three channels.</p>

      <div class="ad-grid">
        <div class="ad-card">
          <div class="ad-card-tag">LinkedIn</div>
          <div class="ad-card-status" />
          <div class="ad-card-image">
            <img src="https://media.licdn.com/dms/image/v2/D4E10AQHTVpYva_HUqQ/image-shrink_1280/B4EZyK2KT0IEAg-/0/1771855980222/Holded_Openspace_SocialStatics_1200x628-1png?e=2147483647&v=beta&t=m7Y2VQPK_-XxO6gJyIjZlmS6uZNqF7c2K7y7MGhMOfY" alt="Holded LinkedIn ad">
          </div>
          <div class="ad-card-body">
            <div class="ad-card-title">"Holded, facturación y mucho más" — brand awareness, status update format</div>
            <div class="ad-card-meta">
              <span>774 active ads</span>
              <span class="ad-card-spend">75% of volume</span>
            </div>
          </div>
        </div>
        <div class="ad-card">
          <div class="ad-card-tag">Meta</div>
          <div class="ad-card-status" />
          <div class="ad-card-image">
            <img src="https://scontent-atl3-3.xx.fbcdn.net/v/t39.35426-6/580478393_1239012104717193_5367757983073661323_n.jpg?stp=dst-jpg_s600x600_tt6&_nc_cat=110&ccb=1-7&_nc_sid=c53f8f&_nc_ohc=BHZ4pyrJt5sQ7kNvwG-4aNu&_nc_oc=Admoh--Ur6ly6kcodaOAFtdMUws1Zzz8RCoynSoS7kcIxzCLpgQwPrd1np978eRjEyU&_nc_zt=14&_nc_ht=scontent-atl3-3.xx&_nc_gid=Df1lYHYIYPaf0LBYa3dxnQ&_nc_ss=8&oh=00_AftjqX-HgHMqIxPdnPPDujjNf8T1ZlOGDRKYEz5_LwxXYA&oe=69A7F9AC" alt="Holded Meta ad">
          </div>
          <div class="ad-card-body">
            <div class="ad-card-title">"Comienza tu Prueba Gratuita de 14 Días" — carousel, free trial push</div>
            <div class="ad-card-meta">
              <span>214 active ads</span>
              <span class="ad-card-spend">Carousel-heavy</span>
            </div>
          </div>
        </div>
        <div class="ad-card">
          <div class="ad-card-tag">Google</div>
          <div class="ad-card-status" />
          <div class="ad-card-image">
            <img src="https://tpc.googlesyndication.com/archive/simgad/16375680354838757856" alt="Holded Google ad">
          </div>
          <div class="ad-card-body">
            <div class="ad-card-title">Display ad — running since Dec 2025, still active today</div>
            <div class="ad-card-meta">
              <span>40 active ads</span>
              <span class="ad-card-spend">30 new in last 30d</span>
            </div>
          </div>
        </div>
      </div>

      <div class="alert-box">
        <div class="alert-icon">!</div>
        <div>
          <p><strong>The pattern we see:</strong> 774 LinkedIn ads with heavy repetition of the same messaging. Google creatives running untouched since 2021. Meta carousels pushing free trials without audience optimization. For a company scaling across Spain and LatAm with 80K+ customers and 174 employees, the creative is solid — the <strong>execution layer is where the money leaks.</strong></p>
        </div>
      </div>

      <!-- SECTION 2: The mirror -->
      <hr class="divider">
      <div class="section-label">Why this matters</div>
      <h2>Pendo looked exactly like this</h2>
      <p class="section-sub">Same profile. Same constraints. Same opportunity hiding in the execution layer.</p>

      <div class="mirror-grid">
        <div class="mirror-card you">
          <div class="mirror-card-label">Holded — today</div>
          <div class="mirror-row"><span class="mirror-key">Active ads</span><span class="mirror-val">1,028</span></div>
          <div class="mirror-row"><span class="mirror-key">Channels</span><span class="mirror-val">LinkedIn, Meta, Google</span></div>
          <div class="mirror-row"><span class="mirror-key">Team</span><span class="mirror-val">~174 employees, lean digital</span></div>
          <div class="mirror-row"><span class="mirror-key">Market</span><span class="mirror-val">Spain + LatAm expansion</span></div>
          <div class="mirror-row"><span class="mirror-key">Ad freshness</span><span class="mirror-val">Some since 2021</span></div>
          <div class="mirror-row"><span class="mirror-key">Optimization</span><span class="mirror-val">Manual / stale bids</span></div>
        </div>
        <div class="mirror-card">
          <div class="mirror-card-label">Pendo — before Metadata</div>
          <div class="mirror-row"><span class="mirror-key">Active ads</span><span class="mirror-val">500+</span></div>
          <div class="mirror-row"><span class="mirror-key">Channels</span><span class="mirror-val">LinkedIn, Facebook</span></div>
          <div class="mirror-row"><span class="mirror-key">Team</span><span class="mirror-val">2-person digital</span></div>
          <div class="mirror-row"><span class="mirror-key">Ad freshness</span><span class="mirror-val">Stale, unoptimized</span></div>
          <div class="mirror-row"><span class="mirror-key">Optimization</span><span class="mirror-val">Manual, couldn't scale</span></div>
        </div>
      </div>

      <!-- SECTION 3: What happened -->
      <hr class="divider">
      <div class="section-label">What happened next</div>
      <h2>Then Pendo switched to Metadata</h2>
      <p class="body-text">
        Pendo's two-person digital team couldn't run experiments at scale using native ad platforms. With Metadata, they improved audience targeting across Facebook and LinkedIn, reaching higher-quality prospects with consistent messaging on both channels.
      </p>
      <p class="body-text">
        Their <strong>"Pendo for Startups"</strong> campaign was the breakout: marketing into smaller companies at a discounted rate and increasing sales velocity. They increased Facebook spend by <strong>3×</strong> — knowing Metadata's targeting would deliver the same quality leads at a fraction of the cost.
      </p>

      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-number">80%</div>
          <div class="stat-label">Lower cost-per-MQL<br>on Facebook</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">$5M+</div>
          <div class="stat-label">Influenced pipeline<br>generated</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">32K</div>
          <div class="stat-label">Net new leads<br>via Metadata</div>
        </div>
      </div>

      <div class="quote-block">
        <div class="quote-text">"We have a really lean digital marketing team, so we rely on Metadata to help us run experiments at scale and optimize our paid social media spend. That just wasn't possible using the native platforms."</div>
        <div class="quote-author">
          <div class="quote-avatar">WC</div>
          <div>
            <div class="quote-name">Will Cozart</div>
            <div class="quote-role">Senior Digital Manager, Pendo</div>
          </div>
        </div>
      </div>

      <!-- SECTION 4: What Metadata would do for Holded -->
      <hr class="divider">
      <div class="section-label">What this means for Holded</div>
      <h2>Here's how Metadata would change the game</h2>
      <p class="section-sub">Holded has 80,000+ companies on the platform, $31.9M in funding, Visma backing, and active expansion across Spain and Latin America. The creative is there. The channels are there. What's missing is the execution layer that turns all of that into predictable pipeline.</p>

      <div class="capability-grid">
        <div class="capability-card">
          <div class="capability-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <h3>Autonomous campaign execution</h3>
          <p>Instead of manually building and optimizing 1,028 ads across LinkedIn, Meta, and Google, Metadata's AI runs thousands of campaign experiments simultaneously. As Holded scales into new LatAm markets, this means launching localized campaigns in minutes — not weeks of manual setup per region.</p>
        </div>
        <div class="capability-card">
          <div class="capability-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          </div>
          <h3>Audience targeting with intent + enrichment</h3>
          <p>Holded sells to SMEs — a massive, noisy audience to target on consumer platforms like Meta. Metadata layers firmographic, technographic, and intent data (Bombora, G2) with your CRM data to build hyper-targeted SME audiences — then automatically matches them across ad channels. No more broad "free trial" carousels hoping the right person sees them.</p>
        </div>
        <div class="capability-card">
          <div class="capability-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h3>Optimize for revenue, not vanity metrics</h3>
          <p>Holded already integrates with 700+ apps and has CRM built in. Metadata connects directly to your CRM and optimizes toward pipeline and revenue — not clicks or impressions. Budget auto-allocates to experiments generating actual signups and paying customers, not vanity metrics.</p>
        </div>
        <div class="capability-card">
          <div class="capability-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <h3>The experimentation engine</h3>
          <p>This is the real moat. Metadata runs multivariate experiments at scale — testing combinations of audiences, creatives, offers, and channels simultaneously across Spain, Mexico, Colombia, Chile, and Argentina. Hundreds of variations in days. Underperformers are killed fast. Winners get doubled down on. Your team tests 5–10 a month; Metadata tests hundreds.</p>
        </div>
      </div>

      <div class="proof-stats">
        <div class="proof-stat">
          <div class="proof-number">20–30%</div>
          <div class="proof-label">Reduction in cost per lead</div>
        </div>
        <div class="proof-stat">
          <div class="proof-number">Minutes</div>
          <div class="proof-label">To launch campaigns vs. days of manual setup</div>
        </div>
        <div class="proof-stat">
          <div class="proof-number">3–5</div>
          <div class="proof-label">Media buyers replaced by automation</div>
        </div>
      </div>

      <div class="trust-bar">
        Trusted by <strong>Zoom</strong>, <strong>Okta</strong>, <strong>ThoughtSpot</strong>, and hundreds of B2B teams turning paid advertising from a cost center into a predictable pipeline engine.
      </div>

      <!-- SECTION 5: The ask -->
      <div id="cta" class="cta-section">
        <h2>We built the full report for Holded.</h2>
        <p>Every ad. Every channel. Where the budget is leaking and exactly where Metadata would move the needle. 15 minutes — we'll walk you through it.</p>
        <a href="https://metadata.io/book-a-demo/?utm_source=outbound&utm_medium=email&utm_term=other&utm_campaign=demo&utm_content=demo&utm_type=email" target="_blank" rel="noopener" class="cta-button">Book 15 Min With Us →</a>
      </div>
    </section>

    <div class="footer">
      © 2026 Metadata &nbsp;·&nbsp; Prompts → Pipeline
    </div>
  </div>
</template>

<style scoped>
.holded-report {
  --bg: #FFFFFF;
  --text: #1a1a1a;
  --text-secondary: #555;
  --text-muted: #888;
  --accent: #E8503A;
  --accent-light: #FFF0EE;
  --border: #E5E5E5;
  --card-bg: #FAFAFA;
  --alert-bg: #FFF8F6;
  --alert-border: #E8503A;

  font-family: 'DM Sans', sans-serif;
  color: var(--text);
  background: var(--bg);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

/* ── Nav ── */
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 48px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: white;
  z-index: 100;
}
.nav-logo {
  font-family: 'DM Serif Display', serif;
  font-size: 22px;
  color: var(--text);
  text-decoration: none;
  letter-spacing: -0.01em;
}
.nav-logo span { color: var(--accent); }
.nav-cta {
  background: var(--accent);
  color: white;
  padding: 10px 22px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  transition: opacity 0.2s;
}
.nav-cta:hover { opacity: 0.9; }

/* ── Hero ── */
.hero {
  max-width: 740px;
  margin: 0 auto;
  padding: 72px 24px 20px;
}
.hero-to {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-light);
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 20px;
  margin-bottom: 28px;
  letter-spacing: 0.02em;
}

h1 {
  font-family: 'DM Serif Display', serif;
  font-size: 44px;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
  color: var(--text);
}
h1 .highlight {
  background: linear-gradient(180deg, transparent 55%, #FFDDD8 55%);
  padding: 0 4px;
}

.hero-sub {
  font-size: 17px;
  color: var(--text-secondary);
  line-height: 1.75;
  max-width: 640px;
}
.hero-sub :deep(strong) { color: var(--text); font-weight: 600; }

/* ── Content ── */
.content {
  max-width: 740px;
  margin: 0 auto;
  padding: 0 24px 64px;
}

h2 {
  font-family: 'DM Serif Display', serif;
  font-size: 28px;
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  margin-bottom: 8px;
  margin-top: 56px;
}

.section-sub {
  font-size: 15.5px;
  color: var(--text-secondary);
  margin-bottom: 28px;
  line-height: 1.7;
}

/* ── Alert Box ── */
.alert-box {
  border: 1.5px solid var(--alert-border);
  border-radius: 10px;
  padding: 24px 28px;
  margin: 40px 0;
  background: var(--alert-bg);
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.alert-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: 2px solid var(--accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  font-weight: 700;
  font-size: 15px;
  margin-top: 1px;
}
.alert-box p {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.7;
}
.alert-box :deep(strong) { color: var(--text); }

/* ── Ad Cards ── */
.ad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 36px;
}
.ad-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  background: white;
  position: relative;
  transition: box-shadow 0.2s;
}
.ad-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
.ad-card-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 3px 8px;
  border-radius: 4px;
  background: white;
  border: 1px solid var(--border);
  color: var(--text);
}
.ad-card-status {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 10px;
  height: 10px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(232, 80, 58, 0.15);
}
.ad-card-image {
  width: 100%;
  height: 180px;
  background: var(--card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.ad-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ad-card-body { padding: 16px; }
.ad-card-title {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text);
  line-height: 1.45;
  margin-bottom: 8px;
}
.ad-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-muted);
}
.ad-card-spend { font-weight: 600; color: var(--text); }

/* ── Body Text ── */
.body-text {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.75;
  margin-bottom: 24px;
}
.body-text :deep(strong) { color: var(--text); }

/* ── Divider ── */
.divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 56px 0 0;
}

/* ── Stats Row ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin: 36px 0 40px;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.stat-item {
  padding: 32px 24px;
  text-align: center;
  border-right: 1px solid var(--border);
}
.stat-item:last-child { border-right: none; }
.stat-number {
  font-family: 'DM Serif Display', serif;
  font-size: 40px;
  color: var(--accent);
  margin-bottom: 6px;
}
.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ── Quote ── */
.quote-block {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 36px 32px;
  margin: 36px 0 0;
  border-left: 4px solid var(--accent);
}
.quote-text {
  font-family: 'DM Serif Display', serif;
  font-size: 21px;
  line-height: 1.5;
  color: var(--text);
  margin-bottom: 18px;
}
.quote-author { display: flex; align-items: center; gap: 12px; }
.quote-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--accent-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  font-weight: 700;
  font-size: 14px;
}
.quote-name { font-weight: 600; font-size: 14px; color: var(--text); }
.quote-role { font-size: 13px; color: var(--text-muted); }

/* ── Side-by-side ── */
.mirror-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 32px 0 40px;
}
.mirror-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 28px 24px;
}
.mirror-card.you { border-color: var(--accent); background: var(--alert-bg); }
.mirror-card-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 14px;
}
.mirror-card.you .mirror-card-label { color: var(--accent); }
.mirror-row {
  display: flex;
  justify-content: space-between;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}
.mirror-row:last-child { border-bottom: none; }
.mirror-key { color: var(--text-muted); }
.mirror-val { font-weight: 600; color: var(--text); text-align: right; }
.mirror-card.you .mirror-row { border-color: rgba(232,80,58,0.15); }

/* ── CTA ── */
.cta-section {
  background: var(--text);
  border-radius: 14px;
  padding: 56px 48px;
  text-align: center;
  margin: 56px 0 0;
}
.cta-section h2 { color: white; margin-bottom: 10px; font-size: 30px; }
.cta-section p {
  color: rgba(255,255,255,0.6);
  font-size: 16px;
  margin-bottom: 28px;
  max-width: 460px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.65;
}
.cta-button {
  display: inline-block;
  background: var(--accent);
  color: white;
  padding: 14px 36px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  transition: opacity 0.2s;
}
.cta-button:hover { opacity: 0.9; }

.footer {
  text-align: center;
  padding: 36px 24px;
  font-size: 13px;
  color: var(--text-muted);
}

/* ── Capability Cards ── */
.capability-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 32px 0 40px;
}
.capability-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 28px 24px;
  background: white;
}
.capability-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--accent-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  margin-bottom: 16px;
}
.capability-card h3 {
  font-family: 'DM Sans', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 10px;
}
.capability-card p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* ── Proof Stats ── */
.proof-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin: 0 0 32px;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--card-bg);
}
.proof-stat {
  padding: 28px 20px;
  text-align: center;
  border-right: 1px solid var(--border);
}
.proof-stat:last-child { border-right: none; }
.proof-number {
  font-family: 'DM Serif Display', serif;
  font-size: 32px;
  color: var(--accent);
  margin-bottom: 4px;
}
.proof-label {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ── Trust Bar ── */
.trust-bar {
  text-align: center;
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.7;
  padding: 24px;
  background: var(--card-bg);
  border-radius: 10px;
  margin-bottom: 0;
}
.trust-bar :deep(strong) { color: var(--text); }

@media (max-width: 700px) {
  h1 { font-size: 30px; }
  .hero { padding: 48px 20px 16px; }
  .ad-grid { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: 1fr; }
  .stat-item { border-right: none; border-bottom: 1px solid var(--border); }
  .stat-item:last-child { border-bottom: none; }
  .mirror-grid { grid-template-columns: 1fr; }
  .nav { padding: 14px 20px; }
  .content { padding: 0 20px 48px; }
  .cta-section { padding: 40px 24px; }
  .capability-grid { grid-template-columns: 1fr; }
  .proof-stats { grid-template-columns: 1fr; }
  .proof-stat { border-right: none; border-bottom: 1px solid var(--border); }
  .proof-stat:last-child { border-bottom: none; }
}
</style>
