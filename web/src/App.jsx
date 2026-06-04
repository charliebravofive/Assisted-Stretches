import { useState, useEffect, useRef } from "react";
import BookingModal from "./BookingModal.jsx";
import { PRODUCTS } from "./products.js";
import { usePageMeta } from "./usePageMeta.js";
import { useJsonLd } from "./useJsonLd.js";

// ─── ROUTING ────────────────────────────────────────────────
const PAGES = {
  home: "home",
  benefits: "benefits",
  about: "about",
  session: "session",
  fivePack: "5-pack",
  tenPack: "10-pack",
  giftCards: "gift-cards",
  faq: "faq",
  contact: "contact",
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

const DETAILED_FAQS = [
  {
    q: "How is assisted stretching different from stretching on my own or taking a yoga class?",
    a: "When you stretch on your own or follow along in a class, you're the one controlling the movement. That means your muscles stay at least partially engaged — bracing, guiding, compensating — even when you're trying to relax. You're essentially working against yourself.\n\nWith one-on-one assisted stretching, the dynamic changes completely. Your only job is to breathe and let go. A trained professional handles the positioning, angle, and depth of every movement, which allows your muscles to fully release in ways that are nearly impossible to achieve alone. The result is a deeper, more targeted stretch that reaches the areas you actually need — not just the ones that are easiest to access on your own.\n\nThere's also a precision factor. In a class setting, instruction is general by design. A stretch professional can zero in on your specific imbalances, movement patterns, and trouble spots, tailoring the session to your body in real time.",
  },
  {
    q: "I'm not very flexible at all. Is this still for me?",
    a: "Absolutely — and in fact, you might be the ideal person for it. Assisted stretching isn't a reward for already being flexible. It's a tool designed to safely improve whatever level of flexibility you currently have.\n\nThere's a common misconception that you need a baseline of flexibility before you can benefit from professional stretching. The opposite is true. People who are tighter or more restricted often see the most dramatic improvements because they have the most room to gain. Our professionals are trained to meet you exactly where you are, working with your body's current range of motion rather than pushing you toward someone else's.\n\nThere's no judgment, no comparison, and absolutely no expectation to touch your toes or fold in half. Every session is built around what your body can do today, with the goal of gently and progressively expanding that over time.",
  },
  {
    q: "Does assisted stretching hurt?",
    a: "A well-executed stretch should never be painful. What you will likely feel is a sensation of deep release — some people describe it as a \"good discomfort,\" similar to the satisfying feeling of a deep tissue massage. It's a sign that tension is being worked out, not that something is wrong.\n\nWhat you should not feel is sharp, shooting, or burning pain. Those are signals that a stretch has gone too far, and it's important to speak up immediately if you experience anything like that.\n\nCommunication is essential to the process. Your stretch professional will check in with you throughout the session, asking about intensity levels and adjusting accordingly. Think of it as a collaboration — they bring the expertise, and you bring the feedback. The more honestly you communicate what you're feeling, the more your professional can fine-tune the session to stay in that sweet spot between challenge and comfort.\n\nIf you've had injuries, surgeries, or chronic conditions, let your therapist know before the session begins so they can take extra care with those areas.",
  },
  {
    q: "How often do I need to get stretched to feel a real difference?",
    a: "You'll likely feel a noticeable difference after just one session. Most people leave feeling looser, lighter, and more relaxed than when they walked in. But that immediate relief is just the beginning.\n\nLasting, meaningful change — the kind where your posture improves, chronic tightness fades, and your body starts moving the way it's supposed to — comes from consistency. For most people, one session per week is a strong starting point. That frequency allows your body to build on the progress from each session before tightness has a chance to fully return.\n\nOver time, as your flexibility improves and your goals evolve, your therapist can help you adjust the cadence. Some clients move to twice a week for a period of accelerated progress, while others transition to biweekly maintenance sessions once they've hit their targets.\n\nThe key takeaway is this: stretching is cumulative. Each session builds on the last, and the more consistent you are, the faster and more lasting your results will be.",
  },
  {
    q: "What should I do during the session? Is there anything I need to focus on?",
    a: "Your only two jobs during a session are to breathe and relax. That's it.\n\nYour stretch professional handles all of the technical work — the positioning, the angles, the timing, the progression. You don't need to worry about whether you're \"doing it right\" or whether your form looks good. There is no wrong way to receive a stretch as long as you're allowing your body to relax.\n\nFocus on taking slow, steady breaths. Deep breathing sends a signal to your nervous system that it's safe to let go, which helps your muscles release more fully. If you notice yourself holding your breath or tensing up — both very common, especially in the beginning — just bring your attention back to your breathing.\n\nThe other essential part of your role is communication. Let your therapist know how each stretch feels. If something is too intense, say so. If an area feels particularly good and you'd like more attention there, mention it. The more you communicate, the more your therapist can personalise the session in the moment.\n\nTrust the process and trust your professional. The more you can let go — mentally and physically — the more effective every minute of your session becomes.",
  },
  {
    q: "What should I wear to my session?",
    a: "Wear comfortable, athletic clothing that allows you to move freely. Think of what you'd wear to a yoga class or the gym — leggings, joggers, athletic shorts, and a fitted or relaxed t-shirt all work well.\n\nAvoid jeans, belts, heavy zippers, or anything restrictive. You want your clothing to move with your body, not against it. Shoes are not required during the session, so you can go barefoot or wear socks — whatever is most comfortable.",
  },
  {
    q: "Do I need to warm up before my session?",
    a: "No warm-up is necessary on your part. Your stretch professional will begin the session with lighter, gentler movements that gradually prepare your muscles and joints for deeper stretching. This built-in warm-up ensures your body is ready for each stretch before it's applied, reducing the risk of strain and making the session more effective from start to finish.\n\nIf you've just finished a workout, that's actually a great time to come in. Your muscles are already warm and more receptive to stretching, which can enhance the benefits of your session and support faster recovery.",
  },
  {
    q: "Is assisted stretching safe if I have an injury or a medical condition?",
    a: "In most cases, yes — but transparency is important. Before your first session, let your stretch professional know about any injuries, surgeries, chronic conditions, or areas of concern. This information allows them to modify their approach, avoid aggravating sensitive areas, and focus on movements that support your recovery rather than hinder it.\n\nAssisted stretching is often used as a complement to physical therapy, chiropractic care, and post-surgical rehabilitation. However, it is not a replacement for medical treatment. If you're currently being treated for a specific condition, we recommend checking with your healthcare provider before starting a stretching programme to make sure it aligns with your treatment plan.",
  },
  {
    q: "Can assisted stretching help with back pain or desk-related stiffness?",
    a: "It's one of the most common reasons people walk through our doors. Prolonged sitting — whether at a desk, in a car, or on a couch — causes certain muscle groups to shorten and tighten while others weaken and lengthen. This imbalance is a leading contributor to lower back pain, neck tension, rounded shoulders, and hip stiffness.\n\nAssisted stretching targets the specific muscles that tend to lock up from sedentary habits — hip flexors, hamstrings, chest muscles, and the muscles along the spine. By releasing that built-up tension and restoring balance to these muscle groups, many clients experience significant relief from chronic aches and postural discomfort.\n\nIt's not a one-time fix, but with regular sessions, most people notice a meaningful reduction in the daily stiffness and pain that come from spending long hours sitting.",
  },
  {
    q: "How long is a typical session?",
    a: "Session lengths vary depending on your needs and goals. Most studios offer sessions ranging from 25 to 50 minutes. A shorter session is great for targeting a specific area — such as the hips, shoulders, or lower back — while a longer session allows for a comprehensive, full-body stretch.\n\nIf you're new to assisted stretching, a longer initial session is often a good choice. It gives your therapist time to assess your overall flexibility, identify your tightest areas, and begin building a stretching plan that's tailored to you.",
  },
  {
    q: "Is there anything I should avoid doing after my session?",
    a: "There are no strict restrictions, but there are a few things that can help you get the most out of your stretch. Drink plenty of water after your session to help your muscles recover and stay hydrated. Avoid jumping straight into heavy lifting or high-intensity exercise immediately afterward — give your body at least a couple of hours to settle into its new range of motion.\n\nSome people feel a mild soreness similar to what you might experience after a good massage, particularly after their first few sessions. This is normal and typically resolves within a day. If you feel any sharp or unusual pain, reach out to your stretch professional so they can adjust your next session accordingly.",
  },
  {
    q: "Is it covered by health funds?",
    a: "Many extras policies cover remedial elements of the session through HICAPS on-site. Ask your fund or contact us before booking to confirm your eligibility.",
  },
  {
    q: "What is PNF stretching?",
    a: "Proprioceptive neuromuscular facilitation uses contract-relax cycles to access ranges your body protects from you. By briefly contracting a muscle before releasing it into a stretch, we can safely take you past the limits your own nervous system imposes. The result: deeper, faster, longer-lasting change than passive stretching alone.",
  },
];

const REVIEWS = [
  { stars: 5, text: "I've had massage every fortnight for ten years and never felt the kind of release I got in 60 minutes here. Walked out two inches taller.", name: "Sarah K.", label: "desk worker, runner" },
  { stars: 5, text: "My hips have been a wreck since I started lifting heavy. Three sessions in and my squat depth is back.", name: "Marcus T.", label: "powerlifter" },
  { stars: 5, text: "Went in skeptical, came out a convert. The take-home stretches alone are worth the price.", name: "Anna L.", label: "physiotherapist" },
];

const GIFT_REVIEWS = [
  { stars: 5, text: "My partner kept saying his back was killing him. I bought the 5-pack on a whim. He's been three times and is a different person. Easily the best gift I've given him.", name: "Jo M.", label: "partner gift" },
  { stars: 5, text: "Mum is the world's worst gift recipient — nothing is ever right. The 5-session card was the first thing in years she actually got excited about.", name: "Pete H.", label: "daughter's gift" },
  { stars: 5, text: "Gave the 10-pack to my training partner for his 40th. He told me later it was the gift that made him take recovery seriously.", name: "Lou S.", label: "birthday gift" },
];

// ─── BRAND PALETTE ──────────────────────────────────────────
// Deep Clay #9C5E3C · Bone #F2EDE4 · Forest Ink #2C3A2E · Sand #D4C4A8 · Muted Terracotta #C07A5B

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  p {
    font-family: var(--font-display);
    font-style: italic;
  }

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
    .mobile-menu-btn { display: flex !important; }

    /* Reduce large italic paragraph sizes on mobile */
    p { font-size: clamp(14px, 3.8vw, 18px) !important; }
    h1 { font-size: clamp(28px, 7vw, 48px) !important; }
    h2 { font-size: clamp(22px, 5.5vw, 36px) !important; }
    .hero-grid, .bio-grid { grid-template-columns: 1fr !important; }
    .hero-grid > *:first-child { order: 1; }
    .hero-grid > *:last-child  { order: 2; }

    /* Nav logo — shrink from 224px to 72px tall */
    .nav-logo-wrap svg { width: 110px !important; height: 77px !important; }

    /* Footer logo */
    .footer-logo-wrap svg { width: 110px !important; height: 77px !important; }
    .footer-logo-wrap { margin-bottom: 4px !important; margin-top: -12px !important; margin-left: -10px !important; }

    /* 4-col grid → 2 cols on tablet */
    .benefits-4col { grid-template-columns: 1fr 1fr !important; }

    /* About hero: drop fixed height */
    .about-hero-section { height: auto !important; padding-top: 32px !important; padding-bottom: 32px !important; }

    /* Reduce section vertical padding */
    section { padding-top: 36px !important; padding-bottom: 36px !important; }

    /* Reduce container padding */
    .container-inner { padding-left: 18px !important; padding-right: 18px !important; }

    /* Trust bar: scroll horizontally rather than wrapping oddly */
    .trust-bar-inner { flex-wrap: nowrap !important; overflow-x: auto !important; justify-content: flex-start !important; padding-bottom: 4px !important; scrollbar-width: none !important; }
    .trust-bar-inner::-webkit-scrollbar { display: none; }

    /* Stats row */
    .stats-row { gap: 20px !important; justify-content: center !important; }

    /* Table: allow scroll */
    .comparison-table-wrap { margin: 0 -18px !important; padding: 0 18px !important; }

    /* Body padding for sticky book btn */
    body { padding-bottom: 68px; }
  }

  @media (max-width: 480px) {
    .footer-grid { grid-template-columns: 1fr !important; }
    .benefits-4col { grid-template-columns: 1fr !important; }
    .nav-logo-wrap svg { width: 88px !important; height: 62px !important; }

    /* Pricing cards stack */
    .pricing-grid { grid-template-columns: 1fr !important; }
  }

  @media (min-width: 481px) and (max-width: 768px) {
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
  }

  /* Sticky mobile Book Now button */
  .mobile-sticky-book {
    display: none;
  }
  .desktop-sticky-cta {
    display: flex;
  }
  @media (max-width: 768px) {
    .desktop-sticky-cta { display: none !important; }
    .mobile-sticky-book {
      display: flex;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 200;
      background: var(--terracotta);
      color: var(--bone);
      border: none;
      padding: 16px 28px;
      padding-bottom: calc(16px + env(safe-area-inset-bottom));
      font-family: var(--font-body);
      font-size: 15.5px;
      font-weight: 600;
      letter-spacing: 0.04em;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.18);
    }
  }
