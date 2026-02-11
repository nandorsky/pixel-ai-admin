<script setup lang="ts">
definePageMeta({
  layout: 'blank'
})
</script>

<template>
  <div class="lead-magnet-page">
    <div class="doc-header wrap">
      <div class="doc-brand">
        <img src="https://www.notion.so/images/favicon.ico" alt="Notion" class="notion-logo" />
        <div class="doc-brand-text">
          <p class="prepared-for">Prepared exclusively for</p>
          <span>Notion</span>
          <p>Ad Spend Analysis &amp; Benchmark Report</p>
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-tag">Confidential</div>
        <div class="doc-date">February 2026</div>
        <div class="doc-author">
          <img src="https://media.licdn.com/dms/image/v2/D5603AQH25XzWuiY-PQ/profile-displayphoto-scale_400_400/B56ZuUfFTzJAAk-/0/1767722740246?e=1772064000&v=beta&t=81XApyOBkXhEi95WIhnkLZucYDPGyd1D87lrJk8Kzsc" alt="Shane Jamison" />
          <span>Prepared by Shane Jamison</span>
        </div>
      </div>
    </div>

    <main class="content wrap">
      <!-- HERO -->
      <h1>Zoom was spending like <span class="hl">Notion</span>.<br>Then they cut CPC by 77%.</h1>

      <p>This isn't just a Zoom case study. We pulled <strong>Notion's</strong> active ads, estimated the spend, and benchmarked it against what Zoom was doing before they made the switch. The overlap is hard to ignore.</p>

      <div class="callout alert">
        <div class="ci">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EB5757" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div class="cb">
          <strong>Notion right now:</strong> 63 active ads across LinkedIn, Meta, and Google. Estimated spend ~$92k/mo. Estimated CPL ~$287. Roughly <strong>$34k/mo going to underperforming creatives</strong> — that's the fully loaded cost of a senior demand gen hire, every month, going to ads that haven't been optimized since November.
        </div>
      </div>

      <!-- NOTION ADS -->
      <h2>The ads we found on Notion's accounts</h2>

      <p>We pulled a sample of Notion's active campaigns. These are running right now:</p>

      <div class="ad-strip">
        <div class="ad-mini">
          <div class="ad-img-placeholder">
            <div class="ad-ch-tag">LinkedIn</div>
            <div class="ad-flag"></div>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </div>
          <div class="ad-body">
            <h4>Notion AI — one connected tool for notes, docs, and projects</h4>
            <div class="ad-row"><span>Since Jan 12</span><span class="spend">~$8.4k</span></div>
          </div>
        </div>
        <div class="ad-mini">
          <div class="ad-img-placeholder">
            <div class="ad-ch-tag">Meta</div>
            <div class="ad-flag"></div>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </div>
          <div class="ad-body">
            <h4>See why 100,000+ teams run on Notion</h4>
            <div class="ad-row"><span>Since Dec 3</span><span class="spend">~$12.1k</span></div>
          </div>
        </div>
        <div class="ad-mini">
          <div class="ad-img-placeholder">
            <div class="ad-ch-tag">Google</div>
            <div class="ad-flag"></div>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </div>
          <div class="ad-body">
            <h4>The connected workspace for modern teams</h4>
            <div class="ad-row"><span>Since Nov 28</span><span class="spend">~$6.8k</span></div>
          </div>
        </div>
      </div>

      <p>These aren't bad ads. But they've been running without bid optimization for weeks — some since November. <strong>Zoom had the same pattern</strong>: solid creative, but the execution layer was bleeding money through stale bids and unoptimized audiences.</p>

      <!-- PROFILE MATCH -->
      <div class="match-card">
        <div class="match-header">Company Profile Comparison</div>
        <div class="match-grid">
          <div class="mg-label">Category</div>
          <div class="mg-val"><img src="https://www.google.com/s2/favicons?domain=notion.so&sz=64" alt="Notion"> Horizontal SaaS</div>
          <div class="mg-val"><img src="https://www.google.com/s2/favicons?domain=zoom.us&sz=64" alt="Zoom"> Horizontal SaaS</div>

          <div class="mg-label">Target Audience</div>
          <div class="mg-val"><img src="https://www.google.com/s2/favicons?domain=notion.so&sz=64" alt="Notion"> Broad B2B</div>
          <div class="mg-val"><img src="https://www.google.com/s2/favicons?domain=zoom.us&sz=64" alt="Zoom"> Broad B2B</div>

          <div class="mg-label">Primary Channel</div>
          <div class="mg-val"><img src="https://www.google.com/s2/favicons?domain=notion.so&sz=64" alt="Notion"> LinkedIn + Meta + Google</div>
          <div class="mg-val"><img src="https://www.google.com/s2/favicons?domain=zoom.us&sz=64" alt="Zoom"> LinkedIn + Meta + Google</div>

          <div class="mg-label">Est. Monthly Spend</div>
          <div class="mg-val"><img src="https://www.google.com/s2/favicons?domain=notion.so&sz=64" alt="Notion"> ~$92k</div>
          <div class="mg-val"><img src="https://www.google.com/s2/favicons?domain=zoom.us&sz=64" alt="Zoom"> ~$90k</div>

          <div class="mg-label">Core Challenge</div>
          <div class="mg-val"><img src="https://www.google.com/s2/favicons?domain=notion.so&sz=64" alt="Notion"> Awareness → Pipeline</div>
          <div class="mg-val"><img src="https://www.google.com/s2/favicons?domain=zoom.us&sz=64" alt="Zoom"> Awareness → Pipeline</div>

          <div class="mg-label">Paid Social Team</div>
          <div class="mg-val"><img src="https://www.google.com/s2/favicons?domain=notion.so&sz=64" alt="Notion"> Small, lean</div>
          <div class="mg-val"><img src="https://www.google.com/s2/favicons?domain=zoom.us&sz=64" alt="Zoom"> Small, lean</div>
        </div>
        <div class="match-footer">Near-identical profile. The only difference: Zoom already made the switch.</div>
      </div>

      <!-- ZOOM STORY -->
      <h2>Here's what happened at Zoom</h2>

      <p>Zoom's digital marketing lead, Charisse Sare, was in a familiar spot: scaling global campaigns with a smaller team and tighter budgets. LinkedIn alone meant managing bids across <strong>1,500+ cities</strong>. Manually building those campaigns took <strong>3.5 weeks</strong>. By the time one round was optimized, the next was already stale.</p>

      <p><strong>Notion is running 63 ads across 3 channels right now.</strong> That's the same kind of optimization burden — different creatives, different bids, different audiences, all needing constant attention that no lean team can give manually.</p>

      <p>Charisse didn't change the creative. Didn't rewrite messaging. Didn't hire. She switched to AI-driven bid optimization — and let it run.</p>

      <div class="results-strip">
        <div class="r-stat">
          <div class="val">-77%</div>
          <div class="desc">Cost per<br>click</div>
        </div>
        <div class="r-stat">
          <div class="val">3x</div>
          <div class="desc">Return on<br>ad spend</div>
        </div>
        <div class="r-stat">
          <div class="val">177%</div>
          <div class="desc">Influenced<br>revenue</div>
        </div>
        <div class="r-stat">
          <div class="val">-24%</div>
          <div class="desc">Total ad<br>spend</div>
        </div>
      </div>

      <p>The AI made <strong>125 bid adjustments per day</strong> across every campaign, 24/7. Not tweaking — rewriting the operating model. ROI went from 3.26x to 9x.</p>

      <div class="quote-block">
        <blockquote>"It's the most set-it-and-forget-it thing out there. Except the agent doesn't forget."</blockquote>
        <div class="attr"><strong>Charisse Sare</strong> · Manager of Digital, Zoom</div>
      </div>

      <h2>Zoom's A/B test results — before vs. after Bid Agent</h2>

      <p>Charisse and her team ran a clean A/B test to isolate the impact. Same creative, same audiences, same budget. The only variable was manual bidding vs. AI bidding.</p>

      <div class="ab-grid">
        <div class="ab-card">
          <div class="ab-val">+87%</div>
          <div class="ab-label">Impressions</div>
        </div>
        <div class="ab-card">
          <div class="ab-val">-32%</div>
          <div class="ab-label">CPM</div>
        </div>
        <div class="ab-card">
          <div class="ab-val">-38%</div>
          <div class="ab-label">CPC</div>
        </div>
        <div class="ab-card">
          <div class="ab-val">+111%</div>
          <div class="ab-label">Sales Accepted Leads</div>
        </div>
        <div class="ab-card">
          <div class="ab-val">+252%</div>
          <div class="ab-label">Influenced Opportunities</div>
        </div>
        <div class="ab-card">
          <div class="ab-val">3–10 hrs</div>
          <div class="ab-label">Saved per Week</div>
        </div>
      </div>

      <div class="callout note">
        <div class="ci">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#787774" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div class="cb">
          <strong>No creative changes. No new messaging. No additional headcount.</strong> The only variable was how bids were managed. Everything else stayed the same. That's what makes this directly applicable to Notion — it's not a strategy overhaul, it's an execution upgrade.
        </div>
      </div>

      <!-- SIDE BY SIDE -->
      <h2>Notion today vs. Zoom before &amp; after</h2>

      <table class="clean">
        <thead>
          <tr>
            <th></th>
            <th class="col-red">
              <img src="https://www.google.com/s2/favicons?domain=notion.so&sz=32" alt="" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;border-radius:2px;">
              Notion Today
            </th>
            <th>
              <img src="https://www.google.com/s2/favicons?domain=zoom.us&sz=32" alt="" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;border-radius:2px;">
              Zoom Before
            </th>
            <th class="col-green">
              <img src="https://www.google.com/s2/favicons?domain=zoom.us&sz=32" alt="" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;border-radius:2px;">
              Zoom After
            </th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Cost per Click</td><td class="red">~$11</td><td class="gray">~$11</td><td class="green">$2.50</td></tr>
          <tr><td>Campaign Setup</td><td class="red">Manual, multi-week</td><td class="gray">3.5 weeks</td><td class="green">10 minutes</td></tr>
          <tr><td>Bid Adjustments / Day</td><td class="red">Manual, periodic</td><td class="gray">Manual, periodic</td><td class="green">125+ auto</td></tr>
          <tr><td>Weekly Optimization</td><td class="red">10+ hours</td><td class="gray">10+ hours</td><td class="green">~1 hour</td></tr>
          <tr><td>Sales Accepted Leads</td><td class="red">—</td><td class="gray">Baseline</td><td class="green">+111%</td></tr>
          <tr><td>Influenced Opps</td><td class="red">—</td><td class="gray">Baseline</td><td class="green">+252%</td></tr>
          <tr><td>ROI</td><td class="red">—</td><td class="gray">3.26x</td><td class="green">9x</td></tr>
        </tbody>
      </table>

      <div class="callout note">
        <div class="ci">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#787774" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        </div>
        <div class="cb">
          The Notion and Zoom "before" columns are nearly identical — same CPC range, same manual processes, same time drain. The only difference is Zoom already made the switch.
        </div>
      </div>

      <!-- PROJECTION -->
      <h2>If Notion ran the Zoom playbook</h2>

      <p class="muted">Projections based on Zoom's verified A/B test results applied to Notion's estimated spend. Not guarantees — starting points for a conversation.</p>

      <table class="clean">
        <thead>
          <tr>
            <th></th>
            <th class="col-red">Notion Today</th>
            <th class="col-orange">Projected</th>
            <th class="col-italic">Source</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Cost per Click</td><td class="red">~$11</td><td class="green green-bg">~$2.50</td><td class="italic">Zoom: 77% CPC reduction</td></tr>
          <tr><td>Cost per Lead</td><td class="red">~$287</td><td class="green green-bg">~$89</td><td class="italic">Metadata customer avg</td></tr>
          <tr><td>Wasted Spend / Mo</td><td class="red">~$34k</td><td class="green green-bg">~$4k</td><td class="italic">AI kills stale ads in 24 hrs</td></tr>
          <tr><td>Manual Hours / Mo</td><td class="red">60+ hrs</td><td class="green green-bg">~5 hrs</td><td class="italic">Zoom: 3-10 hrs saved/week</td></tr>
          <tr><td>Influenced Opps</td><td class="red">Baseline</td><td class="green green-bg">+252%</td><td class="italic">Zoom A/B test result</td></tr>
        </tbody>
      </table>

      <p>Same creative. Same channels. Same team. Same budget. The only variable is how the execution runs.</p>

      <!-- CTA -->
      <div class="cta-box">
        <h2>Zoom already made this switch.<br>See Notion's full optimization plan.</h2>
        <p>15 minutes. We'll walk through your 63 campaigns, flag the ones bleeding budget, and map the Zoom playbook to your spend.</p>
        <a href="#" class="btn">
          Book a Strategy Call
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <p class="fine">No commitment · Custom analysis included</p>
      </div>
    </main>

    <!-- Sticky CTA -->
    <div class="sticky-cta">
      <a href="#" class="btn">
        Book a Strategy Call
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
    </div>

    <footer class="wrap">
      <div class="powered">
        <span>Analysis powered by</span>
        <div class="md-icon"><span></span><span></span><span></span><span></span></div>
        <a href="https://metadata.io" target="_blank">metadata.io</a>
      </div>
      <a href="https://metadata.io/privacy-policy" target="_blank">Privacy</a>
    </footer>
  </div>
