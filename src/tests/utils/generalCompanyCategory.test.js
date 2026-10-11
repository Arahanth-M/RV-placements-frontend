import { describe, expect, it } from "vitest";
import {
  GENERAL_COMPANY_CATEGORY_AIML_CYBER,
  GENERAL_COMPANY_CATEGORY_ECOMMERCE,
  GENERAL_COMPANY_CATEGORY_ENTERPRISE,
  GENERAL_COMPANY_CATEGORY_FINTECH,
  GENERAL_COMPANY_CATEGORY_OTHERS,
  GENERAL_COMPANY_CATEGORY_PRODUCT,
  GENERAL_COMPANY_CATEGORY_SEMICONDUCTORS,
  GENERAL_COMPANY_CATEGORY_SERVICE,
  GENERAL_COMPANY_CATEGORY_STARTUP,
  classifyGeneralCompanyCategory,
  groupCompaniesByGeneralCategory,
  isGeneralCompanyCardDetailLocked,
  parseGeneralCompanyCategoryParam,
} from "../../utils/generalCompanyCategory.js";

describe("classifyGeneralCompanyCategory", () => {
  it("maps fintech variants", () => {
    expect(classifyGeneralCompanyCategory("Fintech")).toBe(GENERAL_COMPANY_CATEGORY_FINTECH);
    expect(classifyGeneralCompanyCategory("Payments / Banking")).toBe(
      GENERAL_COMPANY_CATEGORY_FINTECH
    );
  });

  it("maps product based variants", () => {
    expect(classifyGeneralCompanyCategory("Product based")).toBe(
      GENERAL_COMPANY_CATEGORY_PRODUCT
    );
    expect(classifyGeneralCompanyCategory("PBC")).toBe(GENERAL_COMPANY_CATEGORY_PRODUCT);
  });

  it("maps e-commerce variants", () => {
    expect(classifyGeneralCompanyCategory("E-commerce")).toBe(
      GENERAL_COMPANY_CATEGORY_ECOMMERCE
    );
    expect(classifyGeneralCompanyCategory("Marketplace")).toBe(
      GENERAL_COMPANY_CATEGORY_ECOMMERCE
    );
  });

  it("maps AI/ML and cyber security variants into one category", () => {
    expect(classifyGeneralCompanyCategory("AI/ML")).toBe(
      GENERAL_COMPANY_CATEGORY_AIML_CYBER
    );
    expect(classifyGeneralCompanyCategory("Machine Learning")).toBe(
      GENERAL_COMPANY_CATEGORY_AIML_CYBER
    );
    expect(classifyGeneralCompanyCategory("Cyber Security")).toBe(
      GENERAL_COMPANY_CATEGORY_AIML_CYBER
    );
    expect(classifyGeneralCompanyCategory("Cybersecurity")).toBe(
      GENERAL_COMPANY_CATEGORY_AIML_CYBER
    );
  });

  it("maps semiconductor variants", () => {
    expect(classifyGeneralCompanyCategory("Semiconductors")).toBe(
      GENERAL_COMPANY_CATEGORY_SEMICONDUCTORS
    );
    expect(classifyGeneralCompanyCategory("VLSI")).toBe(
      GENERAL_COMPANY_CATEGORY_SEMICONDUCTORS
    );
  });

  it("maps enterprise software variants", () => {
    expect(classifyGeneralCompanyCategory("Enterprise Software")).toBe(
      GENERAL_COMPANY_CATEGORY_ENTERPRISE
    );
    expect(classifyGeneralCompanyCategory("SaaS")).toBe(
      GENERAL_COMPANY_CATEGORY_ENTERPRISE
    );
    expect(classifyGeneralCompanyCategory("B2B SaaS")).toBe(
      GENERAL_COMPANY_CATEGORY_ENTERPRISE
    );
  });

  it("maps service based variants", () => {
    expect(classifyGeneralCompanyCategory("Service based company")).toBe(
      GENERAL_COMPANY_CATEGORY_SERVICE
    );
    expect(classifyGeneralCompanyCategory("IT Services")).toBe(
      GENERAL_COMPANY_CATEGORY_SERVICE
    );
  });

  it("maps startup variants", () => {
    expect(classifyGeneralCompanyCategory("Startup")).toBe(GENERAL_COMPANY_CATEGORY_STARTUP);
    expect(classifyGeneralCompanyCategory("Early-stage")).toBe(
      GENERAL_COMPANY_CATEGORY_STARTUP
    );
  });

  it("prefers specific industries over generic product", () => {
    expect(classifyGeneralCompanyCategory("Fintech product")).toBe(
      GENERAL_COMPANY_CATEGORY_FINTECH
    );
    expect(classifyGeneralCompanyCategory("E-commerce product")).toBe(
      GENERAL_COMPANY_CATEGORY_ECOMMERCE
    );
    expect(classifyGeneralCompanyCategory("Enterprise product")).toBe(
      GENERAL_COMPANY_CATEGORY_ENTERPRISE
    );
    expect(classifyGeneralCompanyCategory("AI/ML product")).toBe(
      GENERAL_COMPANY_CATEGORY_AIML_CYBER
    );
    expect(classifyGeneralCompanyCategory("Semiconductor product")).toBe(
      GENERAL_COMPANY_CATEGORY_SEMICONDUCTORS
    );
  });

  it("sends unknown or empty models to others", () => {
    expect(classifyGeneralCompanyCategory("")).toBe(GENERAL_COMPANY_CATEGORY_OTHERS);
    expect(classifyGeneralCompanyCategory("B2B")).toBe(GENERAL_COMPANY_CATEGORY_OTHERS);
    expect(classifyGeneralCompanyCategory("B2C")).toBe(GENERAL_COMPANY_CATEGORY_OTHERS);
  });
});

describe("parseGeneralCompanyCategoryParam", () => {
  it("accepts known category ids only", () => {
    expect(parseGeneralCompanyCategoryParam("fintech")).toBe(
      GENERAL_COMPANY_CATEGORY_FINTECH
    );
    expect(parseGeneralCompanyCategoryParam("nope")).toBeNull();
  });
});

describe("groupCompaniesByGeneralCategory", () => {
  it("buckets companies without mutating the source list", () => {
    const companies = [
      { _id: "1", business_model: "Product based" },
      { _id: "2", business_model: "IT Services" },
      { _id: "3", business_model: "B2B" },
    ];
    const grouped = groupCompaniesByGeneralCategory(companies);
    expect(grouped.product.map((c) => c._id)).toEqual(["1"]);
    expect(grouped.service.map((c) => c._id)).toEqual(["2"]);
    expect(grouped.others.map((c) => c._id)).toEqual(["3"]);
    expect(companies).toHaveLength(3);
  });
});

describe("isGeneralCompanyCardDetailLocked", () => {
  const category = GENERAL_COMPANY_CATEGORY_PRODUCT;
  const companyId = "abc123";
  const lockedArgs = {
    user: { userId: "u1" },
    cardAccess: { allCards: false, categories: {} },
    selectedCategory: category,
    teaserCompanyIds: {},
    companyId,
  };

  it("never locks cards for guests", () => {
    expect(
      isGeneralCompanyCardDetailLocked({
        ...lockedArgs,
        user: null,
      })
    ).toBe(false);
  });

  it("locks for signed-in users without category or teaser access", () => {
    expect(isGeneralCompanyCardDetailLocked(lockedArgs)).toBe(true);
  });

  it("unlocks teaser company in category", () => {
    expect(
      isGeneralCompanyCardDetailLocked({
        ...lockedArgs,
        teaserCompanyIds: { [category]: companyId },
      })
    ).toBe(false);
  });
});