`;

// ─── LOGO ────────────────────────────────────────────────────
function BrandLogo({ height = 56, light = false }) {
  const ratio = 700 / 1000;
  const w = height / ratio;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width={w} height={height} style={{ display: "block" }}>
      <rect width="1000" height="700" fill={light ? "transparent" : "#1a1816"}/>
      <circle cx="500" cy="240" r="150" fill={light ? "rgba(255,255,255,0.06)" : "#2d3d35"} fillOpacity={light ? 1 : 0.55}/>
      <circle cx="500" cy="240" r="150" fill="none" stroke="#c8856a" strokeWidth="5"/>
      <text x="500" y="298" fontFamily="Georgia, 'Times New Roman', serif" fontSize="160" fontWeight="700" textAnchor="middle" letterSpacing="-7">
        <tspan fill="#f0ece6">A</tspan><tspan fill="#c8856a">S</tspan>
      </text>
      <text x="500" y="476" fontFamily="Georgia, 'Times New Roman', serif" fontSize="58" fontWeight="700" fill="#f0ece6" textAnchor="middle" letterSpacing="4">ASSISTED</text>
      <text x="500" y="544" fontFamily="Georgia, 'Times New Roman', serif" fontSize="58" fontWeight="400" fontStyle="italic" fill="#c8856a" textAnchor="middle" letterSpacing="2">stretches</text>
    </svg>
  );
}

// ─── PRIMITIVES ─────────────────────────────────────────────
function Container({ children, style = {} }) {
  return <div className="container-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", ...style }}>{children}</div>;
}

function Section({ children, style = {}, dark = false, id }) {
  return (
    <section id={id} style={{ padding: "56px 0", background: dark ? "var(--forest-ink)" : "transparent", color: dark ? "var(--bone)" : "var(--forest-ink)", ...style }}>
      <Container>{children}</Container>
    </section>
  );
}

function SectionLabel({ text }) {
  return <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--deep-clay)", marginBottom: 14 }}>{text}</div>;
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: sub ? 12 : 24 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 400, lineHeight: 1.12, color: "inherit", letterSpacing: "-0.01em", maxWidth: 720 }}>{children}</h2>
      {sub && <p style={{ fontFamily: "var(--font-display)", fontSize: 21, lineHeight: 1.5, fontStyle: "italic", color: "var(--forest-ink)", marginTop: 12, maxWidth: 580 }}>{sub}</p>}
    </div>
  );
}

function PrimaryButton({ children, large, style = {}, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
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

// ─── GIFT CARD VISUAL ────────────────────────────────────────
function GiftCardVisual({ sessions = 1, width = "100%" }) {
  const cardW = 680;
  const cardH = 420;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${cardW} ${cardH}`} width={width} style={{ display: "block", borderRadius: 18, boxShadow: "0 24px 64px rgba(0,0,0,0.28)" }}>
      <defs>
        <linearGradient id="gcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1f2e27" />
          <stop offset="100%" stopColor="#111410" />
        </linearGradient>
        <radialGradient id="glowA" cx="20%" cy="30%" r="55%">
          <stop offset="0%" stopColor="#c8856a" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#c8856a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glowB" cx="85%" cy="75%" r="45%">
          <stop offset="0%" stopColor="#2d3d35" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#2d3d35" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* card background */}
      <rect width={cardW} height={cardH} rx="18" fill="url(#gcGrad)" />
      <rect width={cardW} height={cardH} rx="18" fill="url(#glowA)" />
      <rect width={cardW} height={cardH} rx="18" fill="url(#glowB)" />

      {/* decorative circles — echoing the logo mark */}
      <circle cx="510" cy="110" r="160" fill="none" stroke="#c8856a" strokeWidth="1" strokeOpacity="0.18" />
      <circle cx="510" cy="110" r="110" fill="none" stroke="#c8856a" strokeWidth="1" strokeOpacity="0.12" />
      <circle cx="510" cy="110" r="60"  fill="none" stroke="#c8856a" strokeWidth="1.5" strokeOpacity="0.22" />
      <circle cx="-30"  cy="330" r="120" fill="none" stroke="#c8856a" strokeWidth="0.8" strokeOpacity="0.1" />

      {/* thin top rule */}
      <line x1="44" y1="0" x2="44" y2={cardH} stroke="#c8856a" strokeWidth="3" strokeOpacity="0.55" />

      {/* logo mark — AS monogram */}
      <circle cx="106" cy="90" r="42" fill="#2d3d35" fillOpacity="0.55" />
      <circle cx="106" cy="90" r="42" fill="none" stroke="#c8856a" strokeWidth="2.5" />
      <text x="106" y="107" fontFamily="Georgia, 'Times New Roman', serif" fontSize="46" fontWeight="700" textAnchor="middle" letterSpacing="-2">
        <tspan fill="#f0ece6">A</tspan><tspan fill="#c8856a">S</tspan>
      </text>

      {/* wordmark */}
      <text x="162" y="83" fontFamily="Georgia, 'Times New Roman', serif" fontSize="20" fontWeight="700" fill="#f0ece6" letterSpacing="3">ASSISTED</text>
      <text x="162" y="107" fontFamily="Georgia, 'Times New Roman', serif" fontSize="20" fontWeight="400" fontStyle="italic" fill="#c8856a" letterSpacing="1">stretches</text>

      {/* tagline */}
      <text x="68" y="200" fontFamily="Georgia, 'Times New Roman', serif" fontSize="28" fontWeight="400" fontStyle="italic" fill="#f0ece6" fillOpacity="0.9" letterSpacing="0.5">
        &#x201C;The gift that keeps giving.&#x201D;
      </text>

      {/* session label */}
      <text x="68" y="290" fontFamily="Georgia, 'Times New Roman', serif" fontSize="14" fontWeight="400" fill="#c8856a" fillOpacity="0.8" letterSpacing="3">
        {sessions === 1 ? "ONE SESSION" : sessions === 5 ? "FIVE SESSIONS" : "TEN SESSIONS"}
      </text>
      <text x="68" y="318" fontFamily="Georgia, 'Times New Roman', serif" fontSize="36" fontWeight="400" fill="#f0ece6" letterSpacing="1">
        {sessions === 1 ? "$125" : sessions === 5 ? "$575" : "$1,000"}
      </text>

      {/* code placeholder */}
      <rect x="68" y="352" width="220" height="36" rx="6" fill="#ffffff" fillOpacity="0.07" />
      <text x="178" y="376" fontFamily="'Courier New', monospace" fontSize="15" fontWeight="700" fill="#c8856a" textAnchor="middle" letterSpacing="3">AS-XXXX-XXXX</text>

      {/* bottom label */}
      <text x={cardW - 68} y="392" fontFamily="Georgia, 'Times New Roman', serif" fontSize="11" fill="#f0ece6" fillOpacity="0.35" textAnchor="end" letterSpacing="2">VALID 6 MONTHS · www.assistedstretches.com</text>
    </svg>
  );
}