</template>

<style scoped>
.lead-magnet-page {
  --notion-black: #191919;
  --notion-text: #37352F;
  --notion-gray: #787774;
  --notion-light: #E3E2DE;
  --notion-lightest: #F7F6F3;
  --notion-white: #FFFFFF;
  --notion-beige: #FBFAF8;
  --md-orange: #FF7A00;
  --md-green: #2E7D32;
  --md-green-bg: #F1F8E9;
  --md-red: #EB5757;
  --md-red-bg: #FFF5F5;

  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--notion-beige);
  color: var(--notion-text);
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

.wrap { max-width: 820px; margin: 0 auto; }

/* HEADER */
.doc-header {
  padding: 2rem 2.5rem;
  display: flex; justify-content: space-between; align-items: flex-start;
  border-bottom: 1px solid var(--notion-light);
}
.doc-brand { display: flex; align-items: center; gap: 1rem; }
.notion-logo {
  width: 56px; height: 56px; border-radius: 10px;
}
.doc-brand-text .prepared-for {
  font-size: 0.6875rem; color: var(--notion-gray);
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-bottom: 0.125rem;
}
.doc-brand-text span { font-size: 1.75rem; font-weight: 800; color: var(--notion-black); letter-spacing: -0.02em; }
.doc-brand-text p { font-size: 0.8125rem; color: var(--notion-gray); margin-top: 0.25rem; }
.doc-meta { text-align: right; }
.doc-author {
  display: flex; align-items: center; gap: 0.625rem;
  margin-top: 0.625rem; justify-content: flex-end;
}
.doc-author img {
  width: 32px; height: 32px; border-radius: 50%; object-fit: cover;
}
.doc-author span {
  font-size: 0.8125rem; color: var(--notion-text); font-weight: 500;
}
.doc-tag {
  display: inline-block; font-size: 0.5625rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  padding: 0.2rem 0.5rem; border-radius: 4px;
  background: var(--notion-black); color: white; margin-bottom: 0.375rem;
}
.doc-date { font-size: 0.6875rem; color: var(--notion-gray); line-height: 1.5; }

