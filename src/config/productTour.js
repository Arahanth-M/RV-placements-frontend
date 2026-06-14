import {
  PATH_COMPANY_CATEGORY,
  PLACEMENT_CLUSTER_CS,
} from "../constants/placementTiers.js";

const TOUR_EXAMPLE_COMPANY = "Wells Fargo";
const TOUR_PPO_EXAMPLE_COMPANY = "Deutsche Bank";
const TOUR_CODING_EXAMPLE_COMPANY = "Microsoft";

/** @typedef {'navigateToPhonePeCompany' | 'navigateToPhonePeCompanyStats' | 'navigateToMicrosoftInternshipPpo' | 'navigateToMicrosoftCodingCompany' | 'prepareCompanyTourStep' | 'openAnalyticsTab' | 'openAiInterviewSessions' | 'resetCompanyStatsYear' | 'openCompanyStatsYear2025' | 'openCompanyStatsYear2026' | 'openCompanyStatsClusterCs' | 'openCompanyStatsDreamList' | 'none'} TourPrepareAction */

/**
 * @typedef {Object} ProductTourStep
 * @property {string} id
 * @property {string} route
 * @property {string} selector
 * @property {string} title
 * @property {string} description
 * @property {TourPrepareAction} [prepare]
 * @property {boolean} [requiresAuth]
 * @property {boolean} [requiresResumeBuilder]
 * @property {'top' | 'right' | 'bottom' | 'left'} [side]
 * @property {'start' | 'center' | 'end'} [align]
 * @property {string} [fallbackSelector]
 */

const CS_CATEGORY_URL = `${PATH_COMPANY_CATEGORY}?cluster=${PLACEMENT_CLUSTER_CS}`;