// ─── NAV ─────────────────────────────────────────────────────
function Nav({ currentPage, setPage, onBook, onContact, scrollRef }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLabel, setActiveLabel] = useState(null);

  const scrollToSection = (id) => {
    setPage(PAGES.home);
    setTimeout(() => {
      const container = scrollRef?.current;
      const el = document.getElementById(id);
      if (!el || !container) return;
      const navEl = document.querySelector('nav');
      const navHeight = navEl ? navEl.getBoundingClientRect().height : 0;
      const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - navHeight;
      container.scrollTo({ top, behavior: "smooth" });
    }, 150);
  };

  const navItems = [
    { label: "Home",        type: "page",   target: PAGES.home },
    { label: "Benefits",    type: "page",   target: PAGES.benefits },
    { label: "About",       type: "page",   target: PAGES.about },
    { label: "FAQs",        type: "page",   target: PAGES.faq },
    { label: "Contact",     type: "page",   target: PAGES.contact },
  ];

  const handleNav = (item) => {
    setMobileOpen(false);
    if (item.type === "page") { setActiveLabel(null); setPage(item.target); }
    else if (item.type === "scroll") { setActiveLabel(item.label); scrollToSection(item.target); }
    else if (item.type === "book") onBook();
    else if (item.type === "contact") { onContact(); }
  };

  const isActive = (item) =>
    (item.type === "page" && currentPage === item.target && activeLabel === null) ||
    (item.type === "scroll" && activeLabel === item.label);

  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#1A1816", borderBottom: "1px solid rgba(240,236,230,0.08)", transition: "all 0.35s ease" }}>
      <div style={{ width: "100%", padding: "2px 28px 2px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => setPage(PAGES.session)} className="nav-logo-wrap" style={{ cursor: "pointer", flexShrink: 0 }}>
          <BrandLogo height={224} />
        </div>
        <div style={{ display: "flex", gap: 36, alignItems: "center" }} className="desktop-nav">
          {navItems.map(item => (
            <button key={item.label} onClick={() => handleNav(item)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 400, color: isActive(item) ? "var(--terracotta)" : "rgba(240,236,230,0.72)", letterSpacing: "0.02em", padding: "4px 0", borderBottom: isActive(item) ? "1.5px solid var(--terracotta)" : "1.5px solid transparent", transition: "all 0.25s", whiteSpace: "nowrap" }}
              onMouseEnter={e => { if (!isActive(item)) e.currentTarget.style.color = "#F0ECE6"; }}
              onMouseLeave={e => { if (!isActive(item)) e.currentTarget.style.color = "rgba(240,236,230,0.72)"; }}
            >{item.label}</button>
          ))}
          <button onClick={() => onBook()} style={{ background: "var(--terracotta)", color: "var(--bone)", border: "none", padding: "11px 28px", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500, letterSpacing: "0.02em", transition: "background 0.25s" }} onMouseEnter={e => e.target.style.background = "var(--terracotta-hover)"} onMouseLeave={e => e.target.style.background = "var(--terracotta)"}>Book Now</button>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-btn" style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: "10px 8px", flexDirection: "column", gap: 5, alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 24, height: 2, background: "var(--bone)", borderRadius: 1, transition: "all 0.25s", transform: mobileOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
          <div style={{ width: 24, height: 2, background: "var(--bone)", borderRadius: 1, transition: "all 0.25s", opacity: mobileOpen ? 0 : 1 }} />
          <div style={{ width: 24, height: 2, background: "var(--bone)", borderRadius: 1, transition: "all 0.25s", transform: mobileOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
        </button>
      </div>
      {mobileOpen && (
        <div style={{ background: "#1A1816", borderTop: "1px solid rgba(240,236,230,0.08)", padding: "12px 24px 20px" }}>
          {navItems.map(item => (
            <button key={item.label} onClick={() => handleNav(item)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 17, padding: "15px 0", color: isActive(item) ? "var(--terracotta)" : "rgba(240,236,230,0.85)", borderBottom: "1px solid rgba(240,236,230,0.07)", letterSpacing: "0.01em" }}>{item.label}</button>
          ))}
          <button onClick={() => { setMobileOpen(false); onBook(); }} style={{ marginTop: 16, width: "100%", padding: "15px 0", background: "var(--terracotta)", color: "var(--bone)", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600, letterSpacing: "0.04em" }}>Book Now</button>
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
        <div className="trust-bar-inner" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 40px", padding: "22px 0" }}>
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
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ background: "var(--white)", border: "1px solid var(--sand)", borderRadius: 10, padding: "22px 28px", transition: "box-shadow 0.35s, transform 0.35s", boxShadow: h ? "0 10px 36px rgba(156,94,60,0.08)" : "none", transform: h ? "translateY(-3px)" : "none" }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", color: "var(--terracotta)", marginBottom: 10 }}>{benefit.tag}</div>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 400, lineHeight: 1.25, marginBottom: 10, color: "var(--forest-ink)" }}>{benefit.headline}</h3>
      <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--text-secondary)" }}>{benefit.body}</p>
    </div>
  );
}

