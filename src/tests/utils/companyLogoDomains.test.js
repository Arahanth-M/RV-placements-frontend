import { describe, expect, it } from "vitest";
import { resolveLogoDomainFromName } from "../../utils/companyLogoDomains";

describe("resolveLogoDomainFromName", () => {
  it("maps known companies to correct domains", () => {
    expect(resolveLogoDomainFromName("Walmart")).toBe("walmart.com");
    expect(resolveLogoDomainFromName("Confluent")).toBe("confluent.io");
    expect(resolveLogoDomainFromName("TCS NQT")).toBe("tcs.com");
    expect(resolveLogoDomainFromName("Glance (InMobi)")).toBe("inmobi.com");
    expect(resolveLogoDomainFromName("Eternal (Blinkit)")).toBe("blinkit.com");
    expect(resolveLogoDomainFromName("Common Wealth Bank")).toBe("commbank.com.au");
    expect(resolveLogoDomainFromName("Ethos Technolgies")).toBe("ethos.com");
    expect(resolveLogoDomainFromName("EGDK")).toBe("egsoftware.com");
    expect(resolveLogoDomainFromName("Axella")).toBe("axxela.in");
    expect(resolveLogoDomainFromName("Chevron Engine")).toBe("chevron.com");
    expect(resolveLogoDomainFromName("Rapido")).toBe("rapido.bike");
    expect(resolveLogoDomainFromName("Walmart Global Tech")).toBe("walmart.com");
    expect(resolveLogoDomainFromName("Nokia Solutions")).toBe("nokia.com");
    expect(resolveLogoDomainFromName("Green Light Technolgy")).toBe("greenlight.com");
    expect(resolveLogoDomainFromName("ETG")).toBe("etg.digital");
    expect(resolveLogoDomainFromName("ETG Digital")).toBe("etg.digital");
    expect(resolveLogoDomainFromName("NETGEAR")).toBe("netgear.com");
    expect(resolveLogoDomainFromName("Hyperface")).toBe("hyperface.co");
    expect(resolveLogoDomainFromName("Hevo Data")).toBe("hevodata.com");
    expect(resolveLogoDomainFromName("OneTrust")).toBe("onetrust.com");
    expect(resolveLogoDomainFromName("Havells India Ltd")).toBe("havells.com");
    expect(resolveLogoDomainFromName("TVS Motors")).toBe("tvsmotor.com");
  });

  it("returns empty string when no override exists", () => {
    expect(resolveLogoDomainFromName("Unknown Corp XYZ")).toBe("");
  });
});
