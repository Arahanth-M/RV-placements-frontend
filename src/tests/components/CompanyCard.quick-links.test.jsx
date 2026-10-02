import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import QuickLinksTab from "../../components/CompanyTabs/QuickLinksTab.jsx";

describe("QuickLinksTab", () => {
  it("shows links with titles and safe external link attributes", () => {
    render(
      <QuickLinksTab
        company={{
          researchSources: [
            {
              title: "GeeksforGeeks — Company Interview",
              url: "https://www.geeksforgeeks.org/interview-experiences/walmart",
            },
          ],
        }}
      />
    );

    expect(screen.getByTestId("company-quick-links-tab")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Quick Links" })).not.toBeInTheDocument();
    const link = screen.getByRole("link", { name: "GeeksforGeeks — Company Interview" });
    expect(link).toHaveAttribute("href", "https://www.geeksforgeeks.org/interview-experiences/walmart");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows empty state when there are no research sources", () => {
    render(<QuickLinksTab company={{ researchSources: [] }} />);
    expect(screen.getByText(/No quick links yet/)).toBeInTheDocument();
  });

  it("segregates links into site sub-tabs", () => {
    render(
      <QuickLinksTab
        company={{
          researchSources: [
            { title: "GFG A", url: "https://www.geeksforgeeks.org/a" },
            { title: "GFG B", url: "https://geeksforgeeks.org/b" },
            { title: "LinkedIn post", url: "https://www.linkedin.com/posts/1" },
          ],
        }}
      />
    );

    expect(screen.getByRole("tab", { name: /GFG \(2\)/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /LinkedIn \(1\)/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GFG A" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "LinkedIn post" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /LinkedIn \(1\)/ }));
    expect(screen.getByRole("link", { name: "LinkedIn post" })).toBeInTheDocument();
  });

  it("filters links and summary by prep role tabs", () => {
    render(
      <QuickLinksTab
        company={{
          prepRoles: [{ key: "sde", label: "SDE" }],
          researchLinksSummaries: [
            { prepRoleKey: "sde", summary: "SDE rounds emphasize DSA." },
          ],
          researchSources: [
            { title: "SDE link", url: "https://www.geeksforgeeks.org/sde", prepRoleKey: "sde" },
            {
              title: "General link",
              url: "https://www.geeksforgeeks.org/general",
              prepRoleKey: "",
            },
          ],
        }}
      />
    );

    expect(screen.queryByRole("tab", { name: "General" })).not.toBeInTheDocument();
    expect(screen.getByTestId("prep-role-badge")).toHaveTextContent("Roles:");
    expect(screen.getByTestId("prep-role-badge")).toHaveTextContent("SDE");
    expect(screen.getByRole("link", { name: "SDE link" })).toBeInTheDocument();
    expect(screen.getByTestId("quick-links-role-summary")).toHaveTextContent(/DSA/);
    expect(screen.queryByRole("link", { name: "General link" })).not.toBeInTheDocument();
  });

  it("shows a prep role badge when content is tagged for one role only", () => {
    render(
      <QuickLinksTab
        company={{
          prepRoles: [{ key: "software-engineer", label: "Software Engineer" }],
          researchSources: [
            {
              title: "GFG",
              url: "https://www.geeksforgeeks.org/x",
              prepRoleKey: "software-engineer",
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("prep-role-badge")).toHaveTextContent("Roles:");
    expect(screen.getByTestId("prep-role-badge")).toHaveTextContent("Software Engineer");
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });
});