function BenefitsSection() {
  return (
    <Section id="benefits" style={{ padding: "36px 0" }}>
      <SectionLabel text="What it does for you" />
      <SectionTitle sub="Whether you're chasing a personal best, recovering from desk life, or just want to move with more freedom. Here's what 60 minutes on the table can do.">
        Designed for people who sit too much, train too hard, or sleep too little.
      </SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 18 }}>
        {BENEFITS.map((b, i) => <BenefitCard key={i} benefit={b} />)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px 64px", marginTop: 16, padding: "14px 0", borderTop: "1px solid var(--sand)" }}>
        {[{ num: "+22%", label: "avg. hamstring range gain per session" }, { num: "94%", label: "of clients book again within 2 weeks" }, { num: "4.9/5", label: "across 180+ Google reviews" }].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--deep-clay)", lineHeight: 1, fontWeight: 400 }}>{s.num}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 5 }}>{s.label}</div>
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
      <div style={{ display: "flex", flexDirection: "column", marginTop: 22, maxWidth: 700 }}>
        {STEPS.map((step, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 16, padding: "18px 0", borderBottom: i < STEPS.length - 1 ? "1px solid var(--bone-dark)" : "none", alignItems: "start" }}>
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
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 18, fontWeight: 400 }}>How assisted stretching is different</h2>
        <div className="comparison-table-wrap" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, background: "var(--bone)", borderRadius: 10, overflow: "hidden", minWidth: 480 }}>
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
    <Section id="faq">
      <SectionLabel text="Common questions" />
      <SectionTitle>The questions everyone asks</SectionTitle>
      <div style={{ maxWidth: 660, marginTop: 18 }}>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ borderBottom: "1px solid var(--sand)" }}>
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "16px 0", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 15.5, fontWeight: 500, color: "var(--forest-ink)", textAlign: "left" }}>
              {faq.q}
              <span style={{ fontSize: 22, color: "var(--deep-clay)", transition: "transform 0.3s", transform: openIdx === i ? "rotate(45deg)" : "none", flexShrink: 0, marginLeft: 20, fontWeight: 300 }}>+</span>
            </button>
            <div style={{ maxHeight: openIdx === i ? 220 : 0, overflow: "hidden", transition: "max-height 0.4s ease" }}>
              <p style={{ fontSize: 18, lineHeight: 1.7, color: "var(--text-secondary)", paddingBottom: 22 }}>{faq.a}</p>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 22 }}>
        {reviews.map((r, i) => (
          <div key={i} style={{ background: "var(--bone)", borderRadius: 10, padding: 24, border: "1px solid var(--bone-dark)" }}>
            <div style={{ color: "var(--terracotta)", fontSize: 14, marginBottom: 12, letterSpacing: 3 }}>{"★".repeat(r.stars)}</div>
            <p style={{ fontSize: 19, lineHeight: 1.7, color: "var(--forest-ink)", fontFamily: "var(--font-display)", fontStyle: "italic", marginBottom: 14, fontWeight: 400 }}>"{r.text}"</p>
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
    <Section id="about" style={{ background: "var(--white)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }} className="bio-grid">
        <div style={{ borderRadius: 14, height: 320, overflow: "hidden", background: "var(--white)" }}>
          <img src="/practitioner.jpg" alt="Your practitioner" style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center center", filter: "grayscale(100%) contrast(1.05)" }} />
        </div>
        <div>
          <SectionLabel text="Your practitioner" />
          <p style={{ fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 1.45, marginBottom: 20, fontWeight: 400, fontStyle: "italic", color: "var(--forest-ink)" }}>
            Flexibility is the foundation of movement, yet it's one of the most overlooked areas in the health and fitness industry.
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 1.6, fontStyle: "italic", fontWeight: 400, color: "var(--text-secondary)" }}>
            Clients are constantly looking for ways to move better, recover faster, and prevent injuries. I am a Certified Stretch Practitioner and work hands-on with clients that want to integrate evidence based assisted stretching techniques into their health and wellness routine.
          </p>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--bone-dark)", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontStyle: "italic", color: "var(--deep-clay)", lineHeight: 1.5 }}>
              "Your hamstrings shorten when you sit. We lengthen them."
            </div>
          </div>
        </div>
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
      <div style={{ maxWidth: 660, marginTop: 14 }}>
        {items.map((item, i) => (
          <div key={i} style={{ borderBottom: "1px solid var(--sand)" }}>
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "16px 0", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 15.5, fontWeight: 500, color: "var(--forest-ink)", textAlign: "left" }}>
              "{item.q}"
              <span style={{ fontSize: 22, color: "var(--deep-clay)", transition: "transform 0.3s", transform: openIdx === i ? "rotate(45deg)" : "none", flexShrink: 0, marginLeft: 20, fontWeight: 300 }}>+</span>
            </button>
            <div style={{ maxHeight: openIdx === i ? 220 : 0, overflow: "hidden", transition: "max-height 0.4s ease" }}>
              <p style={{ fontSize: 18, lineHeight: 1.7, color: "var(--text-secondary)", paddingBottom: 22 }}>{item.a}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PricingLadder({ setPage, highlight, onBook }) {
  const plans = [
    { name: "Single Session", price: "$125", per: "$125", save: "—", validity: "Use anytime", includes: "1 × 60-min session", best: "Trying it out", page: PAGES.session, recommended: true },
  ];
  return (
    <Section>
      <SectionLabel text="Pricing" />
      <SectionTitle>Choose your path</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 22 }}>
        {plans.map((p, i) => {
          const isHL = highlight === p.page || (!highlight && p.recommended);
          return (
            <div key={i} style={{ background: isHL ? "var(--forest-ink)" : "var(--white)", color: isHL ? "var(--bone)" : "var(--forest-ink)", borderRadius: 14, padding: 28, border: isHL ? "none" : "1px solid var(--sand)", position: "relative", transition: "transform 0.3s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
              {p.recommended && <div style={{ position: "absolute", top: -11, left: 28, background: "var(--terracotta)", color: "var(--bone)", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", padding: "5px 16px", borderRadius: 20 }}>RECOMMENDED</div>}
              <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 8, opacity: 0.7 }}>{p.name}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 38, marginBottom: 4, fontWeight: 400 }}>{p.price}</div>
              <div style={{ fontSize: 13.5, opacity: 0.6, marginBottom: 18 }}>{p.per} per session</div>
              <div style={{ fontSize: 13.5, lineHeight: 2.1, borderTop: `1px solid ${isHL ? "rgba(242,237,228,0.15)" : "var(--bone-dark)"}`, paddingTop: 16 }}>
                <div><span style={{ opacity: 0.5 }}>Save:</span> {p.save}</div>
                <div><span style={{ opacity: 0.5 }}>Valid:</span> {p.validity}</div>
                <div><span style={{ opacity: 0.5 }}>Includes:</span> {p.includes}</div>
                <div><span style={{ opacity: 0.5 }}>Best for:</span> {p.best}</div>
              </div>
              <button onClick={() => onBook(PRODUCTS[i])} style={{ marginTop: 18, width: "100%", padding: "12px 0", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 500, background: "var(--terracotta)", color: "var(--bone)", border: "none", transition: "opacity 0.25s", letterSpacing: "0.02em" }} onMouseEnter={e => e.target.style.opacity = 0.88} onMouseLeave={e => e.target.style.opacity = 1}>Book {p.name}</button>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function Footer({ onGiftBook, setPage }) {
  return (
    <footer id="contact" style={{ background: "var(--forest-ink)", color: "var(--sand)", padding: "36px 0 28px" }}>
      <Container>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 44, marginBottom: 24 }} className="footer-grid">
          <div>
            <div className="footer-logo-wrap" style={{ marginBottom: 4, marginTop: -24, marginLeft: -20 }}>
              <BrandLogo height={208} light />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", marginBottom: 18, opacity: 0.4 }}>STUDIO</div>
            <div style={{ fontSize: 13.5, lineHeight: 2, opacity: 0.6 }}>
              <div>41 Barton Parade</div>
              <div>Balmoral. Brisbane 4171</div>
            </div>
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
function HomePage({ onBook, onGiftBook }) {
  usePageMeta({
    title: "Assisted Stretches — Brisbane's Dedicated Stretching Studio",
    description: "One-on-one assisted stretching in Brisbane. 60-minute PNF sessions for flexibility, recovery and pain relief. 4.9★ across 180+ reviews. Book from $125.",
    path: "",
  });
  useJsonLd([
    {
      "@type": ["HealthAndBeautyBusiness", "LocalBusiness"],
      "@id": "https://www.assistedstretches.com/#business",
      "name": "Assisted Stretches",
      "description": "Brisbane's dedicated one-on-one assisted stretching studio. 60-minute PNF stretching sessions for flexibility, recovery, and nervous system regulation. Not massage, not physio — a dedicated stretching practice.",
      "url": "https://www.assistedstretches.com",
      "email": "hello@assistedstretches.com",
      "image": "https://www.assistedstretches.com/session-hero.jpg",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "41 Barton Parade",
        "addressLocality": "Balmoral",
        "addressRegion": "QLD",
        "postalCode": "4171",
        "addressCountry": "AU"
      },
      "geo": { "@type": "GeoCoordinates", "latitude": -27.4694, "longitude": 153.0570 },
      "hasMap": "https://maps.google.com/?q=41+Barton+Parade,+Balmoral+QLD+4171",
      "openingHoursSpecification": [
        { "@type": "OpeningHoursSpecification", "dayOfWeek": "https://schema.org/Friday", "opens": "16:00", "closes": "18:00" },
        { "@type": "OpeningHoursSpecification", "dayOfWeek": "https://schema.org/Saturday", "opens": "08:00", "closes": "16:00" },
        { "@type": "OpeningHoursSpecification", "dayOfWeek": "https://schema.org/Sunday", "opens": "09:00", "closes": "12:00" }
      ],
      "priceRange": "$125–$1,000",
      "currenciesAccepted": "AUD",
      "paymentAccepted": "Credit Card, EFTPOS, HICAPS",
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "180", "bestRating": "5", "worstRating": "1" },
      "review": [
        { "@type": "Review", "reviewRating": { "@type": "Rating", "ratingValue": "5" }, "author": { "@type": "Person", "name": "Sarah K." }, "reviewBody": "I've had massage every fortnight for ten years and never felt the kind of release I got in 60 minutes here. Walked out two inches taller." },
        { "@type": "Review", "reviewRating": { "@type": "Rating", "ratingValue": "5" }, "author": { "@type": "Person", "name": "Marcus T." }, "reviewBody": "My hips have been a wreck since I started lifting heavy. Three sessions in and my squat depth is back." },
        { "@type": "Review", "reviewRating": { "@type": "Rating", "ratingValue": "5" }, "author": { "@type": "Person", "name": "Anna L." }, "reviewBody": "Went in skeptical, came out a convert. The take-home stretches alone are worth the price." }
      ],
      "areaServed": [
        { "@type": "City", "name": "Brisbane" },
        { "@type": "Place", "name": "Balmoral QLD 4171" },
        { "@type": "Place", "name": "Hawthorne QLD 4171" },
        { "@type": "Place", "name": "Norman Park QLD 4170" },
        { "@type": "Place", "name": "Bulimba QLD 4171" },
        { "@type": "Place", "name": "East Brisbane QLD 4169" },
        { "@type": "Place", "name": "Morningside QLD 4170" },
        { "@type": "Place", "name": "Camp Hill QLD 4152" }
      ],
      "serviceType": "Assisted Stretching",
      "keywords": "assisted stretching Brisbane, PNF stretching Brisbane, one-on-one stretching, flexibility studio Brisbane, stretch studio Balmoral, hamstring stretching, hip flexor release, back pain stretching Brisbane, recovery stretching, sports stretching Brisbane",
      "sameAs": ["https://www.instagram.com/assistedstretches", "https://www.facebook.com/assistedstretches"]
    },
    {
      "@type": "Service",
      "name": "Assisted Stretch Session — 60 Minutes",
      "description": "A one-on-one 60-minute assisted stretch session targeting hamstrings, hips, shoulders, and lower back using PNF technique. Includes postural assessment and take-home stretches.",
      "provider": { "@id": "https://www.assistedstretches.com/#business" },
      "areaServed": { "@type": "City", "name": "Brisbane" },
      "offers": { "@type": "Offer", "price": "125", "priceCurrency": "AUD", "availability": "https://schema.org/InStock", "url": "https://www.assistedstretches.com/#/session" }
    }
  ]);
  return (
    <>
      {/* Session pricing hero — top of page */}
      <Section style={{ paddingTop: 40, paddingBottom: 48 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "center" }} className="hero-grid">
          <div>
            <div className="fade-up" style={{ opacity: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: "0.16em", color: "var(--deep-clay)", marginBottom: 14 }}>ONE-ON-ONE · 60 MINUTES · BRISBANE STUDIO</div>
            </div>
            <h1 className="fade-up delay-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 400, lineHeight: 1.06, letterSpacing: "-0.02em", marginBottom: 18, opacity: 0, color: "var(--forest-ink)" }}>
              Stretch deeper than you can on your own.
            </h1>
            <p className="fade-up delay-2" style={{ fontFamily: "var(--font-display)", fontSize: 21, lineHeight: 1.5, fontStyle: "italic", color: "var(--forest-ink)", maxWidth: 460, marginBottom: 22, opacity: 0 }}>
              A guided 60-minute assisted stretch session using PNF technique that goes where solo stretching cannot — hamstrings, hips, shoulders, lower back.
            </p>
            <div className="fade-up delay-3" style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 20, opacity: 0 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--forest-ink)", fontWeight: 400 }}>$125</span>
            </div>
            <div className="fade-up delay-4" style={{ display: "flex", flexDirection: "column", gap: 12, opacity: 0 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <PrimaryButton large onClick={() => onBook(PRODUCTS[0])}>Book a session</PrimaryButton>
              </div>
            </div>
          </div>
          <div className="fade-in delay-3" style={{ opacity: 0 }}>
            <div style={{ borderRadius: 14, height: "clamp(260px, 50vw, 480px)", overflow: "hidden" }}>
              <img src="/session-hero.jpg" alt="Practitioner guiding a stretch" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", filter: "grayscale(100%) contrast(1.05)", transform: "scale(1.5) translateY(-22%)", transformOrigin: "center center" }} />
            </div>
          </div>
        </div>
      </Section>

      {/* What makes it different */}
      <Section dark>
        <div style={{ maxWidth: 720 }}>
          <SectionTitle>Not massage. Not physio. Not yoga.</SectionTitle>
          <p style={{ fontSize: 20, lineHeight: 1.8, opacity: 0.82, marginTop: 24 }}>
            Massage therapists work tissue with pressure. Physiotherapists rehabilitate injury. Yoga instructors teach you to move your own body.
          </p>
          <p style={{ fontSize: 20, lineHeight: 1.8, opacity: 0.82, marginTop: 16 }}>
            Assisted Stretches does something none of them do: a trained practitioner moves your body through targeted, PNF-guided stretches you physically cannot perform alone. It's not recovery-adjacent. It's not movement-adjacent.
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(15px, 1.875vw, 19.5px)", fontWeight: 400, fontStyle: "italic", opacity: 0.95, marginTop: 28, lineHeight: 1.5 }}>
            It's the missing category — a dedicated practice for restoring range, releasing deep tension, and giving your nervous system permission to let go.
          </p>
        </div>
      </Section>

      <ReviewsSection />
    </>
  );
}

function BenefitsPage({ onBook }) {
  usePageMeta({
    title: "Benefits of Assisted Stretching | Assisted Stretches Brisbane",
    description: "Discover what 60 minutes of assisted stretching can do — improved range, faster recovery, and nervous system release. Brisbane's dedicated stretching studio.",
    path: "benefits",
  });
  return (
    <>
      <BenefitsSection />
      <Section style={{ background: "var(--white)" }}>
        <div className="benefits-4col" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { icon: "◈", title: "Measurable range gains", body: "We test before and after every session. Most clients see improvement in hip, hamstring or shoulder range within the first hour." },
            { icon: "◉", title: "Faster recovery between sessions", body: "Assisted stretching after training helps clear lactic build-up and reduce next-day stiffness. Pair it with your weekly long run, lift, or ride." },
            { icon: "◎", title: "Nervous system reset", body: "Held stretches with the right pressure trigger the parasympathetic response — the same one behind deep sleep. Most clients leave calmer than they came in." },
            { icon: "✦", title: "Better posture over time", body: "Regular sessions release the hip flexors, chest, and spinal muscles that desk life shortens. Most clients notice posture changes within weeks." },
          ].map((item, i) => (
            <div key={i} style={{ background: "var(--bone)", border: "1px solid var(--bone-dark)", borderRadius: 12, padding: "28px 24px" }}>
              <div style={{ fontSize: 18, color: "var(--deep-clay)", marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400, marginBottom: 10 }}>{item.title}</div>
              <p style={{ fontSize: 18, lineHeight: 1.7, color: "var(--text-secondary)" }}>{item.body}</p>
            </div>
          ))}
        </div>
      </Section>
      <ReviewsSection />
    </>
  );
}

function AboutPage({ onBook }) {
  usePageMeta({
    title: "About Assisted Stretches | Brisbane's Dedicated Stretching Studio",
    description: "Founded on a simple observation — most people are tighter than they need to be. Meet the practitioner behind Assisted Stretches Brisbane.",
    path: "about",
  });
  return (
    <>
      <section className="about-hero-section" style={{ background: "var(--white)", height: "calc(100vh - 48px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 28px 0", height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }} className="hero-grid container-inner">
          <div>
            <SectionLabel text="About Assisted Stretches" />
            <h1 className="fade-up" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.2vw, 38px)", fontWeight: 400, lineHeight: 1.06, letterSpacing: "-0.02em", color: "var(--forest-ink)", marginBottom: 14, opacity: 0 }}>
              Founded on a simple observation.
            </h1>
            <p className="fade-up delay-1" style={{ fontSize: 21, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 10, opacity: 0 }}>
              Most people are tighter than they need to be, and nothing they're doing on their own is fixing it. Foam rollers don't reach deep enough. Massage feels good but doesn't change range or restore movement patterns. What works is someone trained taking your body through stretches you can't execute on yourself — using contract-relax cycles, precise positioning, and decades of combined technique.            </p>
            <p className="fade-up delay-2" style={{ fontSize: 21, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 24, opacity: 0 }}>
              We built Assisted Stretches for people who want results they can feel in their hips the next morning, their shoulders in their next workout, and their posture within weeks.
            </p>
            <div style={{ borderTop: "1px solid var(--bone-dark)", paddingTop: 20 }}>
              <SectionLabel text="Your practitioner" />
              <p style={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 1.5, fontStyle: "italic", color: "var(--forest-ink)", marginBottom: 10 }}>
                Flexibility is the foundation of movement, yet it's one of the most overlooked areas in the health and fitness industry.
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 21, lineHeight: 1.5, fontStyle: "italic", color: "var(--forest-ink)" }}>
                I am a Certified Stretch Practitioner working hands-on with clients who want to integrate evidence-based assisted stretching techniques into their health and wellness routine.
              </p>
            </div>
          </div>
          <div className="fade-in delay-3" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ borderRadius: 14, height: "min(35vh, 280px)", overflow: "hidden" }}>
              <img src="/about-section.jpg" alt="Practitioner guiding an upper body stretch" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 45%", filter: "grayscale(100%) contrast(1.05)" }} />
            </div>
            <div style={{ borderRadius: 14, height: "min(35vh, 280px)", overflow: "hidden", marginTop: 80 }}>
              <img src="/practitioner.jpg" alt="Your practitioner" style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center center", filter: "grayscale(100%) contrast(1.05)" }} />
            </div>
            <div style={{ textAlign: "center", marginTop: 12, fontFamily: "var(--font-display)", fontSize: 18, fontStyle: "italic", fontWeight: 700, color: "var(--forest-ink)", opacity: 0.75 }}>Coley</div>
          </div>
        </div>
      </section>
    </>
  );
}