/* CONTENT */
.content { padding: 3rem 2.5rem 2rem; }

.content h1 {
  font-size: clamp(1.75rem, 4vw, 2.375rem); font-weight: 800;
  line-height: 1.18; letter-spacing: -0.03em;
  color: var(--notion-black); margin-bottom: 1.5rem;
}
.content h1 .hl {
  background: linear-gradient(180deg, transparent 60%, rgba(255,122,0,0.15) 60%);
  padding: 0 0.125rem;
}

.content h2 {
  font-size: 1.1875rem; font-weight: 700; letter-spacing: -0.01em;
  color: var(--notion-black); margin-top: 2.75rem; margin-bottom: 0.875rem;
}

.content p {
  font-size: 0.9675rem; line-height: 1.75; color: var(--notion-text);
  margin-bottom: 1.25rem;
}
.content p.muted { color: var(--notion-gray); font-size: 0.9375rem; }
.content p strong { font-weight: 600; }

/* CALLOUTS */
.callout {
  display: flex; gap: 1rem; align-items: flex-start;
  padding: 1.125rem 1.25rem; border-radius: 8px; margin: 1.5rem 0;
  font-size: 0.9375rem; line-height: 1.65;
}
.callout.alert { background: var(--md-red-bg); border: 1px solid rgba(235,87,87,0.2); }
.callout.note { background: var(--notion-lightest); border: 1px solid var(--notion-light); }
.callout .ci { flex-shrink: 0; width: 24px; height: 24px; margin-top: 0.125rem; }
.callout .cb { flex: 1; }
.callout .cb strong { font-weight: 700; }

