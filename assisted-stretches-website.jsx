import { useState, useEffect, useRef } from "react";

// ─── ROUTING ────────────────────────────────────────────────
const PAGES = {
  session: "session",
  fivePack: "5-pack",
  tenPack: "10-pack",
  giftCards: "gift-cards",
};

// ─── SHARED DATA ────────────────────────────────────────────
const TRUST_SIGNALS = [
  { icon: "✦", text: "Qualified Practitioners" },
  { icon: "◆", text: "Over 2,400 Sessions Delivered" },
  { icon: "★", text: "4.9/5 — 180+ Google Reviews" },
  { icon: "♥", text: "Health Fund Rebates (HICAPS)" },
  { icon: "◎", text: "First-Session Money-Back Guarantee" },
];

const BENEFITS = [
  {
    tag: "RANGE",
    headline: "Reach further by the end of the session.",
    body: "Most clients report measurable improvement in hip, hamstring or shoulder range within a single session. We test before, test after, and you feel the difference walking out.",
  },
  {
    tag: "RECOVERY",
    headline: "Train harder, recover faster.",
    body: "Assisted stretching after heavy training days helps clear lactic build-up and reduces next-day stiffness. Pair it with your weekly long run, lift, or ride.",
  },
  {
    tag: "RELEASE",
    headline: "Switch your nervous system off for a full hour.",
    body: "Held stretches with the right pressure trigger the parasympathetic response — the same one that takes over when you finally fall asleep. Most clients leave calmer than they came in.",
  },
];

const STEPS = [
  { label: "ARRIVE", time: "5 min", text: "You arrive in comfortable clothes — think gym gear, not activewear you can't move in. We chat about how your body is feeling and what you want from the session." },
  { label: "ASSESS", time: "5 min", text: "A quick range-of-movement check on the major joints. This gives us a starting point and lets you feel the change at the end." },
  { label: "STRETCH", time: "45 min", text: "You lie on a padded table. We move your limbs through a full sequence of held and dynamic stretches — hamstrings, hips, lower back, shoulders, neck. Pressure is always within your comfort." },
  { label: "RETEST", time: "3 min", text: "The same checks as step two. You'll feel the difference. Most clients are surprised at how much further their body will go." },
  { label: "GO", time: "2 min", text: "You leave with two or three take-home stretches matched to whatever was tightest — 30 seconds a day, no equipment." },
];

const FAQS = [
  { q: "Will it hurt?", a: "No. Pressure is always within your comfort. We work to a \"good stretch\" feeling — if it ever tips into pain, we back off." },
  { q: "Do I need to be flexible?", a: "No. The less flexible you are, the more dramatic the gain. Tightness is the reason to come, not the reason to wait." },
  { q: "What do I wear?", a: "Gym shorts and a t-shirt, or anything you can move freely in. No need to undress." },
  { q: "How often should I come?", a: "Most clients see best results once a week or fortnight. Athletes in heavy training blocks come twice a week." },
  { q: "Is it covered by health funds?", a: "Many extras policies cover remedial elements of the session through HICAPS on-site. Ask your fund or contact us before booking." },
  { q: "What is PNF stretching?", a: "Proprioceptive neuromuscular facilitation uses contract-relax cycles to access ranges your body protects from you. The result: deeper, faster, longer-lasting change than passive stretching alone." },
];

const REVIEWS = [
  { stars: 5, text: "I've had massage every fortnight for ten years and never felt the kind of release I got in 60 minutes here. Walked out two inches taller.", name: "Sarah K.", label: "desk worker, runner" },
  { stars: 5, text: "My hips have been a wreck since I started lifting heavy. Three sessions in and my squat depth is back.", name: "Marcus T.", label: "powerlifter" },
  { stars: 5, text: "Went in skeptical, came out a convert. The take-home stretches alone are worth the price.", name: "Anna L.", label: "physiotherapist" },
];

const GIFT_REVIEWS = [
  { stars: 5, text: "My partner kept saying his back was killing him. I bought the 5-pack on a whim. He's been three times and is a different person. Easily the best gift I've given him.", name: "Jo M.", label: "partner gift" },
  { stars: 5, text: "Mum is the world's worst gift recipient — nothing is ever right. The 3-session card was the first thing in years she actually got excited about.", name: "Pete H.", label: "daughter's gift" },
  { stars: 5, text: "Gave the 10-pack to my training partner for his 40th. He told me later it was the gift that made him take recovery seriously.", name: "Lou S.", label: "birthday gift" },
];