function ContactPage() {
  usePageMeta({
    title: "Contact Assisted Stretches Brisbane",
    description: "Get in touch with Assisted Stretches Brisbane. We'll respond within one business day.",
    path: "contact",
  });
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("http://localhost:3001/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch { setStatus("error"); }
  };
  const inputStyle = { width: "100%", padding: "12px 14px", border: "1px solid var(--bone-dark)", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 14.5, background: "var(--white)", color: "var(--forest-ink)", boxSizing: "border-box", outline: "none" };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", color: "var(--text-secondary)", marginBottom: 6 };
  return (
    <Section style={{ paddingTop: 48 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "start" }} className="hero-grid contact-grid">
        {/* Left — info */}
        <div>
          <SectionLabel text="Get in touch" />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 400, lineHeight: 1.06, color: "var(--forest-ink)", marginBottom: 16 }}>Send us an enquiry.</h1>
          <p style={{ fontSize: 19.5, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 32 }}>We'll respond within one business day.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { icon: "✉", label: "Email", value: "hello@assistedstretches.com" },
              { icon: "◎", label: "Location", value: "41 Barton Parade, Balmoral QLD 4171" },
              { icon: "◆", label: "Response time", value: "Within one business day" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ color: "var(--deep-clay)", fontSize: 16, marginTop: 2 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "var(--text-secondary)", marginBottom: 2 }}>{item.label.toUpperCase()}</div>
                  <div style={{ fontSize: 15, color: "var(--forest-ink)" }}>{item.value}</div>
                </div>
              </div>
            ))}

            {/* Opening hours */}
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ color: "var(--deep-clay)", fontSize: 16, marginTop: 2 }}>◷</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "var(--text-secondary)", marginBottom: 8 }}>STUDIO OPENING HOURS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    { day: "Friday", hours: "4:00 pm – 6:00 pm" },
                    { day: "Saturday", hours: "8:00 am – 4:00 pm" },
                    { day: "Sunday", hours: "9:00 am – 12:00 pm" },
                  ].map(({ day, hours }) => (
                    <div key={day} style={{ display: "flex", gap: 12, fontSize: 15, color: "var(--forest-ink)" }}>
                      <span style={{ minWidth: 72, color: "var(--text-secondary)", fontSize: 14 }}>{day}</span>
                      <span>{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Right — form */}
        <div>
          {status === "sent" ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 400, color: "var(--forest-ink)", marginBottom: 12 }}>Message sent.</h2>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>We'll be in touch at {form.email} shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div><label style={labelStyle}>NAME *</label><input style={inputStyle} value={form.name} onChange={set("name")} placeholder="Your name" required /></div>
              <div><label style={labelStyle}>EMAIL *</label><input style={inputStyle} type="email" value={form.email} onChange={set("email")} placeholder="your@email.com" required /></div>
              <div><label style={labelStyle}>PHONE</label><input style={inputStyle} type="tel" value={form.phone} onChange={set("phone")} placeholder="Optional" /></div>
              <div><label style={labelStyle}>MESSAGE *</label><textarea style={{ ...inputStyle, resize: "vertical", minHeight: 120 }} value={form.message} onChange={set("message")} placeholder="How can we help?" required /></div>
              {status === "error" && <p style={{ fontSize: 13, color: "#c0392b", margin: 0 }}>Something went wrong — please try again or email hello@assistedstretches.com.</p>}
              <button type="submit" disabled={status === "sending"} style={{ background: "var(--terracotta)", color: "var(--bone)", border: "none", padding: "14px 0", borderRadius: 6, cursor: status === "sending" ? "default" : "pointer", fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 500, opacity: status === "sending" ? 0.7 : 1 }}>
                {status === "sending" ? "Sending…" : "Send enquiry"}
              </button>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}