/* PROFILE MATCH */
.match-card {
  background: var(--notion-white); border: 1px solid var(--notion-light);
  border-radius: 10px; overflow: hidden; margin: 2rem 0;
}
.match-header {
  padding: 1rem 1.5rem; background: var(--notion-lightest);
  border-bottom: 1px solid var(--notion-light);
  font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--notion-gray);
}
.match-grid {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
}
.match-grid .mg-label {
  padding: 0.75rem 1.5rem; font-size: 0.8125rem; font-weight: 500;
  color: var(--notion-gray); border-bottom: 1px solid var(--notion-lightest);
  display: flex; align-items: center;
}
.match-grid .mg-val {
  padding: 0.75rem 1.5rem; font-size: 0.8125rem; font-weight: 600;
  color: var(--notion-text); border-bottom: 1px solid var(--notion-lightest);
  display: flex; align-items: center; gap: 0.625rem;
}
.match-grid .mg-val img {
  width: 20px; height: 20px; border-radius: 4px;
}
.match-grid > div:nth-child(3n+2) { border-right: 1px solid var(--notion-lightest); }
.match-grid > div:nth-last-child(-n+3) { border-bottom: none; }

.match-footer {
  padding: 0.75rem 1.5rem; background: rgba(255,122,0,0.04);
  border-top: 1px solid var(--notion-light);
  font-size: 0.8125rem; color: var(--md-orange); font-weight: 600;
  text-align: center;
}

