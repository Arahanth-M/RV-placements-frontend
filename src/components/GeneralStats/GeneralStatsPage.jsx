import React from "react";
import { useNavigate } from "react-router-dom";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "../PageBackNav.jsx";
import PlacementStatsDashboard from "./PlacementStatsDashboard";

export default function GeneralStatsPage() {
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate("/")} label="Back" />
        </PageBackNavRow>

        <PageHeroHeader>
          General <em style={{ color: "#818CF8", fontStyle: "italic" }}>Stats</em>
        </PageHeroHeader>

        <PlacementStatsDashboard />
      </div>
    </div>
  );
}