function SessionPage({ setPage, onBook, onGiftBook }) {
  usePageMeta({
    title: "Book a 60-Minute Assisted Stretch Session — $125 | Assisted Stretches Brisbane",
    description: "A guided 60-minute assisted stretch session targeting hamstrings, hips, shoulders & lower back using PNF technique. $125. First-session money-back guarantee. Brisbane studio.",
    path: "session",
  });
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Assisted Stretch Session — 60 Minutes",
    "description": "A one-on-one 60-minute assisted stretch session targeting hamstrings, hips, shoulders, and lower back using PNF techniques.",
    "provider": { "@type": "HealthAndBeautyBusiness", "name": "Assisted Stretches", "address": { "@type": "PostalAddress", "addressLocality": "Brisbane", "addressRegion": "QLD", "addressCountry": "AU" } },
    "areaServed": { "@type": "City", "name": "Brisbane" },
    "offers": { "@type": "Offer", "price": "125", "priceCurrency": "AUD", "availability": "https://schema.org/InStock" },
  });
  return (
    <>
      <MessagingPillars />
      <HowItWorksSection />
      <FAQSection />
      <PractitionerBio />
      <ReviewsSection />
      <ObjectionHandlers />
    </>
  );
}

function FivePackPage({ setPage, onBook }) {
  usePageMeta({
    title: "5-Session Assisted Stretching Pack — $575 ($115/session) | Assisted Stretches Brisbane",
    description: "Five 60-minute assisted stretch sessions at $115 each. Save $50 vs single sessions. Valid 6 months. Health fund rebates available. Brisbane studio.",
    path: "5-pack",
  });
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "5-Session Assisted Stretching Pack",
    "description": "Five one-on-one 60-minute assisted stretch sessions. PNF technique targeting hamstrings, hips, shoulders, and lower back.",
    "provider": { "@type": "HealthAndBeautyBusiness", "name": "Assisted Stretches", "address": { "@type": "PostalAddress", "addressLocality": "Brisbane", "addressRegion": "QLD", "addressCountry": "AU" } },
    "areaServed": { "@type": "City", "name": "Brisbane" },
    "offers": { "@type": "Offer", "price": "575", "priceCurrency": "AUD", "availability": "https://schema.org/InStock" },
  });
  return (
    <>
      <Section style={{ paddingTop: 40, paddingBottom: 48 }}>
        <div style={{ maxWidth: 660 }}>
          <div className="fade-up" style={{ opacity: 0 }}><div style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: "0.16em", color: "var(--deep-clay)", marginBottom: 14 }}>FIVE SESSIONS · 6-MONTH VALIDITY · SAVE $50</div></div>
          <h1 className="fade-up delay-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 5vw, 50px)", fontWeight: 400, lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 18, opacity: 0 }}>Five sessions. The habit takes hold.</h1>
          <p className="fade-up delay-2" style={{ fontSize: 15.5, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 22, opacity: 0 }}>Five 60-minute assisted stretch sessions, used at your pace over six months. The format most regulars start with — long enough to feel real change, short enough to commit to today.</p>
          <div className="fade-up delay-3" style={{ marginBottom: 20, opacity: 0 }}><span style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--forest-ink)", fontWeight: 400 }}>$575</span><span style={{ fontSize: 14.5, color: "var(--text-secondary)", marginLeft: 14 }}>$115 per session · Save $50</span></div>
          <div className="fade-up delay-4" style={{ display: "flex", gap: 12, flexWrap: "wrap", opacity: 0 }}><PrimaryButton large onClick={() => onBook(PRODUCTS[1])}>Buy 5-pack — $575</PrimaryButton><SecondaryButton onClick={() => setPage(PAGES.tenPack)}>Compare with 10-pack</SecondaryButton></div>
        </div>
      </Section>
      <Section style={{ background: "var(--white)" }}>
        <div style={{ maxWidth: 560, background: "var(--bone)", border: "1px solid var(--bone-dark)", borderRadius: 12, padding: 32 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", color: "var(--deep-clay)", marginBottom: 14 }}>WHY MOST CLIENTS PICK THIS PACK</div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 21, lineHeight: 1.45, fontWeight: 400 }}>A single session shows you what's possible. Five sessions makes the change stick.</p>
          <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginTop: 10, lineHeight: 1.65 }}>Most regulars start here, then graduate to the 10-pack once they realise they're coming weekly anyway.</p>
        </div>
      </Section><BenefitsSection /><HowItWorksSection /><FAQSection /><ReviewsSection /><ObjectionHandlers />
    </>
  );
}

function TenPackPage({ setPage, onBook }) {
  usePageMeta({
    title: "10-Session Assisted Stretching Pack — $1,000 ($100/session) | Assisted Stretches Brisbane",
    description: "Ten 60-minute assisted stretch sessions at $100 each. Save $250 vs single sessions. Our best per-session rate. Valid 12 months. Brisbane studio.",
    path: "10-pack",
  });
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "10-Session Assisted Stretching Pack",
    "description": "Ten one-on-one 60-minute assisted stretch sessions. Best per-session value. PNF technique targeting hamstrings, hips, shoulders, and lower back.",
    "provider": { "@type": "HealthAndBeautyBusiness", "name": "Assisted Stretches", "address": { "@type": "PostalAddress", "addressLocality": "Brisbane", "addressRegion": "QLD", "addressCountry": "AU" } },
    "areaServed": { "@type": "City", "name": "Brisbane" },
    "offers": { "@type": "Offer", "price": "1000", "priceCurrency": "AUD", "availability": "https://schema.org/InStock" },
  });
  return (
    <>
      <Section style={{ paddingTop: 40, paddingBottom: 48 }}>
        <div style={{ maxWidth: 660 }}>
          <div className="fade-up" style={{ opacity: 0 }}><div style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: "0.16em", color: "var(--deep-clay)", marginBottom: 14 }}>TEN SESSIONS · 12-MONTH VALIDITY · SAVE $250</div></div>
          <h1 className="fade-up delay-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 5vw, 50px)", fontWeight: 400, lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 18, opacity: 0 }}>Ten sessions. The best per-session price we offer.</h1>
          <p className="fade-up delay-2" style={{ fontSize: 15.5, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 22, opacity: 0 }}>Ten 60-minute assisted stretch sessions, used at your pace over twelve months. For people who already know how this feels and want it as part of life.</p>
          <div className="fade-up delay-3" style={{ marginBottom: 20, opacity: 0 }}><span style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--forest-ink)", fontWeight: 400 }}>$1,000</span><span style={{ fontSize: 14.5, color: "var(--text-secondary)", marginLeft: 14 }}>$100 per session · Save $250</span></div>
          <div className="fade-up delay-4" style={{ display: "flex", gap: 12, flexWrap: "wrap", opacity: 0 }}><PrimaryButton large onClick={() => onBook(PRODUCTS[1])}>Buy 10-pack — $1,000</PrimaryButton><SecondaryButton onClick={() => setPage(PAGES.session)}>Book a single session</SecondaryButton></div>
        </div>
      </Section>
      <Section style={{ background: "var(--white)" }}>
        <div style={{ maxWidth: 560, background: "var(--bone)", border: "1px solid var(--bone-dark)", borderRadius: 12, padding: 44 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", color: "var(--deep-clay)", marginBottom: 18 }}>THE LOYALTY PACK</div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1.45, fontWeight: 400 }}>Ten sessions at $100 each. The best per-session rate we offer.</p>
          <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginTop: 14, lineHeight: 1.65 }}>Twelve months to use them — plenty of room for life.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 36 }}>
          {[{ icon: "◈", text: "Priority booking — schedule 6 weeks ahead" }, { icon: "◉", text: "Credits valid 12 months from purchase" }].map((perk, i) => (
            <div key={i} style={{ background: "var(--bone)", border: "1px solid var(--bone-dark)", borderRadius: 8, padding: "20px 24px", display: "flex", gap: 14, alignItems: "start" }}>
              <span style={{ color: "var(--deep-clay)", fontSize: 14 }}>{perk.icon}</span>
              <span style={{ fontSize: 14, lineHeight: 1.55 }}>{perk.text}</span>
            </div>
          ))}
        </div>
      </Section><BenefitsSection /><HowItWorksSection /><FAQSection /><ReviewsSection /><ObjectionHandlers />
    </>
  );
}