/* RESULTS STRIP */
.results-strip {
  display: grid; grid-template-columns: repeat(4, 1fr);
  background: var(--notion-black); border-radius: 10px;
  overflow: hidden; margin: 2rem 0;
}
.r-stat {
  padding: 1.5rem 1.25rem; text-align: center;
  border-right: 1px solid rgba(255,255,255,0.08);
}
.r-stat:last-child { border-right: none; }
.r-stat .val {
  font-size: 1.875rem; font-weight: 800; color: var(--md-orange);
  letter-spacing: -0.02em; margin-bottom: 0.25rem;
}
.r-stat .desc {
  font-size: 0.625rem; color: rgba(255,255,255,0.45);
  text-transform: uppercase; letter-spacing: 0.04em; line-height: 1.4;
}

/* QUOTE */
.quote-block {
  border-left: 3px solid var(--md-orange);
  padding: 1.125rem 0 1.125rem 1.5rem;
  margin: 1.75rem 0;
}
.quote-block blockquote {
  font-size: 1.0625rem; line-height: 1.65; color: var(--notion-text);
  font-style: italic; margin-bottom: 0.625rem;
}
.quote-block .attr { font-size: 0.8125rem; color: var(--notion-gray); }
.quote-block .attr strong { color: var(--notion-text); font-weight: 600; }

/* TABLES */
table.clean {
  width: 100%; border-collapse: collapse;
  background: var(--notion-white); border: 1px solid var(--notion-light);
  border-radius: 8px; overflow: hidden; margin: 1.75rem 0;
}
table.clean thead th {
  padding: 0.75rem 1.25rem; text-align: left;
  font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--notion-gray);
  background: var(--notion-lightest); border-bottom: 1px solid var(--notion-light);
}
table.clean thead th:not(:first-child) { text-align: center; }
table.clean thead th.col-green { color: var(--md-green); }
table.clean thead th.col-red { color: var(--md-red); }
table.clean thead th.col-orange { color: var(--md-orange); }
table.clean thead th.col-italic { font-style: italic; }

table.clean tbody td {
  padding: 0.8125rem 1.25rem; font-size: 0.9375rem;
  border-bottom: 1px solid var(--notion-lightest);
}
table.clean tbody tr:last-child td { border-bottom: none; }
table.clean tbody td:first-child { color: var(--notion-gray); font-weight: 500; font-size: 0.875rem; }
table.clean tbody td:not(:first-child) { text-align: center; font-weight: 600; }

.green { color: var(--md-green); }
.red { color: var(--md-red); }
.gray { color: var(--notion-gray); font-weight: 400 !important; }
.green-bg { background: var(--md-green-bg); }
.italic { font-style: italic; font-size: 0.8125rem !important; color: var(--notion-gray) !important; font-weight: 400 !important; }

