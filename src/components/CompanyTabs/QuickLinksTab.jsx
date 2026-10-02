import { useEffect, useMemo, useState } from "react";
import { researchSourceLinkLabel } from "../../utils/researchSourceLabel.js";
import { classifyResearchSourceSite } from "../../utils/researchSourceSite.js";
import {
  buildPrepRoleTabs,
  hasRoleScopedPrepContentFromEntries,
  itemMatchesPrepRoleTab,
  pickDefaultPrepRoleTab,
} from "../../utils/prepRoleTabs.js";
import { FaTrash } from "react-icons/fa";
import PrepRoleChrome from "../PrepRoleChrome.jsx";
import PrepRoleSwitchShimmer from "../PrepRoleSwitchShimmer.jsx";
import { usePrepRoleSwitchTransition } from "../../hooks/usePrepRoleSwitchTransition.js";
import { platformAdminAPI } from "../../utils/api.js";

function safeHref(url) {
  const href = String(url || "").trim();
  if (!/^https?:\/\//i.test(href)) return "";
  return href;
}

function SourceLinkList({ links, isAdmin, onDelete, deletingUrl }) {
  if (!links.length) {
    return (
      <p className="text-sm text-theme-muted">No links in this group.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {links.map(({ source, href }, index) => (
        <li
          key={`${href}-${index}`}
          className="flex items-start justify-between gap-3 rounded-xl border border-theme bg-theme-card px-4 py-3 shadow-sm"
        >
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-theme-accent underline break-all sm:text-base"
          >
            {researchSourceLinkLabel(source)}
          </a>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => onDelete?.(href)}
              disabled={deletingUrl === href}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-400/60 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-60"
              title="Remove link"
            >
              <FaTrash className="h-3 w-3" />
              Delete
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default function QuickLinksTab({
  company = {},
  isAdmin = false,
  onCompanyUpdate,
}) {
  const sources = Array.isArray(company.researchSources) ? company.researchSources : [];
  const prepRoles = Array.isArray(company.prepRoles) ? company.prepRoles : [];
  const summaries = Array.isArray(company.researchLinksSummaries)
    ? company.researchLinksSummaries
    : [];

  const linkEntries = useMemo(
    () =>
      sources.filter((source) => {
        const href = safeHref(source?.url);
        return Boolean(href);
      }),
    [sources]
  );
  const sourceRoleKeys = useMemo(
    () => linkEntries.map((source) => String(source?.prepRoleKey ?? "")),
    [linkEntries]
  );
  const roleTabs = useMemo(
    () => buildPrepRoleTabs(prepRoles, sourceRoleKeys, { excludeGeneralTab: true }),
    [prepRoles, sourceRoleKeys]
  );
  const showRoleChrome = hasRoleScopedPrepContentFromEntries(prepRoles, linkEntries);

  /** `null` = user has not picked a tab yet; use smart default. */
  const [activePrepRoleKey, setActivePrepRoleKey] = useState(null);

  const effectivePrepRoleKey = useMemo(() => {
    if (!showRoleChrome) return "";
    const preferred = pickDefaultPrepRoleTab(prepRoles, sourceRoleKeys, {
      excludeGeneralTab: true,
    });
    if (activePrepRoleKey === null) return preferred;
    const candidate = roleTabs.some((tab) => tab.key === activePrepRoleKey)
      ? activePrepRoleKey
      : preferred;
    const hasLinks = sources.some(
      (source) =>
        itemMatchesPrepRoleTab(source?.prepRoleKey, candidate) && safeHref(source?.url)
    );
    return hasLinks ? candidate : preferred;
  }, [showRoleChrome, prepRoles, sourceRoleKeys, roleTabs, activePrepRoleKey, sources]);
  const roleSwitching = usePrepRoleSwitchTransition(
    showRoleChrome ? effectivePrepRoleKey : "__static__"
  );
  const [deletingUrl, setDeletingUrl] = useState("");

  const handleDeleteLink = async (url) => {
    if (!isAdmin || !company?._id) return;
    if (!window.confirm("Remove this quick link from the company?")) return;
    setDeletingUrl(url);
    try {
      await platformAdminAPI.deleteResearchSource(company._id, url);
      if (typeof onCompanyUpdate === "function") await onCompanyUpdate();
    } catch (err) {
      console.error(err);
      window.alert(err?.response?.data?.error || "Failed to delete link.");
    } finally {
      setDeletingUrl("");
    }
  };

  const roleFilteredSources = useMemo(() => {
    if (!showRoleChrome) return sources;
    return sources.filter((source) =>
      itemMatchesPrepRoleTab(source?.prepRoleKey, effectivePrepRoleKey)
    );
  }, [sources, showRoleChrome, effectivePrepRoleKey]);

  const activeSummary = useMemo(() => {
    const key = showRoleChrome ? effectivePrepRoleKey : "";
    const hit = summaries.find((row) => String(row?.prepRoleKey ?? "") === key);
    return String(hit?.summary || "").trim();
  }, [summaries, showRoleChrome, effectivePrepRoleKey]);

  const links = useMemo(
    () =>
      roleFilteredSources
        .map((source) => {
          const href = safeHref(source?.url);
          if (!href) return null;
          return {
            source,
            href,
            site: classifyResearchSourceSite(href),
          };
        })
        .filter(Boolean),
    [roleFilteredSources]
  );

  const groups = useMemo(() => {
    const buckets = new Map();
    for (const row of links) {
      const key = row.site.id;
      if (!buckets.has(key)) {
        buckets.set(key, { site: row.site, links: [] });
      }
      buckets.get(key).links.push(row);
    }
    return [...buckets.values()].sort((a, b) => {
      if (a.site.order !== b.site.order) return a.site.order - b.site.order;
      return a.site.label.localeCompare(b.site.label);
    });
  }, [links]);

  const [activeSiteId, setActiveSiteId] = useState("");

  useEffect(() => {
    if (!groups.length) {
      setActiveSiteId("");
      return;
    }
    const stillValid = groups.some((group) => group.site.id === activeSiteId);
    if (!stillValid) {
      setActiveSiteId(groups[0].site.id);
    }
  }, [groups, activeSiteId]);

  const activeGroup = groups.find((group) => group.site.id === activeSiteId) || groups[0];
  const hasAnyLinks = sources.length > 0;

  return (
    <div
      className="space-y-4 px-4 sm:px-6 lg:px-0 max-w-screen-xl mx-auto"
      data-testid="company-quick-links-tab"
    >
      {showRoleChrome ? (
        <PrepRoleChrome
          prepRoles={prepRoles}
          itemRoleKeys={sourceRoleKeys}
          activeKey={effectivePrepRoleKey}
          onChange={setActivePrepRoleKey}
          ariaLabel="Quick link roles"
          excludeGeneralTab
          switching={roleSwitching}
        />
      ) : null}

      {showRoleChrome && roleSwitching ? <PrepRoleSwitchShimmer /> : null}

      {!roleSwitching ? (
        <>
          {activeSummary ? (
            <div
              className="rounded-xl border border-theme bg-theme-card px-4 py-4 shadow-sm"
              data-testid="quick-links-role-summary"
            >
              <h3 className="text-sm font-semibold text-theme-primary">
                What this company tests on
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-theme-secondary whitespace-pre-wrap">
                {activeSummary}
              </p>
            </div>
          ) : null}

          {links.length > 0 ? (
            <div className="space-y-4">
              {groups.length > 1 ? (
                <div
                  className="flex w-full min-w-0 flex-wrap gap-2 rounded-xl border border-theme bg-theme-card p-1.5"
                  role="tablist"
                  aria-label="Quick link sources"
                >
                  {groups.map((group) => {
                    const selected = group.site.id === activeGroup?.site.id;
                    return (
                      <button
                        key={group.site.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-label={`${group.site.label} (${group.links.length})`}
                        onClick={() => setActiveSiteId(group.site.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                          selected
                            ? "bg-theme-accent text-white shadow-sm"
                            : "text-theme-secondary hover:bg-theme-nav hover:text-theme-primary"
                        }`}
                      >
                        {group.site.label}
                        <span className="ml-1.5 tabular-nums opacity-90">
                          ({group.links.length})
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div role="tabpanel">
                {activeGroup ? (
                  <>
                    {groups.length === 1 ? (
                      <p className="mb-3 text-sm font-medium text-theme-secondary">
                        {activeGroup.site.label}
                      </p>
                    ) : null}
                    <SourceLinkList
                      links={activeGroup.links}
                      isAdmin={isAdmin}
                      onDelete={handleDeleteLink}
                      deletingUrl={deletingUrl}
                    />
                  </>
                ) : null}
              </div>
            </div>
          ) : hasAnyLinks ? (
            <div className="rounded-xl border border-dashed border-theme bg-theme-input/20 px-4 py-10 text-center">
              <p className="font-medium text-theme-primary">No quick links for this role.</p>
              <p className="mt-2 text-sm text-theme-muted">
                Switch role tabs to see other research links.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-theme bg-theme-input/20 px-4 py-10 text-center">
              <p className="font-medium text-theme-primary">No quick links yet.</p>
              <p className="mt-2 text-sm text-theme-muted">
                Links appear here after platform admins approve research sources for this company.
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