// ─── BRAND PALETTE ──────────────────────────────────────────
// Deep Clay #9C5E3C · Bone #F2EDE4 · Forest Ink #2C3A2E · Sand #D4C4A8 · Muted Terracotta #C07A5B

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --charcoal: #1A1816;
    --deep-clay: #9C5E3C;
    --bone: #F0ECE6;
    --forest-ink: #2D3D35;
    --sand: #D4C4A8;
    --terracotta: #C8856A;
    --terracotta-hover: #D4956A;
    --white: #FFFFFF;
    --bone-dark: #E4DDD6;
    --text-secondary: #6B6054;
    --font-display: 'Cormorant Garamond', 'Georgia', serif;
    --font-body: 'DM Sans', -apple-system, sans-serif;
  }

  html { scroll-behavior: smooth; }
  body { font-family: var(--font-body); background: var(--bone); color: var(--forest-ink); -webkit-font-smoothing: antialiased; }
  ::selection { background: var(--deep-clay); color: var(--bone); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .fade-up { animation: fadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .fade-in { animation: fadeIn 0.6s ease forwards; }
  .delay-1 { animation-delay: 0.12s; }
  .delay-2 { animation-delay: 0.24s; }
  .delay-3 { animation-delay: 0.36s; }
  .delay-4 { animation-delay: 0.48s; }

  @media (max-width: 768px) {
    .desktop-nav { display: none !important; }
    .mobile-menu-btn { display: block !important; }
    .hero-grid, .bio-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 480px) {
    .footer-grid { grid-template-columns: 1fr !important; }
  }
  @media (min-width: 481px) and (max-width: 768px) {
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
  }
`;

// ─── LOGO ────────────────────────────────────────────────────
function BrandLogo({ height = 56 }) {
  const ratio = 700 / 1000;
  const w = height / ratio;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width={w} height={height} style={{ display: "block" }}>
      <rect width="1000" height="700" fill="#1a1816"/>
      <circle cx="500" cy="240" r="150" fill="#2d3d35" fillOpacity="0.55"/>
      <circle cx="500" cy="240" r="150" fill="none" stroke="#c8856a" strokeWidth="5"/>
      <text x="500" y="298" fontFamily="Georgia, 'Times New Roman', serif" fontSize="160" fontWeight="700" textAnchor="middle" letterSpacing="-7">
        <tspan fill="#f0ece6">A</tspan><tspan fill="#c8856a">S</tspan>
      </text>
      <text x="500" y="436" fontFamily="Georgia, 'Times New Roman', serif" fontSize="58" fontWeight="700" fill="#f0ece6" textAnchor="middle" letterSpacing="4">ASSISTED</text>
      <text x="500" y="500" fontFamily="Georgia, 'Times New Roman', serif" fontSize="58" fontWeight="400" fontStyle="italic" fill="#c8856a" textAnchor="middle" letterSpacing="2">stretches</text>
    </svg>
  );
}

// ─── PRIMITIVES ─────────────────────────────────────────────
function Container({ children, style = {} }) {
  return <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", ...style }}>{children}</div>;
}

function Section({ children, style = {}, dark = false }) {
  return (
    <section style={{ padding: "88px 0", background: dark ? "var(--forest-ink)" : "transparent", color: dark ? "var(--bone)" : "var(--forest-ink)", ...style }}>
      <Container>{children}</Container>
    </section>
  );
}

function SectionLabel({ text }) {
  return <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--deep-clay)", marginBottom: 14 }}>{text}</div>;
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: sub ? 16 : 36 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 400, lineHeight: 1.12, color: "inherit", letterSpacing: "-0.01em", maxWidth: 720 }}>{children}</h2>
      {sub && <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--text-secondary)", marginTop: 16, maxWidth: 580 }}>{sub}</p>}
    </div>
  );
}

function PrimaryButton({ children, large, style = {} }) {
  const [h, setH] = useState(false);
  return (
    <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      background: h ? "var(--terracotta-hover)" : "var(--terracotta)", color: "var(--bone)", border: "none",
      padding: large ? "18px 44px" : "14px 34px", borderRadius: 6, cursor: "pointer",
      fontFamily: "var(--font-body)", fontSize: large ? 16 : 14.5, fontWeight: 500, letterSpacing: "0.02em",
      transition: "all 0.3s ease", transform: h ? "translateY(-1px)" : "none",
      boxShadow: h ? "0 6px 20px rgba(192,122,91,0.3)" : "none", ...style,
    }}>{children}</button>
  );
}

function SecondaryButton({ children, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      background: "transparent", color: "var(--forest-ink)", border: "1.5px solid var(--sand)",
      padding: "14px 34px", borderRadius: 6, cursor: "pointer",
      fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 400, letterSpacing: "0.02em",
      transition: "all 0.25s", borderColor: h ? "var(--deep-clay)" : "var(--sand)",
    }}>{children}</button>
  );
}

function EditorialImage({ label, height = 420, style = {} }) {
  return (
    <div style={{ background: "var(--sand)", borderRadius: 14, height, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 40%, rgba(156,94,60,0.08) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(44,58,46,0.05) 0%, transparent 50%)" }} />
      <div style={{ position: "relative", textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--deep-clay)", marginBottom: 8 }}>Editorial Photography</div>
        <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 280 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── NAV ─────────────────────────────────────────────────────
function Nav({ currentPage, setPage }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const el = document.querySelector('.app-scroll-container');
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 40);
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);
  const navItems = [
    { key: PAGES.session, label: "Single Session" },
    { key: PAGES.fivePack, label: "5-Pack" },
    { key: PAGES.tenPack, label: "10-Pack" },
    { key: PAGES.giftCards, label: "Gift Cards" },
  ];
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: scrolled ? "rgba(242,237,228,0.95)" : "transparent", backdropFilter: scrolled ? "blur(14px)" : "none", borderBottom: scrolled ? "1px solid var(--sand)" : "1px solid transparent", transition: "all 0.35s ease" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => setPage(PAGES.session)} style={{ cursor: "pointer" }}>
          <BrandLogo height={112} />
        </div>
        <div style={{ display: "flex", gap: 36, alignItems: "center" }} className="desktop-nav">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setPage(item.key)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 400, color: currentPage === item.key ? "var(--deep-clay)" : "var(--text-secondary)", letterSpacing: "0.02em", padding: "4px 0", borderBottom: currentPage === item.key ? "1.5px solid var(--deep-clay)" : "1.5px solid transparent", transition: "all 0.25s" }}>{item.label}</button>
          ))}
          <button style={{ background: "var(--terracotta)", color: "var(--bone)", border: "none", padding: "11px 28px", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500, letterSpacing: "0.02em", transition: "background 0.25s" }} onMouseEnter={e => e.target.style.background = "var(--terracotta-hover)"} onMouseLeave={e => e.target.style.background = "var(--terracotta)"}>Book Now</button>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-btn" style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 8 }}>
          <div style={{ width: 22, height: 2, background: "var(--forest-ink)", marginBottom: 5, borderRadius: 1 }} />
          <div style={{ width: 22, height: 2, background: "var(--forest-ink)", marginBottom: 5, borderRadius: 1 }} />
          <div style={{ width: 16, height: 2, background: "var(--forest-ink)", borderRadius: 1 }} />
        </button>
      </div>
      {mobileOpen && (
        <div style={{ background: "var(--bone)", borderBottom: "1px solid var(--sand)", padding: "16px 28px" }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => { setPage(item.key); setMobileOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 16, padding: "14px 0", color: currentPage === item.key ? "var(--deep-clay)" : "var(--forest-ink)", borderBottom: "1px solid var(--bone-dark)" }}>{item.label}</button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── SHARED SECTIONS ─────────────────────────────────────────
function TrustBar() {
  return (
    <div style={{ background: "var(--bone-dark)", borderTop: "1px solid var(--sand)", borderBottom: "1px solid var(--sand)" }}>
      <Container>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 40px", padding: "22px 0" }}>
          {TRUST_SIGNALS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 400, whiteSpace: "nowrap" }}>
              <span style={{ color: "var(--deep-clay)", fontSize: 10 }}>{s.icon}</span>{s.text}
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}

function MessagingPillars() {
  const pillars = [
    { title: "Expert hands, trained technique.", body: "Every practitioner is trained in advanced assisted stretching and PNF protocols. This isn't massage with extra steps — it's a discipline." },
    { title: "You relax. We work.", body: "Most mobility practices ask you to perform. Here, you receive. Your only job is to breathe and let go." },
    { title: "Measurable results.", body: "Greater range of motion. Faster recovery. Less stiffness. We track it, and so will you." },
  ];
  return (
    <Section dark>
      <SectionLabel text="The approach" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32, marginTop: 8 }}>
        {pillars.map((p, i) => (
          <div key={i} style={{ paddingRight: 16 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 400, marginBottom: 14, color: "var(--bone)" }}>{p.title}</h3>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--sand)", opacity: 0.85 }}>{p.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function BenefitCard({ benefit }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ background: "var(--white)", border: "1px solid var(--sand)", borderRadius: 10, padding: 36, transition: "box-shadow 0.35s, transform 0.35s", boxShadow: h ? "0 10px 36px rgba(156,94,60,0.08)" : "none", transform: h ? "translateY(-3px)" : "none" }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", color: "var(--terracotta)", marginBottom: 18 }}>{benefit.tag}</div>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 400, lineHeight: 1.25, marginBottom: 14, color: "var(--forest-ink)" }}>{benefit.headline}</h3>
      <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-secondary)" }}>{benefit.body}</p>
    </div>
  );
}

function BenefitsSection() {
  return (
    <Section>
      <SectionLabel text="What it does for you" />
      <SectionTitle sub="Whether you're chasing a PB, recovering from desk life, or just want to bend down without grunting — here's what 60 minutes on the table can do.">
        Designed for people who sit too much, train too hard, or sleep too little.
      </SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 44 }}>
        {BENEFITS.map((b, i) => <BenefitCard key={i} benefit={b} />)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px 64px", marginTop: 60, padding: "36px 0", borderTop: "1px solid var(--sand)" }}>
        {[{ num: "+22%", label: "avg. hamstring range gain per session" }, { num: "94%", label: "of clients book again within 2 weeks" }, { num: "4.9/5", label: "across 180+ Google reviews" }].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--deep-clay)", lineHeight: 1, fontWeight: 400 }}>{s.num}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 8 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function HowItWorksSection() {
  return (
    <Section style={{ background: "var(--white)" }}>
      <SectionLabel text="How it works" />
      <SectionTitle>What happens in a 60-minute session</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 36, maxWidth: 700 }}>
        {STEPS.map((step, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 20, padding: "28px 0", borderBottom: i < STEPS.length - 1 ? "1px solid var(--bone-dark)" : "none", alignItems: "start" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "1.5px solid var(--deep-clay)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 18, color: "var(--deep-clay)", fontWeight: 400 }}>{i + 1}</div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--forest-ink)" }}>{step.label}</span>
                <span style={{ fontSize: 12, color: "var(--deep-clay)", fontWeight: 500, letterSpacing: "0.06em" }}>{step.time}</span>
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-secondary)", maxWidth: 520 }}>{step.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 72 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 26, marginBottom: 28, fontWeight: 400 }}>How assisted stretching is different</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, background: "var(--bone)", borderRadius: 10, overflow: "hidden" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--sand)" }}>
                {["", "Solo stretching", "Massage", "Assisted stretching"].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "16px 22px", fontWeight: 500, fontSize: 12.5, letterSpacing: "0.03em", color: i === 3 ? "var(--deep-clay)" : "var(--forest-ink)", background: i === 3 ? "rgba(156,94,60,0.06)" : "transparent" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[["Reaches deep range", "Limited", "Indirect", "Yes — via PNF"], ["Active joint movement", "Yes", "No", "Yes"], ["Recovery focus", "Mild", "High", "High"], ["Time per session", "Variable", "60–90 min", "60 min"], ["Take-home program", "Self-directed", "Rare", "Included"]].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--bone-dark)" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "13px 22px", fontSize: 13.5, color: j === 0 ? "var(--forest-ink)" : "var(--text-secondary)", fontWeight: j === 0 ? 500 : 400, background: j === 3 ? "rgba(156,94,60,0.04)" : "transparent" }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <Section>
      <SectionLabel text="Common questions" />
      <SectionTitle>The questions everyone asks</SectionTitle>
      <div style={{ maxWidth: 660, marginTop: 28 }}>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ borderBottom: "1px solid var(--sand)" }}>
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "22px 0", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 15.5, fontWeight: 500, color: "var(--forest-ink)", textAlign: "left" }}>
              {faq.q}
              <span style={{ fontSize: 22, color: "var(--deep-clay)", transition: "transform 0.3s", transform: openIdx === i ? "rotate(45deg)" : "none", flexShrink: 0, marginLeft: 20, fontWeight: 300 }}>+</span>
            </button>
            <div style={{ maxHeight: openIdx === i ? 220 : 0, overflow: "hidden", transition: "max-height 0.4s ease" }}>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-secondary)", paddingBottom: 22 }}>{faq.a}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ReviewsSection({ reviews = REVIEWS, title, sub }) {
  return (
    <Section style={{ background: "var(--white)" }}>
      <SectionLabel text="What people say" />
      <SectionTitle sub={sub || "180+ verified Google reviews. Here's what people say after their first session."}>{title || "Don't take our word for it."}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 36 }}>
        {reviews.map((r, i) => (
          <div key={i} style={{ background: "var(--bone)", borderRadius: 10, padding: 36, border: "1px solid var(--bone-dark)" }}>
            <div style={{ color: "var(--terracotta)", fontSize: 14, marginBottom: 18, letterSpacing: 3 }}>{"★".repeat(r.stars)}</div>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--forest-ink)", fontFamily: "var(--font-display)", fontStyle: "italic", marginBottom: 22, fontWeight: 400 }}>"{r.text}"</p>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--forest-ink)" }}>{r.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>{r.label}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PractitionerBio() {
  return (
    <Section style={{ background: "var(--white)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }} className="bio-grid">
        <EditorialImage label="Close-crop, natural light — practitioner's hands guiding a shoulder stretch. Skin, fabric, linen, wood." height={380} />
        <div>
          <SectionLabel text="Your practitioner" />
          <p style={{ fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 1.45, marginBottom: 20, fontWeight: 400, color: "var(--forest-ink)" }}>
            Hi, I'm [Name]. I've been working with bodies for over [X] years — first as a remedial massage therapist, then specialising in assisted stretching and PNF technique.
          </p>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-secondary)" }}>
            Assisted stretching reaches the places massage cannot. Every session is one-on-one. You'll never share a room or a table.
          </p>
          <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--bone-dark)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontStyle: "italic", color: "var(--deep-clay)", lineHeight: 1.5 }}>
              "Your hamstrings shorten when you sit. We lengthen them."
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function GuaranteeBlock() {
  return (
    <Section>
      <div style={{ background: "var(--white)", border: "1.5px solid var(--deep-clay)", borderRadius: 14, padding: "52px 44px", maxWidth: 660, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.16em", color: "var(--deep-clay)", marginBottom: 18 }}>THE FIRST-SESSION PROMISE</div>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 1.45, fontWeight: 400, color: "var(--forest-ink)" }}>
          Try one session. If you don't feel a real, honest difference in how your body moves, we'll refund it.
        </p>
        <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginTop: 16, lineHeight: 1.65 }}>
          No paperwork, no awkward conversation — just send an email within 48 hours and it's done.
        </p>
      </div>
    </Section>
  );
}

function ObjectionHandlers() {
  const [openIdx, setOpenIdx] = useState(null);
  const items = [
    { q: "60 minutes is a lot of time — do I need that long?", a: "It's the right length to do the work properly. Shorter sessions skip body areas; longer ones lose your nervous system. 60 minutes is the sweet spot." },
    { q: "I can stretch myself for free.", a: "Solo stretching plateaus quickly. We use PNF technique to safely take you past the limits your own nervous system imposes — angles and depths your body protects against." },
    { q: "I'm too inflexible.", a: "That's exactly the starting line. The session adapts to where your body is today." },
    { q: "How is this different from massage?", a: "We're not working soft tissue with pressure — we're lengthening muscle through active, guided movement. It's a dedicated practice for restoring range." },
  ];
  return (
    <Section>
      <SectionLabel text="Still wondering?" />
      <SectionTitle>Common hesitations</SectionTitle>
      <div style={{ maxWidth: 660, marginTop: 20 }}>
        {items.map((item, i) => (
          <div key={i} style={{ borderBottom: "1px solid var(--sand)" }}>
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "22px 0", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 15.5, fontWeight: 500, color: "var(--forest-ink)", textAlign: "left" }}>
              "{item.q}"
              <span style={{ fontSize: 22, color: "var(--deep-clay)", transition: "transform 0.3s", transform: openIdx === i ? "rotate(45deg)" : "none", flexShrink: 0, marginLeft: 20, fontWeight: 300 }}>+</span>
            </button>
            <div style={{ maxHeight: openIdx === i ? 220 : 0, overflow: "hidden", transition: "max-height 0.4s ease" }}>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-secondary)", paddingBottom: 22 }}>{item.a}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PricingLadder({ setPage, highlight }) {
  const plans = [
    { name: "Single Session", price: "$125", per: "$125", save: "—", validity: "Use anytime", includes: "1 × 60-min session", best: "Trying it out", page: PAGES.session },
    { name: "5-Pack", price: "$575", per: "$115", save: "$50 (8%)", validity: "6 months", includes: "5 × 60-min sessions", best: "Building a habit", page: PAGES.fivePack, recommended: true },
    { name: "10-Pack", price: "$1,000", per: "$100", save: "$250 (20%)", validity: "12 months", includes: "10 × 60-min sessions + guest pass", best: "Athletes & regulars", page: PAGES.tenPack },
  ];
  return (
    <Section>
      <SectionLabel text="Pricing" />
      <SectionTitle>Choose your path</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginTop: 36 }}>
        {plans.map((p, i) => {
          const isHL = highlight === p.page || (!highlight && p.recommended);
          return (
            <div key={i} style={{ background: isHL ? "var(--forest-ink)" : "var(--white)", color: isHL ? "var(--bone)" : "var(--forest-ink)", borderRadius: 14, padding: 40, border: isHL ? "none" : "1px solid var(--sand)", position: "relative", transition: "transform 0.3s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
              {p.recommended && <div style={{ position: "absolute", top: -11, left: 28, background: "var(--terracotta)", color: "var(--bone)", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", padding: "5px 16px", borderRadius: 20 }}>RECOMMENDED</div>}
              <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 10, opacity: 0.7 }}>{p.name}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 44, marginBottom: 4, fontWeight: 400 }}>{p.price}</div>
              <div style={{ fontSize: 13.5, opacity: 0.6, marginBottom: 28 }}>{p.per} per session</div>
              <div style={{ fontSize: 13.5, lineHeight: 2.3, borderTop: `1px solid ${isHL ? "rgba(242,237,228,0.15)" : "var(--bone-dark)"}`, paddingTop: 22 }}>
                <div><span style={{ opacity: 0.5 }}>Save:</span> {p.save}</div>
                <div><span style={{ opacity: 0.5 }}>Valid:</span> {p.validity}</div>
                <div><span style={{ opacity: 0.5 }}>Includes:</span> {p.includes}</div>
                <div><span style={{ opacity: 0.5 }}>Best for:</span> {p.best}</div>
              </div>
              <button onClick={() => setPage(p.page)} style={{ marginTop: 28, width: "100%", padding: "14px 0", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 500, background: "var(--terracotta)", color: "var(--bone)", border: "none", transition: "opacity 0.25s", letterSpacing: "0.02em" }} onMouseEnter={e => e.target.style.opacity = 0.88} onMouseLeave={e => e.target.style.opacity = 1}>Select {p.name}</button>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function Footer() {
  return (
    <footer style={{ background: "var(--forest-ink)", color: "var(--sand)", padding: "72px 0 44px" }}>
      <Container>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 44, marginBottom: 52 }} className="footer-grid">
          <div>
            <div style={{ marginBottom: 16 }}>
              <BrandLogo height={104} />
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.75, opacity: 0.55, maxWidth: 280 }}>
              One-on-one assisted stretching therapy in Brisbane. Deeper mobility, faster recovery, lasting flexibility — while you stay completely relaxed.
            </p>
            <div style={{ marginTop: 20, fontFamily: "var(--font-display)", fontSize: 15, fontStyle: "italic", opacity: 0.45 }}>
              Deeper than you can reach alone.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", marginBottom: 18, opacity: 0.4 }}>SESSIONS</div>
            <div style={{ fontSize: 13.5, lineHeight: 2.6, opacity: 0.6 }}><div>Single Session</div><div>5-Pack</div><div>10-Pack</div></div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", marginBottom: 18, opacity: 0.4 }}>GIFTS</div>
            <div style={{ fontSize: 13.5, lineHeight: 2.6, opacity: 0.6 }}><div>Gift Cards</div><div>Recovery Kit</div></div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", marginBottom: 18, opacity: 0.4 }}>CONNECT</div>
            <div style={{ fontSize: 13.5, lineHeight: 2.6, opacity: 0.6 }}><div>Instagram</div><div>Google Reviews</div><div>Contact</div></div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(212,196,168,0.15)", paddingTop: 28, fontSize: 12.5, opacity: 0.35, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>© 2026 Assisted Stretches. Brisbane, QLD.</div>
          <div>Privacy · Terms · Refund Policy</div>
        </div>
      </Container>
    </footer>
  );
}

// ─── PAGES ───────────────────────────────────────────────────
function SessionPage({ setPage }) {
  return (
    <>
      <Section style={{ paddingTop: 56, paddingBottom: 64 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }} className="hero-grid">
          <div>
            <div className="fade-up" style={{ opacity: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: "0.16em", color: "var(--deep-clay)", marginBottom: 22 }}>ONE-ON-ONE · 60 MINUTES · BRISBANE STUDIO</div>
            </div>
            <h1 className="fade-up delay-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 5.5vw, 58px)", fontWeight: 400, lineHeight: 1.06, letterSpacing: "-0.02em", marginBottom: 26, opacity: 0, color: "var(--forest-ink)" }}>
              Stretch deeper than you can on your own.
            </h1>
            <p className="fade-up delay-2" style={{ fontSize: 16.5, lineHeight: 1.7, color: "var(--text-secondary)", maxWidth: 460, marginBottom: 34, opacity: 0 }}>
              A guided 60-minute assisted stretch session using PNF technique that goes where solo stretching cannot — hamstrings, hips, shoulders, lower back. You lie down. We do the work.
            </p>
            <div className="fade-up delay-3" style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 30, opacity: 0 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--forest-ink)", fontWeight: 400 }}>$125</span>
              <span style={{ margin: "0 14px", opacity: 0.35 }}>·</span>5-pack from $115/session<span style={{ margin: "0 14px", opacity: 0.35 }}>·</span>10-pack from $100/session
            </div>
            <div className="fade-up delay-4" style={{ display: "flex", gap: 16, flexWrap: "wrap", opacity: 0 }}>
              <PrimaryButton large>Book a session — $125</PrimaryButton>
              <SecondaryButton>See how it works</SecondaryButton>
            </div>
          </div>
          <div className="fade-in delay-3" style={{ opacity: 0 }}>
            <EditorialImage label="Practitioner's hands guiding a hamstring stretch. Natural light, neutral tones, close crop, editorial feel — Kinfolk meets physiotherapy." height={460} />
          </div>
        </div>
      </Section>
      <TrustBar />
      <MessagingPillars />
      <BenefitsSection />
      <HowItWorksSection />
      <FAQSection />
      <PractitionerBio />
      <GuaranteeBlock />
      <ReviewsSection />
      <ObjectionHandlers />
      <PricingLadder setPage={setPage} highlight={PAGES.session} />
      <Section style={{ background: "var(--white)" }}>
        <SectionLabel text="While you're here" />
        <SectionTitle>Extras</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginTop: 28 }}>
          {[{ title: "Gift Cards", desc: "1, 3, 5, or 10 sessions. The best gift our clients have ever received.", cta: "Browse gift cards" }, { title: "Recovery Kit", desc: "Mini foam roller and massage ball pair. Branded packaging, take-home ready.", cta: "Add to cart — $49" }, { title: "Partner Offers", desc: "First month at a recommended local gym, recovery cafe, or sleep brand.", cta: "View offers" }].map((item, i) => (
            <div key={i} style={{ background: "var(--bone)", border: "1px solid var(--bone-dark)", borderRadius: 10, padding: 32 }}>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 10, fontWeight: 400 }}>{item.title}</h4>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-secondary)", marginBottom: 18 }}>{item.desc}</p>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--terracotta)", cursor: "pointer" }}>{item.cta} →</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function FivePackPage({ setPage }) {
  return (
    <>
      <Section style={{ paddingTop: 56, paddingBottom: 64 }}>
        <div style={{ maxWidth: 660 }}>
          <div className="fade-up" style={{ opacity: 0 }}><div style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: "0.16em", color: "var(--deep-clay)", marginBottom: 22 }}>FIVE SESSIONS · 6-MONTH VALIDITY · SAVE $50</div></div>
          <h1 className="fade-up delay-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 54px)", fontWeight: 400, lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 26, opacity: 0 }}>Five sessions. The habit takes hold.</h1>
          <p className="fade-up delay-2" style={{ fontSize: 16.5, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 34, opacity: 0 }}>Five 60-minute assisted stretch sessions, used at your pace over six months. The format most regulars start with — long enough to feel real change, short enough to commit to today.</p>
          <div className="fade-up delay-3" style={{ marginBottom: 30, opacity: 0 }}><span style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "var(--forest-ink)", fontWeight: 400 }}>$575</span><span style={{ fontSize: 14.5, color: "var(--text-secondary)", marginLeft: 14 }}>$115 per session · Save $50</span></div>
          <div className="fade-up delay-4" style={{ display: "flex", gap: 16, flexWrap: "wrap", opacity: 0 }}><PrimaryButton large>Buy 5-pack — $575</PrimaryButton><SecondaryButton onClick={() => setPage(PAGES.tenPack)}>Compare with 10-pack</SecondaryButton></div>
        </div>
      </Section>
      <Section style={{ background: "var(--white)" }}>
        <div style={{ maxWidth: 560, background: "var(--bone)", border: "1px solid var(--bone-dark)", borderRadius: 12, padding: 44 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", color: "var(--deep-clay)", marginBottom: 18 }}>WHY MOST CLIENTS PICK THIS PACK</div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1.45, fontWeight: 400 }}>A single session shows you what's possible. Five sessions makes the change stick.</p>
          <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginTop: 14, lineHeight: 1.65 }}>Most regulars start here, then graduate to the 10-pack once they realise they're coming weekly anyway.</p>
        </div>
      </Section>
      <TrustBar /><BenefitsSection /><HowItWorksSection /><FAQSection /><ReviewsSection /><ObjectionHandlers /><PricingLadder setPage={setPage} highlight={PAGES.fivePack} />
    </>
  );
}

function TenPackPage({ setPage }) {
  return (
    <>
      <Section style={{ paddingTop: 56, paddingBottom: 64 }}>
        <div style={{ maxWidth: 660 }}>
          <div className="fade-up" style={{ opacity: 0 }}><div style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: "0.16em", color: "var(--deep-clay)", marginBottom: 22 }}>TEN SESSIONS · 12-MONTH VALIDITY · SAVE $250</div></div>
          <h1 className="fade-up delay-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 54px)", fontWeight: 400, lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 26, opacity: 0 }}>Ten sessions. The best per-session price we offer.</h1>
          <p className="fade-up delay-2" style={{ fontSize: 16.5, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 34, opacity: 0 }}>Ten 60-minute assisted stretch sessions, used at your pace over twelve months. For people who already know how this feels and want it as part of life.</p>
          <div className="fade-up delay-3" style={{ marginBottom: 30, opacity: 0 }}><span style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "var(--forest-ink)", fontWeight: 400 }}>$1,000</span><span style={{ fontSize: 14.5, color: "var(--text-secondary)", marginLeft: 14 }}>$100 per session · Save $250</span></div>
          <div className="fade-up delay-4" style={{ display: "flex", gap: 16, flexWrap: "wrap", opacity: 0 }}><PrimaryButton large>Buy 10-pack — $1,000</PrimaryButton><SecondaryButton onClick={() => setPage(PAGES.fivePack)}>Compare with 5-pack</SecondaryButton></div>
        </div>
      </Section>
      <Section style={{ background: "var(--white)" }}>
        <div style={{ maxWidth: 560, background: "var(--bone)", border: "1px solid var(--bone-dark)", borderRadius: 12, padding: 44 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", color: "var(--deep-clay)", marginBottom: 18 }}>THE LOYALTY PACK</div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1.45, fontWeight: 400 }}>Ten sessions at $100 each. The best per-session rate we offer, plus a free guest pass.</p>
          <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginTop: 14, lineHeight: 1.65 }}>Twelve months to use them — plenty of room for life.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 36 }}>
          {[{ icon: "◇", text: "One complimentary guest pass to share" }, { icon: "◈", text: "Priority booking — schedule 6 weeks ahead" }, { icon: "◉", text: "Credits valid 12 months from purchase" }].map((perk, i) => (
            <div key={i} style={{ background: "var(--bone)", border: "1px solid var(--bone-dark)", borderRadius: 8, padding: "20px 24px", display: "flex", gap: 14, alignItems: "start" }}>
              <span style={{ color: "var(--deep-clay)", fontSize: 14 }}>{perk.icon}</span>
              <span style={{ fontSize: 14, lineHeight: 1.55 }}>{perk.text}</span>
            </div>
          ))}
        </div>
      </Section>
      <TrustBar /><BenefitsSection /><HowItWorksSection /><FAQSection /><ReviewsSection /><ObjectionHandlers /><PricingLadder setPage={setPage} highlight={PAGES.tenPack} />
    </>
  );
}

function GiftCardsPage({ setPage }) {
  const [sel, setSel] = useState(1);
  const denoms = [
    { sessions: 1, price: "$125", saving: "—", tagline: "One hour where the world stops.", desc: "A single 60-minute session. The right gift when you're not sure if they'll like it. They will." },
    { sessions: 3, price: "$345", saving: "$30 (8%)", tagline: "Enough to feel the change.", desc: "Three 60-minute sessions. The sweet spot for birthdays and meaningful thank-yous." },
    { sessions: 5, price: "$575", saving: "$50 (8%)", tagline: "A real reset.", desc: "Five 60-minute sessions. For someone who needs more than a one-off." },
    { sessions: 10, price: "$1,000", saving: "$250 (20%)", tagline: "A year of looking after themselves.", desc: "Ten 60-minute sessions. The premium gift, and our best per-session value." },
  ];
  return (
    <>
      <Section style={{ paddingTop: 56, paddingBottom: 64 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }} className="hero-grid">
          <div>
            <div className="fade-up" style={{ opacity: 0 }}><div style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: "0.16em", color: "var(--deep-clay)", marginBottom: 22 }}>GIFT CARDS · DIGITAL OR PRINTED · 12-MONTH VALIDITY</div></div>
            <h1 className="fade-up delay-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 400, lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 26, opacity: 0 }}>Give the feeling of a body that finally lets go.</h1>
            <p className="fade-up delay-2" style={{ fontSize: 16.5, lineHeight: 1.7, color: "var(--text-secondary)", maxWidth: 460, marginBottom: 34, opacity: 0 }}>A gift card for one, three, five or ten 60-minute assisted stretch sessions. Delivered the moment you buy it, redeemable for twelve months.</p>
            <div className="fade-up delay-3" style={{ marginBottom: 30, opacity: 0 }}><span style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--forest-ink)", fontWeight: 400 }}>From $125 — up to $1,000</span><div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 6 }}>Includes a personal message</div></div>
            <div className="fade-up delay-4" style={{ display: "flex", gap: 16, flexWrap: "wrap", opacity: 0 }}><PrimaryButton large>Choose a gift card</PrimaryButton><SecondaryButton>See what people say</SecondaryButton></div>
          </div>
          <div className="fade-in delay-3" style={{ opacity: 0 }}><EditorialImage label="Printed gift card on textured stone with hand-tied ribbon. Brand colours, no faces — the object and the gesture." height={420} /></div>
        </div>
      </Section>
      <Section style={{ background: "var(--white)" }}>
        <SectionLabel text="Choose a denomination" />
        <SectionTitle>Pick the perfect gift</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginTop: 36 }}>
          {denoms.map((d, i) => {
            const active = sel === i;
            return (
              <div key={i} onClick={() => setSel(i)} style={{ background: active ? "var(--forest-ink)" : "var(--bone)", color: active ? "var(--bone)" : "var(--forest-ink)", borderRadius: 12, padding: 32, cursor: "pointer", border: active ? "none" : "1px solid var(--bone-dark)", transition: "all 0.3s" }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, opacity: 0.6 }}>{d.sessions} {d.sessions === 1 ? "session" : "sessions"}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 36, margin: "10px 0", fontWeight: 400 }}>{d.price}</div>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontStyle: "italic", opacity: 0.8, marginBottom: 12 }}>"{d.tagline}"</p>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.65 }}>{d.desc}</p>
                {d.saving !== "—" && <div style={{ marginTop: 16, fontSize: 12.5, fontWeight: 500, color: active ? "var(--sand)" : "var(--deep-clay)" }}>Save {d.saving}</div>}
              </div>
            );
          })}
        </div>
      </Section>
      <Section>
        <SectionLabel text="Gift reassurances" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 20 }}>
          {["Delivered instantly to your inbox — or theirs on a date you choose.", "Includes a personal message you write at checkout.", "Twelve months to redeem, with reminder emails before expiry.", "Refundable within 14 days if unused."].map((t, i) => (
            <div key={i} style={{ background: "var(--white)", border: "1px solid var(--bone-dark)", borderRadius: 8, padding: "22px 24px", fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--deep-clay)", marginRight: 10, fontSize: 13 }}>✓</span>{t}
            </div>
          ))}
        </div>
      </Section>
      <TrustBar />
      <Section style={{ background: "var(--white)" }}>
        <SectionLabel text="Who it's for" />
        <SectionTitle>Most gifts get used once. This one changes how someone moves.</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 36 }}>
          {[{ tag: "FOR THE PERSON WHO HAS EVERYTHING", text: "The chronic over-shoppers, the hard-to-buy-for partner, the parent who waves off birthdays. They don't need another candle. They need an hour where someone takes care of them." }, { tag: "FOR THE PERSON WHO WON'T LOOK AFTER THEMSELVES", text: "Athletes who skip recovery. Desk workers who never stop. Parents running on empty. A gift card removes the excuses — it's booked, it's paid for, all they have to do is turn up." }, { tag: "FOR THE PERSON YOU ACTUALLY LOVE", text: "A 10-pack is a year of being looked after. A 5-pack is a real reset. Even a single session lands harder than a bunch of flowers — because they remember it for a week." }].map((b, i) => (
            <div key={i} style={{ background: "var(--bone)", border: "1px solid var(--bone-dark)", borderRadius: 10, padding: 36 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.12em", color: "var(--deep-clay)", marginBottom: 16 }}>{b.tag}</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-secondary)" }}>{b.text}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section>
        <SectionLabel text="How gifting works" />
        <SectionTitle>Four steps. Two minutes.</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginTop: 36 }}>
          {[{ step: "1", title: "Choose", desc: "Pick a denomination, delivery format (digital or printed), and a date." }, { step: "2", title: "Personalise", desc: "Add a message. Up to 280 characters — enough to be meaningful, short enough to actually write." }, { step: "3", title: "Deliver", desc: "Digital cards arrive instantly or on the date you choose. Printed cards ship within 2 business days." }, { step: "4", title: "Redeem", desc: "They book online with the code on the card. Twelve months from purchase. We send reminders before it expires." }].map((s, i) => (
            <div key={i} style={{ background: "var(--white)", border: "1px solid var(--bone-dark)", borderRadius: 10, padding: 32 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: "1.5px solid var(--deep-clay)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 19, color: "var(--deep-clay)", marginBottom: 18, fontWeight: 400 }}>{s.step}</div>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 10, fontWeight: 400 }}>{s.title}</h4>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>
      <ReviewsSection reviews={GIFT_REVIEWS} title="Gifts that landed." sub="What givers say after they bought a card." />
      <Section>
        <SectionLabel text="Add-ons" />
        <SectionTitle>Make it extra</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginTop: 28 }}>
          {[{ title: "Gift Wrapping", desc: "Brand-stamped envelope and ribbon.", price: "$9" }, { title: "Recovery Kit Add-On", desc: "Mini foam roller and massage ball pair.", price: "$49" }, { title: "Second Card — 10% Off", desc: "Grab one for someone else while you're here.", price: "10% off" }].map((item, i) => (
            <div key={i} style={{ background: "var(--white)", border: "1px solid var(--bone-dark)", borderRadius: 10, padding: 32 }}>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 10, fontWeight: 400 }}>{item.title}</h4>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: 16 }}>{item.desc}</p>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--terracotta)" }}>{item.price}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

// ─── STICKY CTA ──────────────────────────────────────────────
function StickyCTA({ page }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = document.querySelector('.app-scroll-container');
    if (!el) return;
    const handler = () => setVisible(el.scrollTop > 500);
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);
  const labels = { [PAGES.session]: "Book a session — $125", [PAGES.fivePack]: "Buy 5-pack — $575", [PAGES.tenPack]: "Buy 10-pack — $1,000", [PAGES.giftCards]: "Choose a gift card" };
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(242,237,228,0.96)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--sand)", padding: "14px 28px", display: "flex", justifyContent: "center", zIndex: 99, transform: visible ? "translateY(0)" : "translateY(100%)", transition: "transform 0.35s ease" }}>
      <PrimaryButton>{labels[page]}</PrimaryButton>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(PAGES.session);
  const scrollRef = useRef(null);
  const changePage = (p) => { setPage(p); scrollRef.current?.scrollTo({ top: 0, behavior: "instant" }); };
  return (
    <>
      <style>{globalStyles}</style>
      <div ref={scrollRef} className="app-scroll-container" style={{ height: "100vh", overflow: "auto", background: "var(--bone)" }}>
        <Nav currentPage={page} setPage={changePage} />
        {page === PAGES.session && <SessionPage setPage={changePage} />}
        {page === PAGES.fivePack && <FivePackPage setPage={changePage} />}
        {page === PAGES.tenPack && <TenPackPage setPage={changePage} />}
        {page === PAGES.giftCards && <GiftCardsPage setPage={changePage} />}
        <Footer />
        <StickyCTA page={page} />
      </div>
    </>
  );
}
