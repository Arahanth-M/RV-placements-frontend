import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCopy, FaExternalLinkAlt, FaTimes, FaUsers, FaVideo } from "react-icons/fa";
import { useAuth } from "../utils/AuthContext";
import { interviewAPI } from "../utils/api";
import { useTenantShell } from "../context/TenantShellContext.jsx";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

const SESSION_TYPE_OPTIONS = [
  {
    id: "mock_interview",
    label: "Peer Interview",
    blurb: "Practice interviewing with a fellow student (2 people).",
    defaultMax: 2,
    maxCap: 2,
    joinNotePrompt: "Why do you want to join in this mock?",
    joinNotePlaceholder: "e.g. To prepare for interviews, happy to give feedback on answers",
  },
  {
    id: "study_group",
    label: "Study group",
    blurb: "Revise topics together online.",
    defaultMax: 4,
    maxCap: 8,
    joinNotePrompt: "What are you revising, and how will you contribute?",
    joinNotePlaceholder: "e.g. Revising OS scheduling — happy to quiz each other on concepts",
  },
  {
    id: "doubt_clarification",
    label: "Doubt clarification",
    blurb: "Get unstuck on a concept or problem.",
    defaultMax: 2,
    maxCap: 4,
    joinNotePrompt: "Why do you want to join this session?",
    joinNotePlaceholder: "e.g. I'm good at this concept…",
  },
];

function joinNoteMetaForType(sessionType) {
  return (
    SESSION_TYPE_OPTIONS.find((t) => t.id === sessionType) || {
      joinNotePrompt: "Why do you want to join this session?",
      joinNotePlaceholder: "Short note for the host…",
    }
  );
}

const TAB_BROWSE = "browse";
const TAB_CREATE = "create";
const TAB_ALL = "all";

const ROLE_FILTER_ALL = "all";
const ROLE_FILTER_HOSTING = "hosting";
const ROLE_FILTER_JOINED = "joined";
const ROLE_FILTER_PENDING = "pending";

const STATUS_FILTER_ALL = "all";
const STATUS_FILTER_ACTIVE = "active";
const STATUS_FILTER_ENDED = "ended";

/** IST is UTC+05:30 (no DST). */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Current / given instant as `YYYY-MM-DDTHH:mm` in IST (for datetime-local). */
function toIstDatetimeLocalValue(date = new Date()) {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return `${ist.getUTCFullYear()}-${pad2(ist.getUTCMonth() + 1)}-${pad2(ist.getUTCDate())}T${pad2(
    ist.getUTCHours()
  )}:${pad2(ist.getUTCMinutes())}`;
}

function defaultSlotLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  return toIstDatetimeLocalValue(d);
}

/** Interpret datetime-local value as IST wall clock → UTC ISO. */
function istDatetimeLocalToUtcIso(localStr) {
  const m = String(localStr || "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const utcMs =
    Date.UTC(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      0,
      0
    ) - IST_OFFSET_MS;
  return new Date(utcMs).toISOString();
}

function formatSlot(iso) {
  if (!iso) return "";
  try {
    return (
      new Date(iso).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " IST"
    );
  } catch {
    return "";
  }
}

function formatSlotRange(startIso, endIso) {
  if (!startIso) return "";
  const start = formatSlot(startIso);
  if (!endIso) return start;
  try {
    const endTime = new Date(endIso).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      timeStyle: "short",
    });
    return `${start} → ${endTime} IST`;
  } catch {
    return start;
  }
}

function defaultEndLocalFromStart(startLocal) {
  const startIso = istDatetimeLocalToUtcIso(startLocal);
  if (!startIso) return "";
  return toIstDatetimeLocalValue(new Date(new Date(startIso).getTime() + 30 * 60 * 1000));
}

function statusBadgeClass(status) {
  if (status === "open") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (status === "requested") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  if (status === "full") return "border-theme-accent/30 bg-theme-accent/10 text-theme-accent";
  if (status === "cancelled") return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300";
  return "border-theme bg-theme-hero text-theme-secondary";
}

/** Viewer-facing label — pending joiners see "requested" instead of "open". */
function displaySessionStatus(session) {
  if (session?.isPendingRequest) return "requested";
  return session?.status || "";
}

