import React, { useEffect, useMemo, useState } from "react";
import { peekCompanyLogo, requestCompanyLogo } from "../utils/companyLogoBatch";
import { resolveCompanyLogoTarget } from "../utils/companyLogoSrc";

/**
 * Renders a company logo. Visible logos on a page share one batched request
 * so the browser is not limited to a handful of parallel /api/logo calls.
 * Results stay in memory, so leaving a company and coming back paints immediately.
 * @param {Object} company - { name, domain? }
 * @param {string} [className] - applied to the img
 * @param {string} [alt] - alt text (defaults to company name or "Company logo")
 * @param {number} [pixelSize] - logo.dev edge size (32–800); smaller = faster loads for thumbnails
 */
function CompanyLogo({ company, className = "", alt, pixelSize = 96 }) {
  const target = useMemo(
    () => resolveCompanyLogoTarget(company, pixelSize),
    [company?._id, company?.name, company?.domain, pixelSize]
  );

  const [src, setSrc] = useState(
    () => peekCompanyLogo(target.cacheKey) || target.fallback
  );

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

  return (
    <img
      src={src}
      alt={alt ?? target.name ?? "Company logo"}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (src !== target.fallback) setSrc(target.fallback);
      }}
    />
  );
}

export default CompanyLogo;
