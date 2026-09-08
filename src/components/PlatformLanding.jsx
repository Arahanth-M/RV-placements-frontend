import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  FaBook,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChartLine,
  FaCode,
  FaComments,
  FaFileAlt,
  FaFolderOpen,
  FaGraduationCap,
  FaMapMarkedAlt,
  FaMoon,
  FaQuestionCircle,
  FaRobot,
  FaTrophy,
  FaUserFriends,
  FaSun,
} from "react-icons/fa";
import { GENERAL_BASE } from "../constants/tenant.js";
import { normalizeCompanyNameKey } from "../utils/companyLogoDomains";
import { companyAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import { useTheme } from "../utils/ThemeContext";
import { canAccessRvceTenant, getAppHomePathForUser } from "../utils/collegeScope.js";
import CompanyLogo from "./CompanyLogo";
import { PageHeroFontStyles } from "./PageBackNav.jsx";

const MotionDiv = motion.div;
const MotionP = motion.p;
const MotionH1 = motion.h1;

const PAGE_SECTION_LABEL_STYLE = {
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  color: "#6366F1",
  marginBottom: "0.5rem",
};

const PAGE_SECTION_TITLE_STYLE = {
  fontFamily: "'DM Serif Display', Georgia, serif",
  fontSize: "clamp(1.85rem, 4.2vw, 2.85rem)",
  fontWeight: 400,
  lineHeight: 1.15,
  marginBottom: "0.65rem",
};

const PAGE_SECTION_SUBTITLE_STYLE = {
  fontSize: "16px",
  color: "var(--text-secondary)",
  lineHeight: 1.6,
  margin: "0 auto",
  maxWidth: "620px",
};

const HERO_HIGHLIGHTS = [
  { icon: FaRobot, label: "AI interviews by company & role" },
  { icon: FaMapMarkedAlt, label: "PrepPath that cuts the noise" },
  { icon: FaUserFriends, label: "Peer mocks on your campus" },
  { icon: FaTrophy, label: "Daily challenges vs peers" },
  { icon: FaFileAlt, label: "Resume builder with ATS" },
  { icon: FaCalendarAlt, label: "Drive calendar & reminders" },
];

const FALLBACK_COMPANIES = [
  { name: "Google" },
  { name: "Microsoft" },
  { name: "Amazon" },
  { name: "Goldman Sachs" },
  { name: "Qualcomm" },
  { name: "Texas Instruments" },
  { name: "Cisco" },
  { name: "Oracle" },
  { name: "Adobe" },
  { name: "Intel" },
  { name: "Samsung" },
  { name: "Deloitte" },
  { name: "NVIDIA" },
  { name: "IBM" },
  { name: "Accenture" },
  { name: "Walmart" },
];

const INSTITUTIONS = [
  {
    name: "RV College of Engineering",
    short: "RVCE",
    city: "Bengaluru",
    domain: "rvce.edu.in",
  },
  {
    name: "RV Institute of Technology and Management",
    short: "RVITM",
    city: "Bengaluru",
    domain: "rvitm.edu.in",
  },
];

const CHALLENGES = [
  {
    icon: FaBuilding,
    title: "Companies feel like a black box",
    text: "Roles, rounds, and what to prepare are scattered across chats and random blogs — never in one place.",
    fixes: ["Company insights", "Coding Qs & experiences", "Interview stories"],
  },
  {
    icon: FaQuestionCircle,
    title: "Prep without a clear path",
    text: "Students grind hard but don’t know what to do next for a target company, role, or week.",
    fixes: ["PrepPath", "Curated resources", "Must-do topics"],
  },
  {
    icon: FaComments,
    title: "Practice alone, freeze in the real round",
    text: "No company-specific mocks, no peer practice, and HR answers that fall apart under pressure.",
    fixes: ["AI interviews by company & role", "Peer mock pairing", "Behavioral answer coach"],
  },
  {
    icon: FaTrophy,
    title: "No idea where you stand",
    text: "Without peer benchmarks and a performance view, it’s hard to know if you’re actually interview-ready.",
    fixes: ["Daily & weekly challenges", "Performance overview", "Hear from seniors"],
  },
  {
    icon: FaFileAlt,
    title: "Resume and documents are last-minute chaos",
    text: "ATS rejects, outdated resumes, and offer letters / certificates buried across devices.",
    fixes: ["Resume builder + ATS", "Live preview", "Private document vault"],
  },
  {
    icon: FaCalendarAlt,
    title: "Drives move faster than students do",
    text: "Deadlines, eligibility, and visit dates get lost in group chats until it’s already too late.",
    fixes: ["Drive calendar & reminders", "Eligibility checklists", "Career explorer"],
  },
];

const SOLUTIONS = [
  {
    icon: FaBuilding,
    title: "Company insights",
    text: "Roles, process, and what each company looks for — so prep starts with context, not guesswork.",
  },
  {
    icon: FaRobot,
    title: "AI interviews by company & role",
    text: "Practice the exact kind of round you’ll face, with feedback you can act on before the real day.",
  },
  {
    icon: FaMapMarkedAlt,
    title: "PrepPath",
    text: "A guided plan toward your target roles — what to learn, what to revise, and what to skip.",
  },
  {
    icon: FaBook,
    title: "Curated resources & must-dos",
    text: "Handpicked links and must-do topics instead of drowning in endless playlists and PDFs.",
  },
  {
    icon: FaCode,
    title: "Coding Qs & interview experiences",
    text: "Real questions and stories from people who already sat through the same process.",
  },
  {
    icon: FaTrophy,
    title: "Daily & weekly challenges",
    text: "Short practice bursts that show where you stand among peers — and keep you consistent.",
  },
  {
    icon: FaUserFriends,
    title: "Peer mock pairing",
    text: "Book a 30‑minute mock with another student on campus and practice like it’s the real interview.",
  },
  {
    icon: FaComments,
    title: "Behavioral answer coach",
    text: "STAR-format practice for HR rounds — clearer stories, stronger delivery, less blanking out.",
  },
  {
    icon: FaBriefcase,
    title: "Career explorer",
    text: "Roles, skills, sample JDs, and market salary ranges so you pick targets with eyes open.",
  },
  {
    icon: FaFileAlt,
    title: "Resume builder + ATS",
    text: "Live preview and ATS checks so your resume is placement-ready before you hit apply.",
  },
  {
    icon: FaCalendarAlt,
    title: "Drive calendar & reminders",
    text: "Upcoming visits, deadlines, and eligibility checklists — so nothing important slips by.",
  },
  {
    icon: FaFolderOpen,
    title: "Private document vault",
    text: "Offer letters, resumes, and certificates in one secure place — yours alone.",
  },
  {
    icon: FaGraduationCap,
    title: "Hear from seniors",
    text: "Advice and lived experience from people a step ahead on the same campus journey.",
  },
  {
    icon: FaChartLine,
    title: "Performance overview",
    text: "See strengths, gaps, and progress across mocks and practice — know what to fix next.",
  },
];

const FALLBACK_STATS = [
  { value: 35, suffix: "k+", label: "Platform visits", duration: 1600 },
  { value: 1400, suffix: "+", label: "Registered users", duration: 1600 },
  { value: 150, suffix: "+", label: "Avg. daily active users", duration: 1400 },
  { value: 200, suffix: "+", label: "Companies listed", duration: 1600 },
  { value: 200, suffix: "+", label: "Interview experiences", duration: 1800 },
  { value: 5, suffix: "+", label: "Years of data", duration: 1000 },
];

function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        let start = null;
        const step = (ts) => {
          if (!start) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          setCount(Math.floor(progress * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);
  return { count, ref };
}

function ChallengeFlipCard({ point }) {
  const [flipped, setFlipped] = useState(false);
  const Icon = point.icon;

  return (
    <button
      type="button"
      className={`challenge-flip w-full text-left ${flipped ? "is-flipped" : ""}`}
      onClick={() => setFlipped((prev) => !prev)}
      aria-pressed={flipped}
      aria-label={
        flipped
          ? `Hide solutions for ${point.title}`
          : `Flip to see solutions for ${point.title}`
      }
    >
      <div className="challenge-flip-inner">
        <div className="challenge-flip-face challenge-flip-front rounded-3xl border border-theme bg-theme-card p-6 sm:p-8">
          <div
            className="absolute left-0 top-8 bottom-8 w-1 rounded-full"
            style={{
              background:
                "linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 45%, transparent))",
            }}
          />
          <div className="relative pl-5 sm:pl-6 flex h-full flex-col">
            <Icon className="h-5 w-5 text-theme-accent mb-3" />
            <h3
              className="text-xl sm:text-2xl font-bold text-theme-primary mb-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {point.title}
            </h3>
            <p className="text-base sm:text-lg text-theme-secondary leading-relaxed flex-1">
              {point.text}
            </p>
            <p className="mt-5 text-sm font-semibold text-theme-accent">
              Flip to see how we fix this →
            </p>
          </div>
        </div>

        <div className="challenge-flip-face challenge-flip-back rounded-3xl border border-theme-accent/40 bg-theme-accent text-white p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 mb-3">
            How we fix this
          </p>
          <h3
            className="text-xl sm:text-2xl font-bold mb-4 leading-snug"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {point.title}
          </h3>
          <ul className="space-y-3 flex-1">
            {point.fixes.map((fix) => (
              <li key={fix} className="flex items-start gap-2.5 text-base sm:text-lg font-medium">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/90 shrink-0" />
                <span>{fix}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm font-semibold text-white/85">
            Flip back ←
          </p>
        </div>
      </div>
    </button>
  );
}

function RevealCard({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function SectionIntro({ title, titleAccent, subtitle, id }) {
  return (
    <div className="mx-auto max-w-3xl text-center mb-6 sm:mb-8">
      <p style={PAGE_SECTION_LABEL_STYLE}>Placement prep</p>
      <h2 id={id} className="text-theme-primary" style={PAGE_SECTION_TITLE_STYLE}>
        {title}
        {titleAccent ? (
          <>
            {" "}
            <em style={{ color: "#818CF8", fontStyle: "italic" }}>{titleAccent}</em>
          </>
        ) : null}
      </h2>
      {subtitle ? (
        <p className="text-theme-secondary" style={PAGE_SECTION_SUBTITLE_STYLE}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function StatPill({ value, suffix, label, duration }) {
  const { count, ref } = useCountUp(value, duration);
  return (
    <div
      ref={ref}
      className="flex h-full min-w-0 flex-col items-center justify-center px-2.5 sm:px-3 py-4 rounded-2xl bg-theme-card border border-theme-accent/20"
    >
      <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-theme-accent tabular-nums">
        {count}
        {suffix}
      </span>
      <span className="text-xs sm:text-sm text-theme-secondary mt-1 text-center leading-snug">
        {label}
      </span>
    </div>
  );
}

function dedupeCompanies(companies) {
  const seen = new Set();
  const unique = [];
  for (const company of companies) {
    const id = company?._id != null ? String(company._id) : "";
    const nameKey = normalizeCompanyNameKey(company?.name || "");
    const key = id || nameKey;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(company);
  }
  return unique;
}

function flattenPreviewLogos(payload) {
  const logos = payload?.logos && typeof payload.logos === "object" ? payload.logos : {};
  return Object.values(logos).flat().filter((c) => c?.name);
}

function repeatForMarquee(items, minCopies = 8) {
  if (!items.length) return [];
  const copies = Math.max(minCopies, Math.ceil(12 / items.length));
  return Array.from({ length: copies }, () => items).flat();
}

/** Keep perceived scroll speed steady regardless of how many tiles are in the row. */
function marqueeDurationSec(itemCount, secondsPerTile = 5) {
  return Math.max(60, Math.round(itemCount * secondsPerTile));
}

function LogoMarquee({ items, reverse = false, secondsPerTile = 5, children }) {
  const track = [...items, ...items];
  const durationSec = marqueeDurationSec(items.length, secondsPerTile);
  const animationName = reverse ? "marquee-reverse" : "marquee";
  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="landing-marquee-track whitespace-nowrap"
        style={{
          width: "max-content",
          display: "flex",
          animation: `${animationName} ${durationSec}s linear infinite`,
        }}
      >
        {track.map((item, idx) => children(item, idx))}
      </div>
    </div>
  );
}

function HeroHighlightRotator() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_HIGHLIGHTS.length);
    }, 2600);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const active = HERO_HIGHLIGHTS[index];
  const Icon = active.icon;

  if (reduceMotion) {
    return (
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {HERO_HIGHLIGHTS.slice(0, 4).map((item) => {
          const ItemIcon = item.icon;
          return (
            <span
              key={item.label}
              className="inline-flex items-center gap-2 rounded-full border border-theme-accent/30 bg-theme-card/80 px-3 py-1.5 text-sm font-semibold text-theme-accent"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <ItemIcon className="h-3.5 w-3.5" />
              {item.label}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <div className="relative h-14 w-full max-w-lg overflow-hidden">
        <AnimatePresence mode="wait">
          <MotionDiv
            key={active.label}
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -18, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="inline-flex items-center gap-2.5 rounded-full border border-theme-accent/35 bg-theme-card/90 px-4 py-2.5 text-base font-semibold text-theme-accent shadow-lg backdrop-blur-sm"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {active.label}
            </span>
          </MotionDiv>
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-1.5" aria-hidden>
        {HERO_HIGHLIGHTS.map((item, i) => (
          <span
            key={item.label}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-5 bg-theme-accent" : "w-1.5 bg-theme-accent/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function LandingHero({ user, onSignIn, embedded = false }) {
  const reduceMotion = useReducedMotion();
  const canEnterRvce = canAccessRvceTenant(user);
  const appHome = getAppHomePathForUser(user);
  const fadeUp = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <section className="landing-hero relative overflow-hidden bg-theme-hero py-12 sm:py-16 px-4 sm:px-6">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <MotionDiv
          className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-theme-accent/20 blur-3xl"
          animate={
            reduceMotion
              ? undefined
              : { scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }
          }
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <MotionDiv
          className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-theme-accent/15 blur-3xl"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 24, 0], y: [0, -16, 0], opacity: [0.25, 0.45, 0.25] }
          }
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <MotionDiv
          className="absolute -right-8 top-24 h-48 w-48 rounded-full bg-theme-accent/10 blur-3xl"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, -20, 0], y: [0, 18, 0], opacity: [0.2, 0.4, 0.2] }
          }
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--accent) 28%, transparent) 1px, transparent 0)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl text-center" style={{ fontFamily: "Inter, sans-serif" }}>
        <MotionH1
          {...fadeUp(0.05)}
          className="landing-brand-gradient text-[2.1rem] sm:text-5xl md:text-6xl lg:text-[3.75rem] font-extrabold tracking-tight leading-[1.12]"
        >
          Welcome to Last Minute Placement Prep
        </MotionH1>

        <MotionP
          {...fadeUp(0.16)}
          className="mt-6 max-w-xl text-lg sm:text-xl text-theme-secondary leading-relaxed mx-auto font-medium"
        >
          Crack placements with company-ready prep — not guesswork.
        </MotionP>

        <HeroHighlightRotator />

        <MotionDiv {...fadeUp(0.28)} className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          {(() => {
            const heroBtnClass =
              "inline-flex h-10 min-h-10 items-center justify-center rounded-xl border border-theme-accent/40 bg-theme-card/80 px-5 text-sm font-semibold leading-none text-theme-accent backdrop-blur-sm transition-colors hover:bg-theme-accent hover:text-white";
            return (
              <>
                {embedded ? (
                  <Link to={`${GENERAL_BASE}/companystats`} className={heroBtnClass}>
                    Explore companies
                  </Link>
                ) : appHome ? (
                  <Link to={appHome} className={heroBtnClass}>
                    {canEnterRvce ? "Enter campus dashboard" : "Open general dashboard"}
                  </Link>
                ) : (
                  <button type="button" onClick={onSignIn} className={heroBtnClass}>
                    Sign in to get started
                  </button>
                )}
                <a href="#solutions" className={heroBtnClass}>
                  See what you get
                </a>
                <a href="#challenges" className={heroBtnClass}>
                  See challenges
                </a>
                <Link to="/onboard" className={heroBtnClass}>
                  Enrol your college
                </Link>
              </>
            );
          })()}
        </MotionDiv>
      </div>
    </section>
  );
}

function LandingHeader({ user, loading, onSignIn }) {
  const { theme, toggleTheme } = useTheme();
  const canEnterRvce = canAccessRvceTenant(user);
  const appHome = getAppHomePathForUser(user);
  return (
    <header className="sticky top-0 z-50 border-b border-theme bg-theme-card/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="#top" className="min-w-0 shrink font-serif text-lg sm:text-xl text-theme-primary tracking-tight">
          lastminute<span className="italic text-theme-accent">placementprep</span>
        </a>
        <nav className="hidden md:flex items-center gap-5 text-base font-semibold text-theme-secondary">
          <a href="#challenges" className="hover:text-theme-accent transition-colors">
            Challenges
          </a>
          <a href="#solutions" className="hover:text-theme-accent transition-colors">
            Solutions
          </a>
          <a href="#stats" className="hover:text-theme-accent transition-colors">
            Stats
          </a>
          <a href="#companies" className="hover:text-theme-accent transition-colors">
            Companies
          </a>
          <a href="#institutions" className="hover:text-theme-accent transition-colors">
            Institutions
          </a>
          <a href="#testimonials" className="hover:text-theme-accent transition-colors">
            Testimonials
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-theme bg-theme-card text-theme-primary hover:bg-theme-hero transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <FaSun className="h-3.5 w-3.5" /> : <FaMoon className="h-3.5 w-3.5" />}
          </button>
          {appHome ? (
            <Link
              to={appHome}
              className="rounded-xl bg-theme-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {canEnterRvce ? "Dashboard" : "General"}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              disabled={loading}
              className="rounded-xl bg-theme-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-70"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

/** Public product home. College dashboard lives under /rvce; /general reuses this page embedded. */
export default function PlatformLanding({ embedded = false }) {
  const { user, login, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [companyLogos, setCompanyLogos] = useState(FALLBACK_COMPANIES);
  const [stats, setStats] = useState(FALLBACK_STATS);
  const showRvceEmailNotice =
    !embedded && searchParams.get("reason") === "rvce_email_required";

  const goSignIn = () => login(false);

  useEffect(() => {
    if (!showRvceEmailNotice) return undefined;
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      next.delete("reason");
      setSearchParams(next, { replace: true });
    }, 8000);
    return () => clearTimeout(t);
  }, [showRvceEmailNotice, searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [previewRes, namesRes, homeStatsRes] = await Promise.allSettled([
          companyAPI.getPreviewLogos(),
          companyAPI.getCompanyNames(),
          companyAPI.getHomeStats(),
        ]);

        if (cancelled) return;

        if (previewRes.status === "fulfilled") {
          const unique = dedupeCompanies(flattenPreviewLogos(previewRes.value?.data)).slice(0, 18);
          if (unique.length) setCompanyLogos(unique);
        }

        const liveStats = [...FALLBACK_STATS];
        if (homeStatsRes.status === "fulfilled") {
          const registered = Number(homeStatsRes.value?.data?.registeredUsers);
          if (Number.isFinite(registered) && registered > 0) {
            liveStats[1] = {
              value: registered,
              suffix: "+",
              label: "Registered users",
              duration: 1600,
            };
          }
        }
        if (namesRes.status === "fulfilled") {
          const count = Array.isArray(namesRes.value?.data) ? namesRes.value.data.length : 0;
          if (count > 0) {
            liveStats[3] = {
              value: count,
              suffix: "+",
              label: "Companies listed",
              duration: 1600,
            };
          }
        }
        setStats(liveStats);
      } catch {
        if (!cancelled) {
          setCompanyLogos(FALLBACK_COMPANIES);
          setStats(FALLBACK_STATS);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const companiesForMarquee = companyLogos.slice(0, 12);
  const companyRowA = repeatForMarquee(companiesForMarquee, 3);
  const companyRowB = repeatForMarquee([...companiesForMarquee].reverse(), 3);
  const institutionRowA = repeatForMarquee(INSTITUTIONS, 8);
  const institutionRowB = repeatForMarquee([...INSTITUTIONS].reverse(), 8);

  return (
    <div
      id="top"
      className={`flex flex-col bg-theme-app text-theme-primary scroll-smooth ${
        embedded ? "min-h-0" : "min-h-screen"
      }`}
    >
      <PageHeroFontStyles />
      {!embedded ? (
        <LandingHeader user={user} loading={loading} onSignIn={goSignIn} />
      ) : null}
      {showRvceEmailNotice ? (
        <div className="border-b border-theme-accent/30 bg-theme-accent/10 px-4 py-3 text-center text-sm text-theme-primary">
          The RVCE dashboard is only available with an{" "}
          <strong className="text-theme-accent">@rvce.edu.in</strong> email.
          {" "}
          Signed-in students from other colleges use the{" "}
          <Link
            to={GENERAL_BASE}
            className="font-semibold text-theme-accent underline-offset-2 hover:underline"
          >
            general dashboard
          </Link>
          , or{" "}
          <Link
            to="/onboard"
            className="font-semibold text-theme-accent underline-offset-2 hover:underline"
          >
            enrol your college
          </Link>
          .
        </div>
      ) : null}

      <main className="flex-1">
        <LandingHero user={user} onSignIn={goSignIn} embedded={embedded} />

        {/* ── CHALLENGES ── */}
        <section
          id="challenges"
          className="relative py-10 sm:py-14 overflow-hidden scroll-mt-24"
          aria-labelledby="landing-challenges-heading"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.11]"
            style={{
              background:
                "radial-gradient(ellipse 90% 60% at 50% -10%, var(--accent), transparent 55%)",
            }}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
            <SectionIntro
              title="Student"
              titleAccent="Challenges"
              subtitle="Most students don’t fail from lack of effort — they fail from missing context, structure, practice, and timing. Flip a card to see how we fix each one."
              id="landing-challenges-heading"
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {CHALLENGES.map((point, idx) => (
                <RevealCard key={point.title} delay={idx * 80}>
                  <ChallengeFlipCard point={point} />
                </RevealCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOLUTIONS ── */}
        <section
          id="solutions"
          className="relative py-10 sm:py-14 overflow-hidden bg-theme-hero scroll-mt-24"
          aria-labelledby="landing-solutions-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
            <SectionIntro
              title="What we"
              titleAccent="Provide"
              subtitle="One place for insight, practice, peer pressure (the good kind), resumes, drives, and performance — built for campus placement season."
              id="landing-solutions-heading"
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {SOLUTIONS.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <RevealCard key={feature.title} delay={idx * 55}>
                    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-theme bg-theme-card text-left transition-all duration-300 hover:-translate-y-1 hover:border-theme-accent/45 hover:shadow-xl">
                      <div
                        className="h-1 w-full"
                        style={{
                          background:
                            "linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 55%, transparent), transparent)",
                        }}
                      />
                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-theme-accent/25 bg-theme-accent/10 text-theme-accent">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-theme-accent">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-theme-primary transition-colors group-hover:text-theme-accent sm:text-2xl" style={{ fontFamily: "Inter, sans-serif" }}>
                          {feature.title}
                        </h3>
                        <p className="flex-1 text-base leading-relaxed text-theme-secondary sm:text-lg">
                          {feature.text}
                        </p>
                      </div>
                    </div>
                  </RevealCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section
          id="stats"
          className="bg-theme-card border-y border-theme py-8 sm:py-10 px-4 scroll-mt-24"
        >
          <div className="max-w-7xl mx-auto">
            <SectionIntro
              title="Platform"
              titleAccent="Stats"
              subtitle="Live counts where we have them, plus the scale of prep data already on the dashboard."
              id="landing-stats-heading"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {stats.map((s) => (
                <StatPill key={s.label} {...s} />
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPANY MARQUEES ── */}
        <section
          id="companies"
          className="py-8 sm:py-10 overflow-hidden bg-theme-card border-y border-theme scroll-mt-24"
          aria-labelledby="landing-companies-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
            <SectionIntro
              title="Featured"
              titleAccent="Companies"
              subtitle="Insights and interview context for the recruiters that show up on campus."
              id="landing-companies-heading"
            />
          </div>
          <div className="flex flex-col gap-5">
            <LogoMarquee items={companyRowA} secondsPerTile={5.5}>
              {(company, idx) => (
                <CompanyTile key={`${company._id || company.name}-a-${idx}`} company={company} />
              )}
            </LogoMarquee>
            <LogoMarquee items={companyRowB} reverse secondsPerTile={6}>
              {(company, idx) => (
                <CompanyTile key={`${company._id || company.name}-b-${idx}`} company={company} />
              )}
            </LogoMarquee>
          </div>
        </section>

        {/* ── INSTITUTION MARQUEES ── */}
        <section
          id="institutions"
          className="py-8 sm:py-10 overflow-hidden scroll-mt-24"
          aria-labelledby="landing-institutions-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
            <SectionIntro
              title="Campus"
              titleAccent="Institutions"
              subtitle="A dedicated placement dashboard for each campus — same product, local data."
              id="landing-institutions-heading"
            />
          </div>
          <div className="flex flex-col gap-5">
            <LogoMarquee items={institutionRowA} secondsPerTile={5.5}>
              {(college, idx) => (
                <InstitutionTile key={`${college.short}-a-${idx}`} college={college} />
              )}
            </LogoMarquee>
            <LogoMarquee items={institutionRowB} reverse secondsPerTile={6}>
              {(college, idx) => (
                <InstitutionTile key={`${college.short}-b-${idx}`} college={college} />
              )}
            </LogoMarquee>
          </div>
        </section>

        {/* ── TESTIMONIALS PLACEHOLDER ── */}
        <section
          id="testimonials"
          className="py-8 sm:py-10 overflow-hidden bg-theme-hero border-y border-theme scroll-mt-24"
          aria-labelledby="landing-testimonials-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionIntro
              title="Student"
              titleAccent="Testimonials"
              subtitle="Stories from students who used the platform to prep — coming soon."
              id="landing-testimonials-heading"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((slot) => (
                <div
                  key={slot}
                  className="flex min-h-[11rem] flex-col justify-between rounded-3xl border border-dashed border-theme-accent/35 bg-theme-card/70 p-6"
                >
                  <div className="space-y-3">
                    <div className="h-3 w-24 rounded-full bg-theme-accent/20" />
                    <div className="h-3 w-full rounded-full bg-theme-accent/10" />
                    <div className="h-3 w-5/6 rounded-full bg-theme-accent/10" />
                    <div className="h-3 w-2/3 rounded-full bg-theme-accent/10" />
                  </div>
                  <p className="mt-6 text-sm font-semibold text-theme-secondary">
                    Testimonial placeholder
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {!embedded ? (
        <footer className="border-t border-theme bg-theme-sidebar py-8 px-6 text-theme-secondary">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-serif text-theme-primary">
              lastminute<span className="italic text-theme-accent">placementprep</span>
            </p>
            <p className="text-sm">© {new Date().getFullYear()} All rights reserved.</p>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function CompanyTile({ company }) {
  const name = company?.name || "Company";
  return (
    <div className="inline-flex flex-col items-center justify-center gap-2.5 mx-3 sm:mx-4 h-[8.5rem] w-[8.5rem] sm:h-40 sm:w-40 rounded-2xl border border-theme bg-theme-card px-3 py-3 flex-shrink-0 text-center">
      <CompanyLogo
        company={company}
        pixelSize={80}
        className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-contain bg-white p-1 border border-theme flex-shrink-0"
        alt={`${name} logo`}
      />
      <p className="w-full text-xs sm:text-sm font-bold text-theme-accent leading-snug line-clamp-2 whitespace-normal">
        {name}
      </p>
    </div>
  );
}

function InstitutionTile({ college }) {
  return (
    <div className="inline-flex items-center gap-4 mx-4 sm:mx-6 h-[5.5rem] w-[18.5rem] sm:w-[22rem] rounded-2xl border border-theme bg-theme-card px-4 py-3 flex-shrink-0">
      <CompanyLogo
        company={{ name: college.short, domain: college.domain }}
        pixelSize={80}
        className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-contain bg-white p-1 border border-theme flex-shrink-0"
        alt={`${college.name} logo`}
      />
      <div className="min-w-0 text-left whitespace-normal">
        <p className="text-[11px] font-bold uppercase tracking-wider text-theme-accent">{college.short}</p>
        <p className="text-sm sm:text-base font-bold text-theme-primary leading-snug truncate">
          {college.name}
        </p>
        <p className="text-xs text-theme-secondary">{college.city}</p>
      </div>
    </div>
  );
}