function MeetLinkCard({ session }) {
  const [copied, setCopied] = useState(false);
  const meetLink = session?.meetLink || "";
  const status = session?.meetLinkStatus || "hidden";
  const message = session?.meetLinkMessage || "";

  if (status !== "available" || !meetLink) {
    return (
      <div className="rounded-xl border border-theme bg-theme-hero/70 px-4 py-3 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-theme-secondary flex items-center gap-1.5">
          <FaVideo className="h-3 w-3" />
          Meeting link
        </p>
        <p className="text-sm text-theme-secondary">
          {message || "Meeting link is locked until you’re accepted and the session time starts."}
        </p>
        {status === "too_early" && session?.meetAvailableAt ? (
          <p className="text-[11px] text-theme-accent font-medium">
            Unlocks: {formatSlot(session.meetAvailableAt)}
          </p>
        ) : null}
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(meetLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-xl border border-theme-accent/35 bg-theme-accent/5 px-4 py-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-theme-accent flex items-center gap-1.5">
        <FaVideo className="h-3 w-3" />
        Meeting link
      </p>
      <p className="text-sm text-theme-primary break-all font-medium">{meetLink}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={meetLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          Join Google Meet <FaExternalLinkAlt className="h-2.5 w-2.5" />
        </a>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:text-theme-accent"
        >
          <FaCopy className="h-2.5 w-2.5" />
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p className="text-[11px] text-theme-secondary">{message}</p>
      <p className="text-[11px] text-theme-secondary">
        Don&apos;t share this link. Approved people are added as Meet guests; others should have to
        knock (or be blocked) depending on Google&apos;s access settings.
      </p>
    </div>
  );
}

function SessionCard({
  session,
  busyId,
  onRequestJoin,
  onCancel,
  onLeave,
  onCancelRequest,
  onAccept,
  onReject,
  showMeet,
}) {
  const seats = `${session.participantCount}/${session.maxParticipants}`;
  const busy = Boolean(busyId);
  const [codeCopied, setCodeCopied] = useState(false);

  const copyInviteCode = async () => {
    if (!session.inviteCode) return;
    try {
      await navigator.clipboard.writeText(session.inviteCode);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <article className="rounded-2xl border border-theme bg-theme-card p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-theme-accent">
            {session.sessionTypeLabel || session.sessionType}
          </p>
          <h3 className="mt-1 text-base font-semibold text-theme-primary break-words">
            {session.topic}
          </h3>
          <p className="mt-1 text-sm text-theme-secondary">
            {formatSlotRange(session.slotStart, session.slotEnd)}
          </p>
          {session.inviteCode ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs text-theme-primary">
                Session code:{" "}
                <span className="font-bold tracking-widest text-theme-accent text-sm">
                  {session.inviteCode}
                </span>
              </p>
              {session.isHost ? (
                <button
                  type="button"
                  onClick={copyInviteCode}
                  className="inline-flex items-center gap-1 rounded-lg border border-theme px-2 py-0.5 text-[11px] font-semibold text-theme-secondary hover:text-theme-accent"
                >
                  <FaCopy className="h-2.5 w-2.5" />
                  {codeCopied ? "Copied" : "Copy code"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusBadgeClass(
            displaySessionStatus(session)
          )}`}
        >
          {displaySessionStatus(session)}
        </span>
      </div>

      {session.notes ? (
        <p className="text-sm text-theme-secondary whitespace-pre-wrap">{session.notes}</p>
      ) : null}

      <p className="text-xs text-theme-secondary flex items-center gap-1.5">
        <FaUsers className="h-3 w-3" />
        {seats} accepted
        {session.seatsLeft != null ? ` · ${session.seatsLeft} seat${session.seatsLeft === 1 ? "" : "s"} left` : ""}
        {session.pendingRequestCount > 0 ? ` · ${session.pendingRequestCount} waiting` : ""}
        {session.isHost ? " · You’re the host" : ""}
        {session.isJoined && !session.isHost ? " · Accepted" : ""}
        {session.isPendingRequest ? " · Request pending" : ""}
      </p>

      {showMeet && (session.isJoined || session.isPendingRequest || session.isHost) ? (
        <MeetLinkCard session={session} />
      ) : null}

      {session.isHost && Array.isArray(session.joinRequests) && session.joinRequests.length > 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Join requests
          </p>
          {session.joinRequests.map((req) => (
            <div
              key={req.userId}
              className="flex flex-wrap items-start justify-between gap-2 text-xs text-theme-primary border-t border-amber-500/15 pt-2 first:border-0 first:pt-0"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p>
                  {req.name || "Student"}
                  {req.email ? (
                    <span className="text-theme-secondary"> · {req.email}</span>
                  ) : null}
                </p>
                {req.note ? (
                  <p className="rounded-lg bg-theme-hero/80 px-2.5 py-1.5 text-[11px] text-theme-secondary whitespace-pre-wrap">
                    {req.note}
                  </p>
                ) : null}
              </div>
              <span className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onAccept(session.id, req.userId)}
                  className="rounded-lg bg-theme-accent px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onReject(session.id, req.userId)}
                  className="rounded-lg border border-theme px-2.5 py-1 text-[11px] font-semibold text-theme-secondary disabled:opacity-50"
                >
                  Decline
                </button>
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {(session.isJoined || session.isHost) &&
      Array.isArray(session.participants) &&
      session.participants.length > 0 ? (
        <div className="rounded-xl border border-theme bg-theme-hero/60 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-theme-secondary mb-1">
            Accepted participants
          </p>
          <ul className="space-y-1">
            {session.participants.map((p) => (
              <li key={p.userId} className="text-xs text-theme-primary">
                {p.name || "Student"}
                {p.email ? (
                  <span className="text-theme-secondary"> · {p.email}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-1">
        {!session.isJoined &&
        !session.isPendingRequest &&
        !session.isHost &&
        session.status === "open" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onRequestJoin(session)}
            className="rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busyId === session.id ? "Requesting…" : "Request to join"}
          </button>
        ) : null}
        {session.isPendingRequest ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onCancelRequest(session.id)}
            className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-secondary hover:text-theme-accent disabled:opacity-50"
          >
            Cancel request
          </button>
        ) : null}
        {session.isHost && (session.status === "open" || session.status === "full") ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onCancel(session.id)}
            className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-secondary hover:text-red-500 disabled:opacity-50"
          >
            Cancel session
          </button>
        ) : null}
        {session.isJoined && !session.isHost && (session.status === "open" || session.status === "full") ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onLeave(session.id)}
            className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-secondary hover:text-theme-accent disabled:opacity-50"
          >
            Leave (free seat)
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function PeerSessionsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { appPath } = useTenantShell();

  const [tab, setTab] = useState(TAB_BROWSE);
  const [openSessions, setOpenSessions] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [allFilterType, setAllFilterType] = useState("");
  const [allRoleFilter, setAllRoleFilter] = useState(ROLE_FILTER_ALL);
  const [allStatusFilter, setAllStatusFilter] = useState(STATUS_FILTER_ACTIVE);
  const [codeQuery, setCodeQuery] = useState("");
  const [codeResult, setCodeResult] = useState(null);
  const [joinTarget, setJoinTarget] = useState(null);
  const [joinNote, setJoinNote] = useState("");
  const [joinFormError, setJoinFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const [sessionType, setSessionType] = useState("mock_interview");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [slotLocal, setSlotLocal] = useState(defaultSlotLocal);
  const [slotEndLocal, setSlotEndLocal] = useState(() => defaultEndLocalFromStart(defaultSlotLocal()));
  const [maxParticipants, setMaxParticipants] = useState(2);

  const typeMeta = useMemo(
    () => SESSION_TYPE_OPTIONS.find((t) => t.id === sessionType) || SESSION_TYPE_OPTIONS[0],
    [sessionType]
  );

  useEffect(() => {
    setMaxParticipants(typeMeta.defaultMax);
  }, [typeMeta.defaultMax]);

  useEffect(() => {
    if (tab === TAB_CREATE) {
      const start = defaultSlotLocal();
      setSlotLocal(start);
      setSlotEndLocal(defaultEndLocalFromStart(start));
    }
  }, [tab]);

  const applySessionUpdate = useCallback((session) => {
    if (!session?.id) return;
    setMySessions((prev) => {
      const idx = prev.findIndex((s) => s.id === session.id);
      if (idx < 0) return [session, ...prev];
      const next = prev.slice();
      next[idx] = session;
      return next;
    });
    setOpenSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === session.id);
      if (idx < 0) return prev;
      // Accepted / full sessions leave the open browse list for non-hosts.
      if (session.isJoined || session.status !== "open") {
        return prev.filter((s) => s.id !== session.id);
      }
      const next = prev.slice();
      next[idx] = session;
      return next;
    });
    setCodeResult((prev) => (prev?.id === session.id ? session : prev));
  }, []);

  const loadLists = useCallback(async ({ silent = false } = {}) => {
    if (!user?.userId && !user?._id) return;
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const [openRes, mineRes] = await Promise.all([
        interviewAPI.listOpenPeerSessions({
          sessionType: filterType || undefined,
        }),
        interviewAPI.listMyPeerSessions(),
      ]);
      setOpenSessions(Array.isArray(openRes?.data?.sessions) ? openRes.data.sessions : []);
      setMySessions(Array.isArray(mineRes?.data?.sessions) ? mineRes.data.sessions : []);
    } catch (err) {
      if (!silent) {
        setError(
          err?.response?.data?.error || err?.message || "Could not load peer sessions."
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.userId, user?._id, filterType]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  // Poll so: (1) requesters see Accept, (2) organizers see new join requests — without Refresh.
  const hasPendingJoin = useMemo(
    () => mySessions.some((s) => s?.isPendingRequest),
    [mySessions]
  );
  const isHostingOpenSession = useMemo(
    () =>
      mySessions.some(
        (s) => s?.isHost && (s.status === "open" || s.status === "full")
      ),
    [mySessions]
  );
  const shouldLivePoll = hasPendingJoin || isHostingOpenSession;

  useEffect(() => {
    if (!shouldLivePoll) return undefined;
    const id = window.setInterval(() => {
      loadLists({ silent: true });
    }, 4000);
    return () => window.clearInterval(id);
  }, [shouldLivePoll, loadLists]);

  const filteredAllSessions = useMemo(() => {
    return mySessions.filter((session) => {
      if (allFilterType && session.sessionType !== allFilterType) return false;
      if (allRoleFilter === ROLE_FILTER_HOSTING && !session.isHost) return false;
      if (allRoleFilter === ROLE_FILTER_JOINED && !(session.isJoined && !session.isHost)) {
        return false;
      }
      if (allRoleFilter === ROLE_FILTER_PENDING && !session.isPendingRequest) return false;
      const status = String(session.status || "");
      if (allStatusFilter === STATUS_FILTER_ACTIVE) {
        if (status !== "open" && status !== "full") return false;
      } else if (allStatusFilter === STATUS_FILTER_ENDED) {
        if (status !== "completed" && status !== "cancelled") return false;
      }
      return true;
    });
  }, [mySessions, allFilterType, allRoleFilter, allStatusFilter]);

  const createSession = async (e) => {
    e.preventDefault();
    setBusyId("create");
    setError("");
    try {
      const slotStartIso = istDatetimeLocalToUtcIso(slotLocal);
      const slotEndIso = istDatetimeLocalToUtcIso(slotEndLocal);
      if (!slotStartIso || !slotEndIso) {
        setError("Pick a valid start and end time (IST).");
        return;
      }
      if (new Date(slotEndIso).getTime() <= new Date(slotStartIso).getTime()) {
        setError("End time must be after start time.");
        return;
      }
      await interviewAPI.createPeerSession({
        sessionType,
        topic,
        notes,
        slotStart: slotStartIso,
        slotEnd: slotEndIso,
        maxParticipants,
      });
      setTopic("");
      setNotes("");
      const start = defaultSlotLocal();
      setSlotLocal(start);
      setSlotEndLocal(defaultEndLocalFromStart(start));
      setTab(TAB_ALL);
      await loadLists();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not create session.");
    } finally {
      setBusyId("");
    }
  };

  const searchByCode = async (e) => {
    e?.preventDefault?.();
    const code = String(codeQuery || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (code.length < 4) {
      setError("Enter a session code (at least 4 characters).");
      return;
    }
    setBusyId("code-search");
    setError("");
    setCodeResult(null);
    try {
      const { data } = await interviewAPI.findPeerSessionByCode(code);
      setCodeResult(data.session || null);
      if (!data.session) setError("No session found for that code.");
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not find session.");
    } finally {
      setBusyId("");
    }
  };

  const clearCodeSearch = () => {
    setCodeQuery("");
    setCodeResult(null);
    setError("");
  };

  const openJoinRequest = (session) => {
    setJoinTarget(session);
    setJoinNote("");
    setJoinFormError("");
    setError("");
  };

  const closeJoinRequest = () => {
    setJoinTarget(null);
    setJoinNote("");
    setJoinFormError("");
  };

  const submitJoinRequest = async (e) => {
    e?.preventDefault?.();
    if (!joinTarget?.id) return;
    const note = String(joinNote || "").trim();
    if (note.length < 8) {
      setJoinFormError("Add a short note for the host (at least 8 characters).");
      return;
    }
    setBusyId(joinTarget.id);
    setJoinFormError("");
    try {
      const { data } = await interviewAPI.requestJoinPeerSession({
        sessionId: joinTarget.id,
        note,
      });
      closeJoinRequest();
      setCodeResult(null);
      if (data?.session) applySessionUpdate(data.session);
      setTab(TAB_ALL);
      await loadLists({ silent: true });
    } catch (err) {
      const data = err?.response?.data;
      setJoinFormError(
        data?.error ||
          data?.errors?.[0] ||
          data?.message ||
          err?.message ||
          "Could not request to join."
      );
    } finally {
      setBusyId("");
    }
  };

  const requestJoin = openJoinRequest;

  const cancelSession = async (sessionId) => {
    setBusyId(sessionId);
    setError("");
    try {
      const { data } = await interviewAPI.cancelPeerSession(sessionId);
      if (data?.session) applySessionUpdate(data.session);
      else await loadLists({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not cancel.");
    } finally {
      setBusyId("");
    }
  };

  const leaveSession = async (sessionId) => {
    setBusyId(sessionId);
    setError("");
    try {
      const { data } = await interviewAPI.leavePeerSession(sessionId);
      if (data?.session) applySessionUpdate(data.session);
      else await loadLists({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not leave.");
    } finally {
      setBusyId("");
    }
  };

  const cancelRequest = async (sessionId) => {
    setBusyId(sessionId);
    setError("");
    try {
      const { data } = await interviewAPI.cancelPeerJoinRequest(sessionId);
      if (data?.session) applySessionUpdate(data.session);
      else await loadLists({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not cancel request.");
    } finally {
      setBusyId("");
    }
  };

  const acceptRequest = async (sessionId, requesterUserId) => {
    setBusyId(`${sessionId}:accept:${requesterUserId}`);
    setError("");
    try {
      const { data } = await interviewAPI.acceptPeerJoinRequest(sessionId, requesterUserId);
      if (data?.session) applySessionUpdate(data.session);
      else await loadLists({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not accept request.");
    } finally {
      setBusyId("");
    }
  };

  const rejectRequest = async (sessionId, requesterUserId) => {
    setBusyId(`${sessionId}:reject:${requesterUserId}`);
    setError("");
    try {
      const { data } = await interviewAPI.rejectPeerJoinRequest(sessionId, requesterUserId);
      if (data?.session) applySessionUpdate(data.session);
      else await loadLists({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not decline request.");
    } finally {
      setBusyId("");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-theme-secondary">
        Loading…
      </div>
    );
  }

  const tabs = [
    { id: TAB_BROWSE, label: "Browse for sessions" },
    { id: TAB_CREATE, label: "Host a session" },
    { id: TAB_ALL, label: "All sessions" },
  ];

  return (
    <div className={pageShellOuterClassCompact}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(appPath("/"))} label="Back" />
        </PageBackNavRow>

        <PageHeroHeader subtitle="Book an online Google Meet session (auto-created) for mock interviews, study groups, or doubts. Times are in IST. when others request to join, you accept. The Meet link unlocks for accepted members during the session window. Share your session code from All sessions with your friends to make them join easily.">
          Peer{" "}
          <span className="italic text-theme-accent">sessions</span>
        </PageHeroHeader>

        <div className="mx-auto max-w-3xl space-y-5">
          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          ) : null}

          {joinTarget ? (
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 py-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="peer-join-request-title"
              onClick={(e) => {
                if (e.target === e.currentTarget && busyId !== joinTarget.id) {
                  closeJoinRequest();
                }
              }}
            >
              <div className="relative w-full max-w-md max-h-[min(90vh,560px)] overflow-y-auto rounded-2xl border border-theme bg-theme-card shadow-2xl p-5 sm:p-6">
                <button
                  type="button"
                  onClick={closeJoinRequest}
                  disabled={busyId === joinTarget.id}
                  className="absolute right-3 top-3 rounded-lg p-2 text-theme-secondary hover:text-theme-primary disabled:opacity-50"
                  aria-label="Close"
                >
                  <FaTimes className="h-4 w-4" />
                </button>

                <h2
                  id="peer-join-request-title"
                  className="text-lg font-semibold text-theme-primary pr-8"
                >
                  Request to join
                </h2>
                <p className="mt-1 text-sm text-theme-secondary">
                  {joinTarget.sessionTypeLabel || joinTarget.sessionType} · {joinTarget.topic}
                </p>

                <form onSubmit={submitJoinRequest} className="mt-4 space-y-3">
                  <label className="block text-sm font-semibold text-theme-primary">
                    {joinNoteMetaForType(joinTarget.sessionType).joinNotePrompt}
                    <textarea
                      value={joinNote}
                      onChange={(e) => {
                        setJoinNote(e.target.value);
                        if (joinFormError) setJoinFormError("");
                      }}
                      rows={3}
                      maxLength={400}
                      required
                      minLength={8}
                      autoFocus
                      placeholder={
                        joinNoteMetaForType(joinTarget.sessionType).joinNotePlaceholder
                      }
                      className="mt-1.5 w-full rounded-xl border border-theme bg-theme-hero px-3 py-2.5 text-sm font-normal outline-none focus:border-theme-accent resize-y"
                    />
                    <span className="mt-1 block text-[11px] font-normal text-theme-secondary">
                      Shared with the host when they review your request ·{" "}
                      {joinNote.trim().length}/400
                    </span>
                  </label>
                  {joinFormError ? (
                    <p className="text-sm text-red-600 dark:text-red-300">{joinFormError}</p>
                  ) : null}
                  <div className="flex flex-wrap justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={closeJoinRequest}
                      disabled={busyId === joinTarget.id}
                      className="rounded-xl border border-theme px-4 py-2.5 text-sm font-semibold text-theme-secondary hover:text-theme-primary disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={busyId === joinTarget.id || joinNote.trim().length < 8}
                      className="rounded-xl bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {busyId === joinTarget.id ? "Sending request…" : "Send request"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === t.id
                    ? "border-theme-accent bg-theme-accent/10 text-theme-primary"
                    : "border-theme text-theme-secondary hover:border-theme-accent/40"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === TAB_BROWSE ? (
            <section className="space-y-4">
              <form
                onSubmit={searchByCode}
                className="rounded-2xl border border-theme bg-theme-card p-4 flex flex-wrap items-end gap-2"
              >
                <label className="min-w-[12rem] flex-1 text-sm font-semibold text-theme-primary">
                  Find by session code
                  <input
                    value={codeQuery}
                    onChange={(e) => setCodeQuery(e.target.value.toUpperCase())}
                    placeholder="e.g. 7K2M9P"
                    maxLength={12}
                    className="mt-1.5 w-full rounded-xl border border-theme bg-theme-hero px-3 py-2.5 text-sm font-normal tracking-widest outline-none focus:border-theme-accent"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busyId === "code-search"}
                  className="rounded-xl bg-theme-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {busyId === "code-search" ? "Searching…" : "Search"}
                </button>
                {codeQuery || codeResult ? (
                  <button
                    type="button"
                    onClick={clearCodeSearch}
                    className="rounded-xl border border-theme px-4 py-2.5 text-sm font-semibold text-theme-secondary hover:text-theme-accent"
                  >
                    Clear
                  </button>
                ) : null}
              </form>

              {codeResult ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-theme-primary">Code match</p>
                  <SessionCard
                    session={codeResult}
                    busyId={busyId}
                    onRequestJoin={requestJoin}
                    onCancel={cancelSession}
                    onLeave={leaveSession}
                    onCancelRequest={cancelRequest}
                    onAccept={acceptRequest}
                    onReject={rejectRequest}
                    showMeet={false}
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm font-semibold text-theme-primary">
                  Filter
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="ml-2 rounded-lg border border-theme bg-theme-hero px-2 py-1.5 text-sm font-normal"
                  >
                    <option value="">All types</option>
                    {SESSION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => loadLists()}
                  className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:text-theme-accent"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <p className="text-sm text-theme-secondary">Loading open sessions…</p>
              ) : openSessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-theme px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-theme-primary">No open sessions right now</p>
                  <p className="mt-1 text-sm text-theme-secondary">
                    Host one and others on the platform can join.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab(TAB_CREATE)}
                    className="mt-4 rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white"
                  >
                    Host a session
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {openSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      busyId={busyId}
                      onRequestJoin={requestJoin}
                      onCancel={cancelSession}
                      onLeave={leaveSession}
                      onCancelRequest={cancelRequest}
                      onAccept={acceptRequest}
                      onReject={rejectRequest}
                      showMeet={false}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {tab === TAB_CREATE ? (
            <section className="rounded-2xl border border-theme bg-theme-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-theme-primary">Host an online session</h2>
              <p className="mt-1 text-sm text-theme-secondary">
                Open to any signed-in student. A Google Meet link is created automatically. Others
                request to join; you accept. After booking, find your session code under{" "}
                <span className="font-semibold text-theme-primary">All sessions</span> to share.
              </p>

              <form onSubmit={createSession} className="mt-5 space-y-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  {SESSION_TYPE_OPTIONS.map((opt) => {
                    const active = sessionType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSessionType(opt.id)}
                        className={`rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                          active
                            ? "border-theme-accent bg-theme-accent/10"
                            : "border-theme bg-theme-hero hover:border-theme-accent/40"
                        }`}
                      >
                        <span className="font-semibold text-theme-primary">{opt.label}</span>
                        <span className="mt-1 block text-[11px] text-theme-secondary">
                          {opt.blurb}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <label className="block text-sm font-semibold text-theme-primary">
                  Topic
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                    maxLength={160}
                    placeholder="e.g. Arrays & hashing, Why-company answers, DBMS doubts"
                    className="mt-1.5 w-full rounded-xl border border-theme bg-theme-hero px-3 py-2.5 text-sm font-normal outline-none focus:border-theme-accent"
                  />
                </label>

                <label className="block text-sm font-semibold text-theme-primary">
                  Notes (optional)
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="What to bring, focus areas, or how you’ll run the session."
                    className="mt-1.5 w-full rounded-xl border border-theme bg-theme-hero px-3 py-2.5 text-sm font-normal outline-none focus:border-theme-accent resize-y"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-theme-primary">
                    Start time (IST)
                    <input
                      type="datetime-local"
                      value={slotLocal}
                      min={defaultSlotLocal()}
                      onChange={(e) => {
                        const next = e.target.value;
                        setSlotLocal(next);
                        setSlotEndLocal(defaultEndLocalFromStart(next));
                      }}
                      required
                      className="mt-1.5 w-full rounded-xl border border-theme bg-theme-hero px-3 py-2.5 text-sm font-normal outline-none focus:border-theme-accent"
                    />
                    <span className="mt-1 block text-[11px] font-normal text-theme-secondary">
                      India Standard Time (UTC+05:30) · defaults to now
                    </span>
                  </label>
                  <label className="block text-sm font-semibold text-theme-primary">
                    End time (IST)
                    <input
                      type="datetime-local"
                      value={slotEndLocal}
                      min={slotLocal}
                      onChange={(e) => setSlotEndLocal(e.target.value)}
                      required
                      className="mt-1.5 w-full rounded-xl border border-theme bg-theme-hero px-3 py-2.5 text-sm font-normal outline-none focus:border-theme-accent"
                    />
                    <span className="mt-1 block text-[11px] font-normal text-theme-secondary">
                      Defaults to 30 min after start · 15 min–3 hours
                    </span>
                  </label>
                </div>

                <label className="block text-sm font-semibold text-theme-primary sm:max-w-xs">
                  Max people
                  <input
                    type="number"
                    min={2}
                    max={typeMeta.maxCap}
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value) || 2)}
                    className="mt-1.5 w-full rounded-xl border border-theme bg-theme-hero px-3 py-2.5 text-sm font-normal outline-none focus:border-theme-accent"
                  />
                  <span className="mt-1 block text-[11px] font-normal text-theme-secondary">
                    Up to {typeMeta.maxCap} for this type · Google Meet auto-created
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={busyId === "create" || topic.trim().length < 3}
                  className="rounded-xl bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {busyId === "create" ? "Creating Meet & booking…" : "Book session"}
                </button>
              </form>
            </section>
          ) : null}

          {tab === TAB_ALL ? (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-theme bg-theme-card px-3 py-3">
                <label className="text-sm font-semibold text-theme-primary">
                  Type
                  <select
                    value={allFilterType}
                    onChange={(e) => setAllFilterType(e.target.value)}
                    className="ml-2 rounded-lg border border-theme bg-theme-hero px-2 py-1.5 text-sm font-normal"
                  >
                    <option value="">All types</option>
                    {SESSION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-theme-primary">
                  Role
                  <select
                    value={allRoleFilter}
                    onChange={(e) => setAllRoleFilter(e.target.value)}
                    className="ml-2 rounded-lg border border-theme bg-theme-hero px-2 py-1.5 text-sm font-normal"
                  >
                    <option value={ROLE_FILTER_ALL}>All</option>
                    <option value={ROLE_FILTER_HOSTING}>Hosting</option>
                    <option value={ROLE_FILTER_JOINED}>Joined</option>
                    <option value={ROLE_FILTER_PENDING}>Pending request</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-theme-primary">
                  Status
                  <select
                    value={allStatusFilter}
                    onChange={(e) => setAllStatusFilter(e.target.value)}
                    className="ml-2 rounded-lg border border-theme bg-theme-hero px-2 py-1.5 text-sm font-normal"
                  >
                    <option value={STATUS_FILTER_ALL}>All</option>
                    <option value={STATUS_FILTER_ACTIVE}>Active</option>
                    <option value={STATUS_FILTER_ENDED}>Ended</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => loadLists()}
                  className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:text-theme-accent"
                >
                  Refresh
                </button>
                {shouldLivePoll ? (
                  <span className="text-[11px] text-theme-secondary">
                    {hasPendingJoin && isHostingOpenSession
                      ? "Live updates — join requests & approvals"
                      : hasPendingJoin
                        ? "Waiting for host approval… auto-updates"
                        : "Live updates — new join requests appear here"}
                  </span>
                ) : null}
              </div>

              {loading ? (
                <p className="text-sm text-theme-secondary">Loading sessions…</p>
              ) : mySessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-theme px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-theme-primary">No sessions yet</p>
                  <p className="mt-1 text-sm text-theme-secondary">
                    Host one or join an open session from Browse.
                  </p>
                </div>
              ) : filteredAllSessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-theme px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-theme-primary">No sessions match filters</p>
                  <p className="mt-1 text-sm text-theme-secondary">
                    Try another type, role, or status filter.
                  </p>
                </div>
              ) : (
                filteredAllSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    busyId={busyId}
                    onRequestJoin={requestJoin}
                    onCancel={cancelSession}
                    onLeave={leaveSession}
                    onCancelRequest={cancelRequest}
                    onAccept={acceptRequest}
                    onReject={rejectRequest}
                    showMeet
                  />
                ))
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
