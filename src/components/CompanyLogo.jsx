import React, { useEffect, useMemo, useState } from "react";
import { peekCompanyLogo, requestCompanyLogo } from "../utils/companyLogoBatch";
import {
  LIST_LOGO_PIXEL_SIZE,
  resolveCompanyLogoTarget,
} from "../utils/companyLogoSrc";

/**
 * Renders a company logo. Visible logos on a page share one batched request
 * so the browser is not limited to a handful of parallel /api/logo calls.
 * Results stay in memory, so leaving a company and coming back paints immediately.
 *
 * While a logo is still fetching, a neutral shimmer is shown — never initials text.
 * If no logo is available, a blank muted tile is used instead of company initials.
 * @param {Object} company - { name, domain? }
 * @param {string} [className] - applied to the img
 * @param {string} [alt] - alt text (defaults to company name or "Company logo")
 * @param {number} [pixelSize] - logo.dev edge size (32–800); smaller = faster loads for thumbnails
 * @param {"eager"|"lazy"} [loading] - img loading hint; use eager for above-the-fold hub tiles
 */
function CompanyLogo({
  company,
  className = "",
  alt,
  pixelSize = LIST_LOGO_PIXEL_SIZE,
  loading = "lazy",
}) {
  const target = useMemo(
    () => resolveCompanyLogoTarget(company, pixelSize),
    [company?._id, company?.name, company?.domain, pixelSize]
  );

  const [src, setSrc] = useState(() => {
    const cached = peekCompanyLogo(target.cacheKey);
    if (cached) return cached;
    // No domain → permanent fallback. With a domain, stay empty until the batch returns
    // so initials never flash while the real logo is loading.
    return target.domain ? null : target.fallback;
  });

  useEffect(() => {
    const cached = peekCompanyLogo(target.cacheKey);
    if (cached) {
      setSrc(cached);
      return undefined;
    }
    if (!target.domain) {
      setSrc(target.fallback);
      return undefined;
    }

    let cancelled = false;
    setSrc(null);
    requestCompanyLogo(target).then((result) => {
      if (cancelled) return;
      if (typeof result === "string" && result) {
        setSrc(result);
        return;
      }
      if (result === null) {
        setSrc(target.fallback);
        return;
      }
      setSrc(target.networkUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [target]);

  const label = alt ?? target.name ?? "Company logo";

  if (!src) {
    return (
      <div
        className={`stats-shimmer ${className}`.trim()}
        role="img"
        aria-label={`Loading ${label}`}
        aria-busy="true"
      />
    );
  }

  return (
    <img
      src={src}
      alt={label}
      className={className}
      loading={loading}
      decoding="async"
      fetchPriority={loading === "eager" ? "high" : undefined}
      onError={() => {
        if (src !== target.fallback) setSrc(target.fallback);
      }}
    />
  );
}

export default CompanyLogo;