/* AD TILES */
.ad-strip {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem; margin: 1.75rem 0;
}
.ad-mini {
  background: var(--notion-white); border: 1px solid var(--notion-light);
  border-radius: 8px; overflow: hidden; position: relative;
}
.ad-mini .ad-img-placeholder {
  height: 140px; background: var(--notion-lightest);
  display: flex; align-items: center; justify-content: center;
  border-bottom: 1px solid var(--notion-light);
  color: var(--notion-light); position: relative;
}
.ad-mini .ad-img-placeholder svg { opacity: 0.3; }
.ad-mini .ad-img-placeholder .ad-ch-tag {
  position: absolute; top: 0.5rem; left: 0.5rem;
  font-size: 0.5625rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; padding: 0.2rem 0.45rem; border-radius: 3px;
  background: var(--notion-white); color: var(--notion-gray);
  border: 1px solid var(--notion-light);
}
.ad-mini .ad-img-placeholder .ad-flag {
  position: absolute; top: 0.5rem; right: 0.5rem;
  width: 8px; height: 8px; border-radius: 50%; background: var(--md-red);
}
.ad-mini .ad-body { padding: 0.875rem; }
.ad-mini .ad-body h4 {
  font-size: 0.8125rem; font-weight: 600; line-height: 1.4;
  color: var(--notion-black); margin-bottom: 0.375rem;
}
.ad-mini .ad-body .ad-row {
  display: flex; justify-content: space-between;
  font-size: 0.6875rem; color: var(--notion-gray);
}
.ad-mini .ad-body .spend { font-weight: 700; color: var(--notion-black); }

/* A/B RESULTS */
.ab-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem; margin: 1.75rem 0;
}
.ab-card {
  background: var(--notion-white); border: 1px solid var(--notion-light);
  border-radius: 8px; padding: 1.125rem; text-align: center;
}
.ab-card .ab-val {
  font-size: 1.5rem; font-weight: 800; color: var(--md-green);
  letter-spacing: -0.02em; margin-bottom: 0.125rem;
}
.ab-card .ab-label {
  font-size: 0.6875rem; color: var(--notion-gray); line-height: 1.4;
}

/* CTA */
.cta-box {
  background: var(--notion-black); border-radius: 10px;
  padding: 3rem; text-align: center; color: white;
  margin: 2.5rem 0 1.5rem; position: relative; overflow: hidden;
}
.cta-box::before {
  content: ''; position: absolute; top: -40%; right: -15%;
  width: 450px; height: 450px;
  background: radial-gradient(circle, rgba(255,122,0,0.1) 0%, transparent 70%);
  pointer-events: none;
}
.cta-box h2 {
  font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;
  margin-bottom: 0.625rem; position: relative; z-index: 1; line-height: 1.25;
  margin-top: 0; color: white;
}
.cta-box p {
  font-size: 0.9375rem; opacity: 0.55; max-width: 420px;
  margin: 0 auto 1.75rem; line-height: 1.6; position: relative; z-index: 1;
  color: white;
}
.btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.9375rem;
  padding: 0.875rem 2rem; border-radius: 100px;
  text-decoration: none; border: none; cursor: pointer;
  transition: all 0.2s ease; position: relative; z-index: 1;
  background: var(--md-orange); color: white;
}
.btn:hover { background: #e86e00; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,122,0,0.3); }
.cta-box .fine { font-size: 0.6875rem; opacity: 0.3; margin-top: 1rem; position: relative; z-index: 1; }

/* STICKY CTA */
.sticky-cta {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--notion-light);
  padding: 1rem;
  display: flex;
  justify-content: center;
  z-index: 100;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
}

/* FOOTER */
footer {
  padding: 1.25rem 2.5rem 5rem; border-top: 1px solid var(--notion-light);
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.75rem; color: var(--notion-gray);
}
.powered { display: flex; align-items: center; gap: 0.5rem; }
.md-icon {
  width: 14px; height: 14px; display: grid;
  grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 1.5px;
}
.md-icon span { border-radius: 1.5px; }
.md-icon span:nth-child(1) { background: var(--md-orange); }
.md-icon span:nth-child(2) { background: var(--notion-light); }
.md-icon span:nth-child(3) { background: var(--notion-light); }
.md-icon span:nth-child(4) { background: var(--md-green); }
footer a { color: var(--notion-gray); text-decoration: none; font-weight: 600; }
footer a:hover { color: var(--md-orange); }

/* RESPONSIVE */
@media (max-width: 700px) {
  .doc-header, .content, footer { padding-left: 1.25rem; padding-right: 1.25rem; }
  .results-strip { grid-template-columns: repeat(2, 1fr); }
  .r-stat:nth-child(2) { border-right: none; }
  .r-stat { border-bottom: 1px solid rgba(255,255,255,0.08); }
  .r-stat:nth-last-child(-n+2) { border-bottom: none; }
  .ad-strip, .ab-grid { grid-template-columns: 1fr; }
  .match-grid { grid-template-columns: 1fr 1fr; }
  .match-grid .mg-label { display: none; }
  .cta-box { padding: 2rem 1.25rem; }
  footer { flex-direction: column; gap: 0.5rem; }
}
</style>