/** @type {ProductTourStep[]} */
const STUDENT_TOUR_STEPS_BASE = [
  {
    id: "theme",
    route: "/",
    selector: '[data-tour="header-theme"]',
    title: "Light & dark mode",
    description:
      "Switch between light and dark theme anytime.Your choice is remembered on this device.",
    side: "bottom",
    align: "end",
  },
  {
    id: "notifications",
    route: "/",
    selector: '[data-tour="header-notifications"]',
    title: "Notifications",
    requiresAuth: true,
    description:
      "The bell shows updates on submissions, approvals, and platform announcements. Open it to read, mark read, or clear notifications.",
    side: "bottom",
    align: "end",
  },
  {
    id: "company-stats-years",
    route: "/companystats",
    selector: '[data-tour="company-stats-years"]',
    prepare: "resetCompanyStatsYear",
    title: "Company Stats:pick a year",
    description:
      "Start here to explore placement data. Pick 2024 or 2025 for stats tables, or 2026 onwards for the full company hub.",
    side: "top",
    align: "center",
  },
  {
    id: "company-stats-2025",
    route: "/companystats",
    selector: '[data-tour="company-stats-year-2025"]',
    prepare: "openCompanyStatsYear2025",
    title: "2025 placement statistics",
    description:
      "The 2025 table lists company-wise placement outcomes such as packages, branches, and offer details in one sortable view.",
    side: "top",
    align: "center",
  },
  {
    id: "company-stats-2025-search",
    route: "/companystats",
    selector: '[data-tour="year-stats-search"]',
    fallbackSelector: '[data-tour="year-stats-toolbar"]',
    prepare: "openCompanyStatsYear2025",
    title: "Search companies",
    description:
      "Use this search box to find a company by name quickly in the 2025 stats table.",
    side: "bottom",
    align: "start",
  },
  {
    id: "company-stats-2025-branch",
    route: "/companystats",
    selector: '[data-tour="year-stats-branch"]',
    fallbackSelector: '[data-tour="year-stats-toolbar"]',
    prepare: "openCompanyStatsYear2025",
    title: "Filter by branch",
    description:
      "Narrow the table to a specific branch using this dropdown.",
    side: "bottom",
    align: "end",
  },
  {
    id: "company-stats-2025-filter",
    route: "/companystats",
    selector: '[data-tour="year-stats-filter"]',
    prepare: "openCompanyStatsYear2025",
    title: "Dream / Open-dream filter",
    description:
      "Tap the filter button to show All, Dream, or Open-dream companies based on package thresholds.",
    side: "left",
    align: "end",
  },
  {
    id: "company-stats-2025-analytics",
    route: "/companystats",
    selector: '[data-tour="year-stats-analytics"]',
    fallbackSelector: '[data-tour="year-stats-analytics-tab"]',
    prepare: "openCompanyStatsYear2025",
    title: "2025 Analytics",
    description:
      "Switch to the Analytics tab for charts and summaries — package distributions, branch-wise breakdowns, and placement trends across the 2025 cohort at a glance.",
    side: "top",
    align: "center",
  },
  {
    id: "company-stats-2026-cluster",
    route: "/category",
    selector: '[data-tour="company-stats-hub"]',
    prepare: "openCompanyStatsYear2026",
    title: "Choose cluster 2026 onwards",
    description:
      'Selecting “2026 Onwards” opens this hub. Pick your branch cluster (CS, EC, ME, or Chemical sciences) before browsing categories.',
    side: "top",
    align: "center",
  },
  {
    id: "company-stats-categories",
    route: CS_CATEGORY_URL,
    selector: '[data-tour="company-stats-categories"]',
    fallbackSelector: '[data-tour="company-stats-hub"]',
    prepare: "openCompanyStatsClusterCs",
    title: "Placement categories",
    description:
      "Dream, Open dream, internships, and off-campus,open a category to browse company cards.",
    side: "top",
    align: "center",
  },
  {
    id: "company-stats-cards",
    route: "/companystats?tier=dream",
    selector: '[data-tour="company-stats-company-grid"]',
    fallbackSelector: '[data-tour="company-stats-categories"]',
    prepare: "openCompanyStatsDreamList",
    title: "Company cards",
    description:
      "Browse dream companies for your cluster. Each card gives a quick snapshot before you open full details.",
    side: "top",
    align: "center",
  },
  {
    id: "company-stats-2026-search",
    route: "/companystats?tier=dream",
    selector: '[data-tour="company-stats-2026-search"]',
    fallbackSelector: '[data-tour="company-stats-company-grid"]',
    prepare: "openCompanyStatsDreamList",
    title: "Search companies (2026+)",
    description:
      "Type a company name here to filter the 2026+ dream list instantly — handy when the grid is long.",
    side: "bottom",
    align: "start",
  },
  {
    id: "company-stats-2026-filter",
    route: "/companystats?tier=dream",
    selector: '[data-tour="company-stats-2026-filter"]',
    fallbackSelector: '[data-tour="company-stats-2026-search"]',
    prepare: "openCompanyStatsDreamList",
    title: "Offer-type filter",
    description:
      "Tap this floating filter button on the 2026+ dream list to narrow companies by visit type.",
    side: "left",
    align: "end",
  },
  {
    id: "company-stats-2026-filter-fte",
    route: "/companystats?tier=dream",
    selector: '[data-tour="company-stats-2026-filter-fte"]',
    fallbackSelector: '[data-tour="company-stats-2026-filter-menu"]',
    prepare: "openCompanyStatsDreamList",
    title: "FTE filter",
    description:
      "FTE shows companies that came for direct full-time hiring only — no intern+PPO track in that year's visit.",
    side: "left",
    align: "end",
  },
  {
    id: "company-stats-2026-filter-internship-fte",
    route: "/companystats?tier=dream",
    selector: '[data-tour="company-stats-2026-filter-internship-fte"]',
    fallbackSelector: '[data-tour="company-stats-2026-filter-menu"]',
    prepare: "openCompanyStatsDreamList",
    title: "Internship + FTE filter",
    description:
      "Internship + FTE lists companies with an intern drive that can convert to full-time — useful when prepping for PPO-style processes on the dream grid.",
    side: "left",
    align: "end",
  },
  {
    id: "company-card-business-model",
    route: "/companystats?tier=dream",
    selector: '[data-tour="company-card-business-model"]',
    fallbackSelector: '[data-tour="company-stats-company-grid"]',
    prepare: "openCompanyStatsDreamList",
    title: "Business model",
    description:
      "Every card shows the company's business model — how they make money and what they do. Use this to understand the company before diving into interview prep.",
    side: "right",
    align: "start",
  },
  {
    id: "company-card-focus-areas",
    route: "/companystats?tier=dream",
    selector: '[data-tour="company-card-focus-areas"]',
    fallbackSelector: '[data-tour="company-stats-company-grid"]',
    prepare: "openCompanyStatsDreamList",
    title: "Top focus areas",
    description:
      "Tags highlight what this company typically tests — DSA, system design, frontend, etc. Prioritize these topics when preparing for their drive.",
    side: "right",
    align: "start",
  },
  {
    id: "company-card-helpful",
    route: "/companystats?tier=dream",
    selector: '[data-tour="company-card-helpful"]',
    fallbackSelector: '[data-tour="company-stats-company-grid"]',
    prepare: "openCompanyStatsDreamList",
    title: "Helpful button",
    description:
      "Found a card useful? Tap Helpful to upvote it. This helps other students spot well-maintained company pages and gives contributors recognition.",
    side: "top",
    align: "end",
  },
  {
    id: "company-tab-about",
    route: "/companystats?tier=dream",
    selector: '[data-tour="company-tab-about-panel"]',
    fallbackSelector: '[data-tour="company-tab-about"]',
    prepare: "navigateToPhonePeCompany",
    title: "About tab",
    description:
      `The About tab has the full company write-up — culture, products, and hiring context. Example: ${TOUR_EXAMPLE_COMPANY}'s detailed profile lives here.`,
    side: "top",
    align: "start",
  },
  {
    id: "company-tab-stats-wells-fargo",
    route: "/companystats?tier=dream",
    selector: '[data-tour="company-tab-stats-placement-got-in"]',
    fallbackSelector: '[data-tour="company-tab-stats"]',
    prepare: "navigateToPhonePeCompanyStats",
    title: `Stats — ${TOUR_EXAMPLE_COMPANY} (Got in)`,
    description:
      `${TOUR_EXAMPLE_COMPANY} shows branch-wise Got in — how many students from each branch (CSE, ISE, etc.) received an offer for the selected year. Totals at the top roll up every branch row.`,
    side: "top",
    align: "center",
  },
  {
    id: "company-tab-stats-got-in",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-tab-stats-got-in"]',
    fallbackSelector: '[data-tour="company-tab-stats-branch"]',
    prepare: "navigateToMicrosoftInternshipPpo",
    title: `Stats — ${TOUR_PPO_EXAMPLE_COMPANY} Got in`,
    description:
      `${TOUR_PPO_EXAMPLE_COMPANY} 2026 internship (PPO): the Got in summary counts interns selected per branch. Scroll the branch table below to see CSE, ISE, and other rows separately.`,
    side: "top",
    align: "start",
  },
  {
    id: "company-tab-stats-converted",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-tab-stats-converted"]',
    fallbackSelector: '[data-tour="company-tab-stats-got-in"]',
    prepare: "prepareCompanyTourStep",
    title: `Stats — ${TOUR_PPO_EXAMPLE_COMPANY} Converted`,
    description:
      "Converted counts interns who received a full-time offer (PPO) after the internship — tracked branch-wise, not just as one campus total.",
    side: "top",
    align: "start",
  },
  {
    id: "company-tab-stats-branch-wise",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-tab-stats-branch-table"]',
    fallbackSelector: '[data-tour="company-tab-stats-branch"]',
    prepare: "prepareCompanyTourStep",
    title: "Branch-wise breakdown",
    description:
      "Each row is one branch: Got in, Converted, and acceptance % side by side. Compare how conversion differed across branches for the same drive.",
    side: "top",
    align: "center",
  },
  {
    id: "company-tab-general-eligibility",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-tab-general-eligibility"]',
    fallbackSelector: '[data-tour="company-tab-general-panel"]',
    prepare: "prepareCompanyTourStep",
    title: "Eligibility",
    description:
      "CGPA cutoffs, allowed branches, degree types, and any extra criteria for the selected year's drive — check this before applying or prepping.",
    side: "top",
    align: "start",
  },
  {
    id: "company-tab-general-visit-date",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-tab-general-visit-date"]',
    fallbackSelector: '[data-tour="company-tab-general-eligibility"]',
    prepare: "prepareCompanyTourStep",
    title: "Date of visit",
    description:
      "When the company visited campus for this placement year — useful for timelines and knowing which batch's process you're reading.",
    side: "top",
    align: "start",
  },
  {
    id: "company-tab-general-roles-ctc",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-tab-general-roles-ctc"]',
    fallbackSelector: '[data-tour="company-tab-general-panel"]',
    prepare: "prepareCompanyTourStep",
    title: "Roles & CTC",
    description:
      "Each role lists CTC breakdown — base, stocks, bonus — and internship stipend where applicable. Compare packages across roles before you pick a preference.",
    side: "top",
    align: "start",
  },
  {
    id: "company-tab-oa",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-tab-oa"]',
    fallbackSelector: '[data-tour="company-details-tabs"]',
    prepare: "prepareCompanyTourStep",
    title: "OA Questions",
    description:
      "Online assessment questions reported by seniors for that year's drive — aptitude, puzzles, and screening patterns to expect.",
    side: "bottom",
    align: "start",
  },
  {
    id: "company-tab-interview",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-tab-interview"]',
    fallbackSelector: '[data-tour="company-details-tabs"]',
    prepare: "prepareCompanyTourStep",
    title: "Interview Experience",
    description:
      "HR and technical interview questions, panel tips, and student write-ups from the selected year's process.",
    side: "bottom",
    align: "start",
  },
  {
    id: "company-add-interview-question",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-add-interview-question"]',
    fallbackSelector: '[data-tour="company-tab-interview"]',
    prepare: "prepareCompanyTourStep",
    title: "Add interview question",
    requiresAuth: true,
    description:
      "Logged in? Tap Add Interview Question to submit a question you faced — include the round, difficulty, and your solution if you have one. It goes for review before it appears for everyone.",
    side: "left",
    align: "end",
  },
  {
    id: "company-tab-internship",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-tab-internship"]',
    fallbackSelector: '[data-tour="company-details-tabs"]',
    prepare: "prepareCompanyTourStep",
    title: "Internship Experience",
    description:
      "Internship-specific rounds and PPO notes when the company ran an intern drive that year.",
    side: "bottom",
    align: "start",
  },
  {
    id: "company-tab-mustdo",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-tab-mustdo"]',
    fallbackSelector: '[data-tour="company-details-tabs"]',
    prepare: "prepareCompanyTourStep",
    title: "Must Do Topics",
    description:
      "Curated prep checklist — DSA topics, CS fundamentals, and company-specific areas seniors recommend before the interview.",
    side: "bottom",
    align: "start",
  },
  {
    id: "company-request-more-details",
    route: "/companystats?tier=dream",
    selector: '[data-tour="company-detail-request-more"]',
    fallbackSelector: '[data-tour="company-details-header"]',
    prepare: "navigateToPhonePeCompany",
    title: "Request more details",
    requiresAuth: true,
    description:
      `On a company page like ${TOUR_EXAMPLE_COMPANY}, use Request more details when eligibility, roles, visit date, or other info is missing — admins get a one-time alert to update the page.`,
    side: "bottom",
    align: "start",
  },
  {
    id: "company-tab-coding",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-tab-coding-panel"]',
    fallbackSelector: '[data-tour="company-tab-coding"]',
    prepare: "navigateToMicrosoftCodingCompany",
    title: "Coding questions",
    description:
      `${TOUR_CODING_EXAMPLE_COMPANY}: past coding questions with problem statements, difficulty, topics, solutions, and intuition notes. Expand each accordion to read full details and copy solution code when available.`,
    side: "top",
    align: "start",
  },
  {
    id: "company-ai-interview-explore",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-ai-interview-explore"]',
    fallbackSelector: '[data-tour="company-details-tabs"]',
    prepare: "prepareCompanyTourStep",
    title: "Explore AI interview",
    requiresAuth: true,
    description:
      `Tap this floating button on any CS company page (like ${TOUR_PPO_EXAMPLE_COMPANY}) to jump straight into the AI Interview tab without hunting through the tab bar.`,
    side: "left",
    align: "end",
  },
  {
    id: "company-ai-interview-setup",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-ai-interview-setup"]',
    fallbackSelector: '[data-tour="company-ai-interview-explore"]',
    prepare: "prepareCompanyTourStep",
    title: "Configure your mock interview",
    requiresAuth: true,
    description:
      "Pick 1–4 rounds (DSA, System Design, SQL, CS Fundamentals, HR), and set difficulty for each. Drag rounds to reorder — at least one HR round is required.",
    side: "top",
    align: "center",
  },
  {
    id: "company-ai-interview-start",
    route: "/companystats?tier=summer_internship",
    selector: '[data-tour="company-ai-interview-start"]',
    fallbackSelector: '[data-tour="company-ai-interview-setup"]',
    prepare: "prepareCompanyTourStep",
    title: "Start Interview",
    requiresAuth: true,
    description:
      "When your plan is ready, click this Start Interview button (top right of the AI tab). The AI asks real questions from student submissions, gives feedback after each answer, and shows a round summary when you finish.",
    side: "bottom",
    align: "center",
  },
  {
    id: "ai-interviews-hero",
    route: "/interviews",
    selector: '[data-tour="ai-interviews-hero"]',
    title: "AI Interviews hub",
    requiresAuth: true,
    description:
      "Your home for all mock interviews — review past sessions, scores, and feedback in one place after practicing on a company page.",
    side: "bottom",
    align: "start",
  },
  {
    id: "ai-interviews-sessions",
    route: "/interviews",
    selector: '[data-tour="ai-interviews-tabs"]',
    prepare: "openAiInterviewSessions",
    title: "My Interviews",
    requiresAuth: true,
    description:
      "Each completed mock interview appears here grouped by company. Expand a session to read your answers, AI feedback, and round-by-round breakdown.",
    side: "bottom",
    align: "start",
  },
  {
    id: "ai-interviews-analytics",
    route: "/interviews",
    selector: '[data-tour="ai-interviews-analytics"]',
    fallbackSelector: '[data-tour="ai-interviews-tabs"]',
    prepare: "openAnalyticsTab",
    title: "Performance Analytics",
    requiresAuth: true,
    description:
      "Charts of your mock interview scores over time, strengths vs weaknesses by topic, and trends to track improvement across companies and rounds.",
    side: "bottom",
    align: "start",
  },
  {
    id: "resume-intro",
    route: "/resume-builder",
    selector: '[data-tour="resume-hero"]',
    title: "Resume builder",
    requiresAuth: true,
    requiresResumeBuilder: true,
    description:
      "Build an ATS-friendly resume with live preview. Your draft auto-saves while you are logged in.",
    side: "bottom",
    align: "start",
  },
  {
    id: "resume-toolbar",
    route: "/resume-builder",
    selector: '[data-tour="resume-toolbar"]',
    title: "Save & export",
    requiresAuth: true,
    requiresResumeBuilder: true,
    description:
      "Save anytime or Export Word when ready — validation runs before download.",
    side: "bottom",
    align: "end",
  },
  {
    id: "resume-ats-score",
    route: "/resume-builder",
    selector: '[data-tour="resume-ats-score"]',
    fallbackSelector: '[data-tour="resume-ats-run"]',
    title: "ATS Score",
    requiresAuth: true,
    requiresResumeBuilder: true,
    description:
      "Tap Run ATS Analysis to generate your Overall ATS Score. The circular score rates completeness, structure, impact, and professionalism — plus a breakdown and improvement checklist.",
    side: "bottom",
    align: "center",
  },
  {
    id: "resume-editor",
    route: "/resume-builder",
    selector: '[data-tour="resume-editor"]',
    title: "Resume sections",
    requiresAuth: true,
    requiresResumeBuilder: true,
    description:
      "Fill personal details, skills, education, projects, experience, certifications, and achievements.",
    side: "right",
    align: "start",
  },
  {
    id: "resume-preview",
    route: "/resume-builder",
    selector: '[data-tour="resume-preview"]',
    title: "Live preview",
    requiresAuth: true,
    requiresResumeBuilder: true,
    description:
      "See exactly how your resume will look before exporting.",
    side: "left",
    align: "start",
  },
  {
    id: "resources-intro",
    route: "/resources",
    selector: '[data-tour="resources-hero"]',
    title: "Study resources",
    requiresAuth: true,
    description:
      "Curated links for aptitude, DSA, system design, and interview prep — search and filter by topic or type.",
    side: "bottom",
    align: "start",
  },
  {
    id: "resources-grid",
    route: "/resources",
    selector: '[data-tour="resources-grid"]',
    title: "Resource categories",
    requiresAuth: true,
    description:
      "Browse by category — each card opens guides, courses, or practice material in a new tab.",
    side: "top",
    align: "center",
  },
  {
    id: "events-intro",
    route: "/events",
    selector: '[data-tour="events-hero"]',
    title: "Events hub",
    requiresAuth: true,
    description:
      "Your single place for campus placement drives, hackathons, workshops, competitions, and pre-placement talks — stay on top of deadlines so you never miss a registration.",
    side: "bottom",
    align: "start",
  },
  {
    id: "events-stats",
    route: "/events",
    selector: '[data-tour="events-stats"]',
    fallbackSelector: '[data-tour="events-hero"]',
    title: "Event dashboard",
    requiresAuth: true,
    description:
      "Three at-a-glance counts: total events listed, how many are still upcoming, and how many you have marked as registered on this portal.",
    side: "bottom",
    align: "center",
  },
  {
    id: "events-filters",
    route: "/events",
    selector: '[data-tour="events-filters"]',
    fallbackSelector: '[data-tour="events-hero"]',
    title: "Search & filter events",
    requiresAuth: true,
    description:
      "Search by event name or organizer. Filter All, Upcoming, or Expired — upcoming shows drives you can still register for; expired shows past deadlines.",
    side: "bottom",
    align: "start",
  },
  {
    id: "events-list",
    route: "/events",
    selector: '[data-tour="events-list"]',
    fallbackSelector: '[data-tour="events-hero"]',
    title: "Register & track events",
    requiresAuth: true,
    description:
      "Each row shows the event type tag, registration deadline, and days left. Open registration goes to the external sign-up page. After registering elsewhere, tap Mark registered here to track it. Urgent deadlines (7 days or less) are highlighted.",
    side: "top",
    align: "center",
  },
  {
    id: "leaderboard-intro",
    route: "/leaderboard",
    selector: '[data-tour="leaderboard-hero"]',
    title: "Contributor Leaderboard",
    requiresAuth: true,
    description:
      "Students earn points by sharing interview questions and experiences. The leaderboard ranks top contributors who help juniors prepare.",
    side: "bottom",
    align: "start",
  },
  {
    id: "leaderboard-yesterday",
    route: "/leaderboard",
    selector: '[data-tour="leaderboard-yesterday"]',
    fallbackSelector: '[data-tour="leaderboard-hero"]',
    title: "Yesterday's top contributor",
    requiresAuth: true,
    description:
      "Highlights who contributed the most approved submissions yesterday — a daily shout-out for active helpers on the platform.",
    side: "bottom",
    align: "start",
  },
  {
    id: "leaderboard-points",
    route: "/leaderboard",
    selector: '[data-tour="leaderboard-points"]',
    fallbackSelector: '[data-tour="leaderboard-hero"]',
    title: "How points work",
    requiresAuth: true,
    description:
      "Earn +5 points for each approved question and +10 points for each approved interview experience you submit. Contribute via My Submissions to climb the board.",
    side: "bottom",
    align: "center",
  },
  {
    id: "leaderboard-search",
    route: "/leaderboard",
    selector: '[data-tour="leaderboard-search"]',
    fallbackSelector: '[data-tour="leaderboard-hero"]',
    title: "Find contributors",
    requiresAuth: true,
    description:
      "Search by username to find a specific contributor or see where friends rank on the board.",
    side: "bottom",
    align: "start",
  },
  {
    id: "leaderboard-rankings",
    route: "/leaderboard",
    selector: '[data-tour="leaderboard-rankings"]',
    fallbackSelector: '[data-tour="leaderboard-hero"]',
    title: "Rankings & podium",
    requiresAuth: true,
    description:
      "Top 2 contributors get podium cards. Everyone else appears in the ranked list with points, question/experience counts, and a highlighted row for your own rank. Use Show all to expand the full list.",
    side: "top",
    align: "center",
  },
  {
    id: "profile",
    route: "/profile",
    selector: '[data-tour="student-profile"]',
    title: "View profile",
    requiresAuth: true,
    description:
      "Your student profile shows personal details, branch info, and placement data linked to your account.",
    side: "bottom",
    align: "start",
  },
  {
    id: "profile-discrepancy",
    route: "/profile",
    selector: '[data-tour="student-profile-discrepancy"]',
    fallbackSelector: '[data-tour="student-profile"]',
    title: "Discrepancies found",
    requiresAuth: true,
    description:
      "Wrong company, offer type, or stipend on your placement profile? Tap Discrepancies found to notify admins — you can only send this request once.",
    side: "bottom",
    align: "start",
  },
  {
    id: "submissions",
    route: "/my-submissions",
    selector: '[data-tour="my-submissions"]',
    title: "My submissions",
    requiresAuth: true,
    description:
      "Track questions, experiences, and other contributions you submitted — including pending and approved status.",
    side: "bottom",
    align: "start",
  },
];

/**
 * @param {{ isLoggedIn: boolean; includeAiInterviews: boolean; includeResumeBuilder: boolean }} options
 * @returns {ProductTourStep[]}
 */
export function getStudentTourSteps({
  isLoggedIn,
  includeAiInterviews,
  includeResumeBuilder,
}) {
  return STUDENT_TOUR_STEPS_BASE.filter((step) => {
    if (step.requiresAuth && !isLoggedIn) return false;
    if (step.requiresResumeBuilder && !includeResumeBuilder) return false;
    if (
      (step.id === "company-ai-interview-explore" ||
        step.id === "company-ai-interview-setup" ||
        step.id === "company-ai-interview-start" ||
        step.id === "ai-interviews-hero" ||
        step.id === "ai-interviews-sessions" ||
        step.id === "ai-interviews-analytics") &&
      !includeAiInterviews
    ) {
      return false;
    }
    return true;
  });
}