function GiftCardsPage({ setPage, onBook, onGiftBook }) {
  usePageMeta({
    title: "Assisted Stretching Gift Cards — From $125 | Assisted Stretches Brisbane",
    description: "Give assisted stretching. Gift cards for 1 session from $125. Digital delivery, instant. Valid 6 months. The gift that keeps giving.",
    path: "gift-cards",
  });
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Assisted Stretching Gift Cards",
    "description": "Digital gift cards for one-on-one assisted stretching sessions in Brisbane. Available as a single session. Valid 6 months.",
    "provider": { "@type": "HealthAndBeautyBusiness", "name": "Assisted Stretches", "address": { "@type": "PostalAddress", "addressLocality": "Brisbane", "addressRegion": "QLD", "addressCountry": "AU" } },
    "offers": { "@type": "AggregateOffer", "lowPrice": "125", "highPrice": "1000", "priceCurrency": "AUD" },
  });
  const [sel, setSel] = useState(0);
  const denoms = [
    { sessions: 1, price: "$125", saving: "—", tagline: "One hour where the world stops.", desc: "A single 60-minute session. The right gift when you're not sure if they'll like it. They will." },
  ];
  return (
    <>
      <section style={{ background: "var(--bone)", height: "70vh" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 28px 0", height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "start" }} className="hero-grid">
          <div>
            <div className="fade-up" style={{ opacity: 0 }}><div style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: "0.16em", color: "var(--deep-clay)", marginBottom: 14 }}>GIFT CARDS · DIGITAL DELIVERY · INSTANT</div></div>
            <h1 className="fade-up delay-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 400, lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 18, opacity: 0 }}>Give the feeling of a body that finally lets go.</h1>
            <p className="fade-up delay-2" style={{ fontSize: 19.5, lineHeight: 1.7, color: "var(--text-secondary)", maxWidth: 460, marginBottom: 22, opacity: 0 }}>A gift card for a 60-minute assisted stretch session. Delivered the moment you buy it, redeemable for six months.</p>
            <div className="fade-up delay-3" style={{ marginBottom: 20, opacity: 0 }}><span style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--forest-ink)", fontWeight: 400 }}>From $125</span><div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 6 }}>Includes a personal message</div></div>
            <div className="fade-up delay-4" style={{ display: "flex", gap: 12, flexWrap: "wrap", opacity: 0 }}><PrimaryButton large onClick={() => onGiftBook()}>Choose a gift card</PrimaryButton></div>
          </div>
          <div className="fade-in delay-3" style={{ opacity: 0, height: "calc(100% - 20px)" }}>
            <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
              <GiftCardVisual sessions={1} />
            </div>
          </div>
        </div>
      </section>
      <Section style={{ background: "var(--white)" }}>
        <SectionLabel text="Choose a denomination" />
        <SectionTitle>Pick the perfect gift</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14, marginTop: 22 }}>
          {denoms.map((d, i) => {
            const active = sel === i;
            return (
              <div key={i} onClick={() => setSel(i)} style={{ background: active ? "var(--forest-ink)" : "var(--bone)", color: active ? "var(--bone)" : "var(--forest-ink)", borderRadius: 12, padding: 24, cursor: "pointer", border: active ? "none" : "1px solid var(--bone-dark)", transition: "all 0.3s" }}>
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
      <Section style={{ background: "var(--white)" }}>
        <SectionLabel text="Who it's for" />
        <SectionTitle>Most gifts get used once. This one changes how someone moves.</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14, marginTop: 22 }}>
          {[
            { tag: "For the person who has everything", text: "The chronic over-shoppers, the hard-to-buy-for partner, the parent who waves off birthdays. They don't need another candle. They need an hour where someone takes care of them." },
            { tag: "For the person who won't look after themselves", text: "Athletes who skip recovery. Desk workers who never stop. Parents running on empty. A gift card removes the excuses — it's booked, it's paid for, all they have to do is turn up." },
            { tag: "For the person you actually love", text: "A 10-pack is a year of being looked after. A 5-pack is a real reset. Even a single session lands harder than a bunch of flowers — because they remember it for a week." },
          ].map((b, i) => (
            <div key={i} style={{ background: i === 1 ? "var(--forest-ink)" : "var(--bone)", color: i === 1 ? "var(--bone)" : "var(--forest-ink)", borderRadius: 12, padding: 32, border: i === 1 ? "none" : "1px solid var(--bone-dark)" }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, opacity: 0.6 }}>{b.tag}</div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontStyle: "italic", opacity: 0.85, margin: "14px 0", lineHeight: 1.45 }}>{b.text}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section>
        <SectionLabel text="How gifting works" />
        <SectionTitle>Four steps. Two minutes.</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 22 }}>
          {[{ step: "1", title: "Choose", desc: "Pick a denomination — one, five, or ten sessions. Add a recipient's name and email." }, { step: "2", title: "Personalise", desc: "Add a personal message. Enough to be meaningful, short enough to actually write." }, { step: "3", title: "Deliver", desc: "The digital gift card is emailed instantly to the recipient with their unique code." }, { step: "4", title: "Redeem", desc: "They book online with the code. Valid for twelve months from purchase. We send reminders before it expires." }].map((s, i) => (
            <div key={i} style={{ background: "var(--white)", border: "1px solid var(--bone-dark)", borderRadius: 10, padding: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid var(--deep-clay)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 17, color: "var(--deep-clay)", marginBottom: 12, fontWeight: 400 }}>{s.step}</div>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 8, fontWeight: 400 }}>{s.title}</h4>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>
      <ReviewsSection reviews={GIFT_REVIEWS} title="Gifts that landed." sub="What givers say after they bought a card." />
    </>
  );
}

// ─── STICKY CTA ──────────────────────────────────────────────
function StickyCTA({ page, onBook }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = document.querySelector('.app-scroll-container');
    if (!el) return;
    const handler = () => setVisible(el.scrollTop > 300);
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Desktop: only show on specific product pages
  const desktopLabels = { [PAGES.session]: "Book a session", [PAGES.tenPack]: "Buy 10-pack — $1,000", [PAGES.faq]: "Book a session" };
  const desktopLabel = desktopLabels[page];
  const productIdx = page === PAGES.tenPack ? 1 : 0;

  return (
    <>
      {/* Desktop sticky CTA — specific pages only */}
      {desktopLabel && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(242,237,228,0.96)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--sand)", padding: "14px 28px", display: "flex", justifyContent: "center", zIndex: 99, transform: visible ? "translateY(0)" : "translateY(100%)", transition: "transform 0.35s ease" }} className="desktop-sticky-cta">
          <PrimaryButton onClick={() => onBook(PRODUCTS[productIdx])}>{desktopLabel}</PrimaryButton>
        </div>
      )}
      {/* Mobile sticky Book Now — all pages, shows after scroll */}
      <button
        className="mobile-sticky-book"
        onClick={() => onBook(PRODUCTS[productIdx])}
        style={{ transform: visible ? "translateY(0)" : "translateY(100%)", transition: "transform 0.35s ease" }}
      >
        Book a Session — $125
        <span style={{ fontSize: 18, opacity: 0.85 }}>→</span>
      </button>
    </>
  );
}

// ─── FAQ CHATBOT ─────────────────────────────────────────────
const CHAT_STEPS = [
  { field: "question", bot: "Hi! What's your question about assisted stretching?" },
  { field: "name",     bot: "Got it — what's your name?" },
  { field: "email",    bot: (name) => `Nice to meet you, ${name}. What's your email so we can reply?` },
];

