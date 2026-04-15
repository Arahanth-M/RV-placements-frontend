import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { companyAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import aeroplane from "../assets/home5.png";
import building from "../assets/rv_image.png";
import CompanyLogo from "./CompanyLogo";
import entrance from "../assets/new.jpeg";

/* ── tiny hook: count up when element enters viewport ── */
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

/* ── stagger-reveal card ── */
function RevealCard({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
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

/* ── stat pill ── */
function StatPill({ value, suffix, label, duration }) {
  const { count, ref } = useCountUp(value, duration);
  return (
    <div ref={ref} className="flex flex-col items-center px-6 py-4 rounded-2xl bg-theme-card border border-theme-accent/20">
      <span className="text-3xl sm:text-4xl font-extrabold text-theme-accent">
        {count}{suffix}
      </span>
      <span className="text-xs sm:text-sm text-theme-secondary mt-1 text-center">{label}</span>
    </div>
  );
}

/* ── section intro: kicker + title + optional subtitle + accent bar ── */
function SectionIntro({ kicker, title, titleAccent, subtitle, id }) {
  return (
    <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16 md:mb-20">
      <span className="inline-flex items-center justify-center rounded-full border border-theme-accent/35 bg-theme-accent/10 px-5 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-theme-accent mb-6 shadow-sm">
        {kicker}
      </span>
      <h2
        id={id}
        className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-theme-primary tracking-tight leading-[1.12]"
      >
        {title}
        {titleAccent ? (
          <>
            {" "}
            <span className="text-theme-accent">{titleAccent}</span>
          </>
        ) : null}
      </h2>
      {subtitle ? (
        <p className="mt-5 text-base sm:text-lg text-theme-secondary leading-relaxed max-w-2xl mx-auto">
          {subtitle}
        </p>
      ) : null}
      <div className="mt-8 sm:mt-10 flex justify-center items-center gap-2">
        <span className="h-1 w-12 sm:w-16 rounded-full bg-theme-accent shadow-[0_0_20px_var(--accent)] opacity-90" />
        <span className="h-1 w-2 rounded-full bg-theme-accent/45" />
        <span className="h-1 w-2 rounded-full bg-theme-accent/25" />
      </div>
    </div>
  );
}

function Home() {
  const { user } = useAuth();
  const images = useMemo(() => [aeroplane, entrance, building], []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageRatios, setImageRatios] = useState({});
  const [loadedSlides, setLoadedSlides] = useState({});
  const [companyLogos, setCompanyLogos] = useState([]);
  const [showBetaPopup, setShowBetaPopup] = useState(false);

  useEffect(() => {
    if (user && user.betaAccess === false) {
      setShowBetaPopup(true);
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % images.length;
        // Skip swap until next slide is decoded to avoid border flash.
        return loadedSlides[next] ? next : prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length, loadedSlides]);

  useEffect(() => {
    images.forEach((src, index) => {
      const img = new Image();
      img.onload = () => {
        if (!img.naturalWidth || !img.naturalHeight) return;
        setImageRatios((prev) => ({
          ...prev,
          [index]: img.naturalWidth / img.naturalHeight,
        }));
        setLoadedSlides((prev) => ({
          ...prev,
          [index]: true,
        }));
      };
      img.src = src;
    });
  }, [images]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await companyAPI.getAllCompanies();
        setCompanyLogos((res.data || []).slice(0, 6));
      } catch (err) {
        console.error("Error fetching companies for marquee:", err);
      }
    };
    fetchCompanies();
  }, []);

  const challenges = [
    { text: "Students prepare well but don't know the exact type of questions companies ask." },
    { text: "Lack of clarity about what a company does and its work culture." },
    { text: "Uncertainty about interview processes reduces confidence." },
    { text: "No clear idea about how many students were placed in each company previously." },
  ];

  const features = [
    {
      title: "Updates on the events",
      text: "Get the latest updates on the events and the companies that are coming to the campus.",
    },
    {
      title: "AI Mock Interviews",
      text: "Company-specific mock interviews fully powered by AI.",
    },

    {
      title: "Company Insights",
      text: "Detailed insights into company profiles and offered roles.",
    },
    {
      title: "Interview Breakdown",
      text: "Step-by-step breakdown of previous interview processes.",
    },
    {
      title: "Performance Analysis",
      text: "Get the performance analysis of the students in the interviews along with the strengths and weaknesses.",
    },
    {
      title: "Company Stats",
      text: "Previous year's company stats and the number of students placed in each company.",
    },
  ];

  const vision = [
    { title: "Live Interactions", text: "Live interaction videos with seniors sharing experiences." },
    { title: "Curated Resources", text: "More curated notes & resources for cutting-edge tech." },
    { title: "Continuous Updates", text: "Continuous feature updates to support student success." },
    { title: "Resume Builder", text: "A resume builder to help students build their resumes and get feedback on them." },
  ];

  const stats = [
    { value: 100, suffix: "+", label: "Companies Listed", duration: 1600 },
    { value: 200, suffix: "+", label: "Interview Experiences and Questions", duration: 1800 },
    { value: 3, suffix: "+", label: "Years of Data", duration: 1000 },
    { value: 4, suffix: "+", label: "Active Features", duration: 1000 },
  ];

  const slideshowRatio = useMemo(() => {
    const ratios = Object.values(imageRatios);
    if (!ratios.length) return 16 / 9;
    // Keep a stable frame to avoid layout jumps during slide switches.
    return Math.max(...ratios);
  }, [imageRatios]);

  return (
    <div className="min-h-screen bg-theme-app">
      {showBetaPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl text-center max-w-md">
            <h2 className="text-xl font-bold mb-4">Beta Access</h2>
            <p className="text-gray-600 mb-4">
              The platform is currently in beta and access is limited to selected users.
              Your batch will be enabled very soon.
            </p>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => setShowBetaPopup(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <div className="w-full py-8 sm:py-14 md:py-16 px-4 sm:px-6 bg-theme-hero relative overflow-hidden">
        {/* subtle background decoration */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, var(--color-accent, #6366f1) 0%, transparent 55%)",
            opacity: 0.06,
          }}
        />
        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* Left */}
            <div className="flex-1 text-center lg:text-left">
             
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-theme-primary mb-5 leading-tight">
               Welcome to RVCE{" "}
                <span className="text-theme-accent">Placement Dashboard</span>{" "}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-theme-secondary leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                Company insights, interview experiences, curated resources, and
                senior guidance. Everything you need to ace placements at RVCE.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <a
                  href="/companystats"
                  className="px-6 py-3 rounded-xl border border-theme-accent/40 bg-theme-hero text-theme-accent font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity shadow-lg"
                >
                  Explore Companies →
                </a>
              </div>
            </div>
{/*slideshow*/}
<div className="flex-1 w-full lg:w-auto">
  <div
    className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-theme-card"
    style={{ aspectRatio: slideshowRatio }}
  >
    
    {/* Slides */}
    {images.map((image, index) => (
      <div
        key={index}
        className="absolute inset-0 transition-opacity duration-500 ease-in-out will-change-opacity"
        style={{ opacity: index === currentIndex ? 1 : 0 }}
      >
        <img
          src={image}
          alt={`Slide ${index + 1}`}
          className="w-full h-full object-cover"
          style={{ height: "100%" }}
          loading="eager"
          decoding="sync"
        />
      </div>
    ))}

   
  </div>
</div>
</div>
</div>
</div>
  
      {/* ── STATS STRIP ── */}
      <div className="bg-theme-card border-y border-theme py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatPill key={i} {...s} />
          ))}
        </div>
      </div>

      {/* ── THE PROBLEM ── */}
      <section
        className="relative py-16 sm:py-20 md:py-28 overflow-hidden"
        aria-labelledby="home-problem-heading"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.11]"
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 50% -10%, var(--accent), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 50%, var(--accent), transparent 60%)",
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 40%, transparent), transparent)",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <SectionIntro
            kicker="The Problem"
            title="Challenges Students"
            titleAccent="Face"
            subtitle="Placement prep shouldn’t be a guessing game. Here’s what gets in the way—and why we built this dashboard."
            id="home-problem-heading"
          />
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            {challenges.map((point, idx) => (
              <RevealCard key={idx} delay={idx * 100}>
                <div className="group relative h-full rounded-3xl border border-theme bg-theme-card p-6 sm:p-8 transition-all duration-300 hover:border-theme-accent/50 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)] overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 45%)",
                    }}
                  />
                  <div
                    className="absolute left-0 top-8 bottom-8 w-1 rounded-full opacity-90"
                    style={{
                      background:
                        "linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 45%, transparent))",
                    }}
                  />
                  <div className="relative pl-5 sm:pl-6">
                    <p className="text-lg sm:text-xl text-theme-primary leading-relaxed font-medium">
                      {point.text}
                    </p>
                  </div>
                </div>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR SOLUTION ── */}
      <section
        className="relative py-16 sm:py-20 md:py-28 overflow-hidden bg-theme-hero"
        aria-labelledby="home-solution-heading"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.09]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -12deg,
              transparent,
              transparent 40px,
              color-mix(in srgb, var(--accent) 6%, transparent) 40px,
              color-mix(in srgb, var(--accent) 6%, transparent) 41px
            )`,
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <SectionIntro
            kicker="Our Solution"
            title="What We"
            titleAccent="Provide"
            subtitle="Tools built around real interview data and community—so you prepare with context, not guesswork."
            id="home-solution-heading"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, idx) => (
              <RevealCard key={idx} delay={idx * 90}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-theme bg-theme-card text-left transition-all duration-300 hover:border-theme-accent/45 hover:shadow-xl dark:hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]">
                  <div
                    className="h-1 w-full opacity-95"
                    style={{
                      background:
                        "linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 55%, transparent), transparent)",
                    }}
                  />
                  <div className="flex flex-1 flex-col p-6 sm:p-8">
                    <h3 className="mb-2 text-xl font-bold text-theme-primary transition-colors duration-300 group-hover:text-theme-accent sm:text-2xl">
                      {feature.title}
                    </h3>
                    <p className="flex-1 text-base leading-relaxed text-theme-secondary sm:text-lg">
                      {feature.text}
                    </p>
                  </div>
                </div>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPANY LOGOS MARQUEE ── */}
      {companyLogos.length > 0 && (
        <div className="py-10 sm:py-14 overflow-hidden bg-theme-card border-y border-theme">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h3 className="text-center text-xl sm:text-2xl font-bold text-theme-primary mb-8">
              Recruiters
            </h3>
          </div>
          <div className="relative w-full overflow-hidden">
            <div
              className="flex animate-marquee whitespace-nowrap"
              style={{ width: "max-content" }}
            >
              {[...companyLogos, ...companyLogos].map((company, idx) => {
                const id = company._id || company.id;
                const tileClass =
                  "inline-flex items-center justify-center h-20 sm:h-24 md:h-28 w-40 sm:w-48 md:w-52 mx-5 sm:mx-8 rounded-xl border border-theme bg-theme-card p-4 sm:p-5 flex-shrink-0 transition-all outline-none hover:border-theme-accent hover:shadow-md focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 focus-visible:ring-offset-theme-card";
                const inner = (
                  <CompanyLogo
                    company={company}
                    className="max-h-[5rem] sm:max-h-[6rem] md:max-h-28 w-auto max-w-full object-contain pointer-events-none"
                    alt={company.name || "Company logo"}
                  />
                );
                if (id) {
                  return (
                    <Link
                      key={`${String(id)}-${idx}`}
                      to={`/companies/${id}`}
                      className={tileClass}
                      aria-label={`View ${company.name || "company"} details and interviews`}
                    >
                      {inner}
                    </Link>
                  );
                }
                return (
                  <div key={idx} className={tileClass}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── WHAT'S NEXT ── */}
      <section
        className="relative py-16 sm:py-20 md:py-28 overflow-hidden"
        aria-labelledby="home-next-heading"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07] dark:opacity-[0.12]"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 0% 100%, var(--accent), transparent 50%), radial-gradient(ellipse 60% 45% at 100% 0%, var(--accent), transparent 50%)",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <SectionIntro
            kicker="What's Next"
            title="Our Future"
            titleAccent="Vision"
            subtitle="We’re not done—here’s what we’re working toward to keep the platform indispensable for every batch."
            id="home-next-heading"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 max-w-5xl mx-auto">
            {vision.map((plan, idx) => (
              <RevealCard key={idx} delay={idx * 110}>
                <div className="group relative h-full rounded-3xl border border-theme bg-theme-card p-6 sm:p-8 text-center transition-all duration-300 hover:border-theme-accent/50 hover:shadow-lg dark:hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.45)]">
                  <h3 className="text-xl sm:text-2xl font-bold text-theme-accent mb-2">{plan.title}</h3>
                  <p className="text-base sm:text-lg text-theme-secondary leading-relaxed">{plan.text}</p>
                </div>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

    

    </div>
  );
}

export default Home;