function FaqChat() {
  const [messages, setMessages]   = useState([{ from: "bot", text: CHAT_STEPS[0].bot }]);
  const [input, setInput]         = useState("");
  const [step, setStep]           = useState(0);
  const [data, setData]           = useState({});
  const [done, setDone]           = useState(false);
  const [sending, setSending]     = useState(false);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const addMessages = (msgs) => setMessages(prev => [...prev, ...msgs]);

  const handleSend = async () => {
    const val = input.trim();
    if (!val || done || sending) return;
    setInput("");

    const newData = { ...data, [CHAT_STEPS[step].field]: val };
    setData(newData);
    const userMsg = { from: "user", text: val };

    if (step < CHAT_STEPS.length - 1) {
      const nextStep = CHAT_STEPS[step + 1];
      const botText = typeof nextStep.bot === "function" ? nextStep.bot(newData.name || val) : nextStep.bot;
      addMessages([userMsg, { from: "bot", text: botText }]);
      setStep(s => s + 1);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // Final step — send via Resend
      setSending(true);
      addMessages([userMsg]);
      try {
        const res = await fetch("http://localhost:3001/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:    newData.name,
            email:   val,
            message: `Question: ${newData.question}`,
          }),
        });
        const json = await res.json();
        if (json.success) {
          addMessages([{ from: "bot", text: `Thanks, ${newData.name}! Your question has been sent — we'll reply to ${val} within one business day.` }]);
        } else {
          addMessages([{ from: "bot", text: "Sorry, something went wrong sending your message. Please try the Contact page instead." }]);
        }
      } catch {
        addMessages([{ from: "bot", text: "Sorry, something went wrong. Please try the Contact page instead." }]);
      }
      setDone(true);
      setSending(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const bubbleStyle = (from) => ({
    maxWidth: "80%", padding: "11px 16px", borderRadius: from === "bot" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
    background: from === "bot" ? "rgba(255,255,255,0.1)" : "var(--terracotta)",
    color: "var(--bone)", fontSize: 14.5, lineHeight: 1.6,
    alignSelf: from === "bot" ? "flex-start" : "flex-end",
  });

  return (
    <div style={{ marginTop: 56, background: "var(--forest-ink)", borderRadius: 16, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--terracotta)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💬</div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--bone)", fontWeight: 400 }}>Still have a question?</div>
          <div style={{ fontSize: 12, color: "var(--sand)", opacity: 0.6, marginTop: 1 }}>We'll email you back within one business day</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ padding: "20px 20px 12px", minHeight: 140, maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start" }}>
            <div style={bubbleStyle(msg.from)}>{msg.text}</div>
          </div>
        ))}
        {sending && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ ...bubbleStyle("bot"), opacity: 0.5 }}>
              <span style={{ letterSpacing: 2 }}>···</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!done ? (
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 10, alignItems: "center" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={step === 0 ? "Type your question…" : step === 1 ? "Your name…" : "Your email…"}
            type={step === 2 ? "email" : "text"}
            style={{
              flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8, padding: "10px 14px", color: "var(--bone)", fontSize: 14.5,
              fontFamily: "var(--font-body)", outline: "none",
            }}
          />
          <button onClick={handleSend} disabled={!input.trim()} style={{
            background: input.trim() ? "var(--terracotta)" : "rgba(255,255,255,0.1)",
            border: "none", borderRadius: 8, padding: "10px 18px", cursor: input.trim() ? "pointer" : "default",
            color: "var(--bone)", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-body)",
            transition: "background 0.2s", whiteSpace: "nowrap",
          }}>
            Send →
          </button>
        </div>
      ) : (
        <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 13, color: "var(--sand)", opacity: 0.6, textAlign: "center" }}>
          Message sent · we'll be in touch soon
        </div>
      )}
    </div>
  );
}

// ─── CONTACT MODAL ───────────────────────────────────────────
function ContactModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  if (!isOpen) return null;

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("http://localhost:3001/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Server error");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", border: "1px solid var(--bone-dark)",
    borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 14.5,
    background: "var(--bone)", color: "var(--forest-ink)", boxSizing: "border-box",
    outline: "none",
  };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", color: "var(--text-secondary)", marginBottom: 6 };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(26,24,22,0.72)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "var(--bone)", borderRadius: 14, padding: "44px 40px", maxWidth: 480, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.28)" }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 20, background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "var(--text-secondary)", lineHeight: 1 }}>×</button>

        {status === "sent" ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>✓</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400, color: "var(--forest-ink)", marginBottom: 12 }}>Message sent.</h2>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>We'll be in touch at {form.email} shortly.</p>
            <button onClick={onClose} style={{ marginTop: 28, background: "var(--terracotta)", color: "var(--bone)", border: "none", padding: "12px 32px", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500 }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", color: "var(--deep-clay)", marginBottom: 14 }}>GET IN TOUCH</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 400, color: "var(--forest-ink)", marginBottom: 8, lineHeight: 1.15 }}>Send us an enquiry.</h2>
            <p style={{ fontSize: 17.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 28 }}>We'll respond within one business day.</p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={labelStyle}>NAME *</label>
                <input style={inputStyle} value={form.name} onChange={set("name")} placeholder="Your name" required />
              </div>
              <div>
                <label style={labelStyle}>EMAIL *</label>
                <input style={inputStyle} type="email" value={form.email} onChange={set("email")} placeholder="your@email.com" required />
              </div>
              <div>
                <label style={labelStyle}>PHONE</label>
                <input style={inputStyle} type="tel" value={form.phone} onChange={set("phone")} placeholder="Optional" />
              </div>
              <div>
                <label style={labelStyle}>MESSAGE *</label>
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 110 }} value={form.message} onChange={set("message")} placeholder="How can we help?" required />
              </div>
              {status === "error" && <p style={{ fontSize: 13, color: "#c0392b", margin: 0 }}>Something went wrong — please try again or email us directly at hello@assistedstretches.com.</p>}
              <button type="submit" disabled={status === "sending"} style={{ background: "var(--terracotta)", color: "var(--bone)", border: "none", padding: "13px 0", borderRadius: 6, cursor: status === "sending" ? "default" : "pointer", fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 500, opacity: status === "sending" ? 0.7 : 1, transition: "opacity 0.2s" }}>
                {status === "sending" ? "Sending…" : "Send enquiry"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── FAQ PAGE ────────────────────────────────────────────────
function FaqPage({ onBook }) {
  usePageMeta({
    title: "Assisted Stretching FAQ — What to Expect, Pricing & More | Assisted Stretches Brisbane",
    description: "Everything you need to know about assisted stretching — technique, frequency, cost, what to wear, and health fund cover. Answered by our Brisbane practitioners.",
    path: "faq",
  });
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": DETAILED_FAQS.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": { "@type": "Answer", "text": faq.a.replace(/\n\n/g, " ") },
    })),
  });
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <Section style={{ paddingTop: 40 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 48, alignItems: "start", maxWidth: 1200 }}>
        {/* Left — questions */}
        <div>
          <div className="fade-up" style={{ opacity: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: "0.16em", color: "var(--deep-clay)", marginBottom: 14 }}>FREQUENTLY ASKED QUESTIONS</div>
          </div>
          <h1 className="fade-up delay-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 400, lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 10, opacity: 0 }}>
            Everything you want to know.
          </h1>
          <p className="fade-up delay-2" style={{ fontSize: 19.5, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 32, opacity: 0, maxWidth: 560 }}>
            Answers to the most common questions about assisted stretching — what it is, who it's for, and what to expect.
          </p>
          {DETAILED_FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: "1px solid var(--sand)" }}>
              <button onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", padding: "16px 0", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 15.5, fontWeight: 500, color: "var(--forest-ink)", textAlign: "left", gap: 20 }}>
                <span>{faq.q}</span>
                <span style={{ fontSize: 24, color: "var(--deep-clay)", transition: "transform 0.3s", transform: openIdx === i ? "rotate(45deg)" : "none", flexShrink: 0, fontWeight: 300, lineHeight: 1, marginTop: 2 }}>+</span>
              </button>
              <div style={{ maxHeight: openIdx === i ? 800 : 0, overflow: "hidden", transition: "max-height 0.5s ease" }}>
                <div style={{ paddingBottom: 28 }}>
                  {faq.a.split("\n\n").map((para, j) => (
                    <p key={j} style={{ fontSize: 18.75, lineHeight: 1.75, color: "var(--text-secondary)", marginBottom: j < faq.a.split("\n\n").length - 1 ? 16 : 0 }}>{para}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Right — chat box */}
        <div style={{ position: "sticky", top: 24 }}>
          <FaqChat />
        </div>
      </div>
    </Section>
  );
}

// ─── HASH ROUTING ────────────────────────────────────────────
function getPageFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return Object.values(PAGES).includes(hash) ? hash : PAGES.home;
}

// ─── APP ─────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(getPageFromHash);
  const [bookingConfig, setBookingConfig] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);
  const scrollRef = useRef(null);

  const changePage = (p) => {
    setPage(p);
    window.location.hash = p === PAGES.home ? "" : `/${p}`;
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, 0);
  };

  // Handle browser back / forward
  useEffect(() => {
    const onHash = () => setPage(getPageFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, 0);
  }, [page]);
  const openBooking = (product, initialStep) => setBookingConfig({ product: product || PRODUCTS[0], initialStep });
  const openGiftCardBooking = () => setBookingConfig({ product: null, initialStep: 3 });
  const closeBooking = () => setBookingConfig(null);
  return (
    <>
      <style>{globalStyles}</style>
      <div ref={scrollRef} className="app-scroll-container" style={{ height: "100vh", overflow: "auto", background: "var(--bone)" }}>
        <Nav currentPage={page} setPage={changePage} onBook={openBooking} onContact={() => setContactOpen(true)} scrollRef={scrollRef} />
        {page === PAGES.home && <HomePage onBook={openBooking} onGiftBook={openGiftCardBooking} />}
        {page === PAGES.benefits && <BenefitsPage onBook={openBooking} />}
        {page === PAGES.about && <AboutPage onBook={openBooking} />}
        {page === PAGES.contact && <ContactPage />}
        {page === PAGES.session && <SessionPage setPage={changePage} onBook={openBooking} onGiftBook={openGiftCardBooking} />}
        {page === PAGES.fivePack && <SessionPage setPage={changePage} onBook={openBooking} />}
        {page === PAGES.tenPack && <TenPackPage setPage={changePage} onBook={openBooking} />}
        {page === PAGES.faq && <FaqPage onBook={openBooking} />}
        {page !== PAGES.contact && <Footer onGiftBook={openGiftCardBooking} setPage={changePage} />}
        <StickyCTA page={page} onBook={openBooking} />
      </div>
      <BookingModal
        isOpen={!!bookingConfig}
        onClose={closeBooking}
        initialProduct={bookingConfig?.product}
        initialStep={bookingConfig?.initialStep}
      />
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
