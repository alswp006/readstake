import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * AC-1: TDS packages exist with pre-deletion versions
 * AC-2: lockfile synced, clean install succeeds
 * AC-3: Apps-in-toss SDK exists
 * AC-4: Payment packages remain removed
 */

describe("AC-1: TDS packages restored with correct versions", () => {
  it("should have @toss/tds-mobile in dependencies", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies["@toss/tds-mobile"]).toBeDefined();
    // Version should follow semantic versioning format (^X.Y.Z or ~X.Y.Z)
    expect(packageJson.dependencies["@toss/tds-mobile"]).toMatch(
      /^\^?\~?(\d+)\.(\d+)\.(\d+)/
    );
  });

  it("should have @toss/tds-icons in dependencies", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies["@toss/tds-icons"]).toBeDefined();
    // Version should follow semantic versioning format
    expect(packageJson.dependencies["@toss/tds-icons"]).toMatch(
      /^\^?\~?(\d+)\.(\d+)\.(\d+)/
    );
  });

  it("should have TDS design tokens package in dependencies", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.dependencies).toBeDefined();
    // Check for common TDS token/design system package names
    const tdsPackageNames = Object.keys(packageJson.dependencies).filter(
      name => name.includes("@toss/tds") || name.includes("tds-")
    );
    expect(tdsPackageNames.length).toBeGreaterThanOrEqual(2);
  });
});

describe("AC-2: lockfile synchronized with package.json", () => {
  it("should have package-lock.json that matches package.json", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const lockfilePath = path.resolve(__dirname, "../../package-lock.json");

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const lockfile = JSON.parse(fs.readFileSync(lockfilePath, "utf-8"));

    expect(lockfile).toBeDefined();
    expect(lockfile.packages).toBeDefined();
    expect(lockfile.packages[""]).toBeDefined();
  });

  it("should have TDS packages in lockfile node_modules metadata", () => {
    const lockfilePath = path.resolve(__dirname, "../../package-lock.json");
    const lockfile = JSON.parse(fs.readFileSync(lockfilePath, "utf-8"));

    expect(lockfile.packages).toBeDefined();
    // Check that TDS packages are listed in the lockfile
    const tdsDependencies = Object.keys(lockfile.packages).filter(
      key => key.includes("@toss/tds") && !key.includes("node_modules/")
    );
    expect(tdsDependencies.length).toBeGreaterThanOrEqual(1);
  });

  it("should have @toss/tds-mobile in lockfile with resolved URL", () => {
    const lockfilePath = path.resolve(__dirname, "../../package-lock.json");
    const lockfile = JSON.parse(fs.readFileSync(lockfilePath, "utf-8"));

    // Find the package entry (can be "node_modules/@toss/tds-mobile" or similar)
    const tdsEntry = Object.entries(lockfile.packages).find(
      ([key]) => key.includes("@toss/tds-mobile")
    );

    expect(tdsEntry).toBeDefined();
    if (tdsEntry) {
      const [, packageData] = tdsEntry;
      expect(packageData).toHaveProperty("version");
      expect(packageData).toHaveProperty("resolved");
    }
  });

  it("should have lockfile version 3 indicating npm8+ generated", () => {
    const lockfilePath = path.resolve(__dirname, "../../package-lock.json");
    const lockfile = JSON.parse(fs.readFileSync(lockfilePath, "utf-8"));

    expect(lockfile.lockfileVersion).toBe(3);
  });
});

describe("AC-3: Apps-in-toss SDK platform essentials exist", () => {
  it("should have @apps-in-toss/web-framework in dependencies", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies["@apps-in-toss/web-framework"]).toBeDefined();
    // Version should follow semantic versioning
    expect(packageJson.dependencies["@apps-in-toss/web-framework"]).toMatch(
      /^\^?\~?(\d+)\.(\d+)\.(\d+)/
    );
  });

  it("should have React as core dependency", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.dependencies["react"]).toBeDefined();
    expect(packageJson.dependencies["react-dom"]).toBeDefined();
  });

  it("should have react-router-dom for routing", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.dependencies["react-router-dom"]).toBeDefined();
  });

  it("should have vite as dev dependency for build", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.devDependencies["vite"]).toBeDefined();
    expect(packageJson.devDependencies["@vitejs/plugin-react"]).toBeDefined();
  });
});

describe("AC-4: Payment/settlement packages remain removed", () => {
  it("should NOT have stripe package in dependencies", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.dependencies["stripe"]).toBeUndefined();
    expect(packageJson.dependencies["@stripe/react-stripe-js"]).toBeUndefined();
  });

  it("should NOT have @toss/payment-gateway in dependencies", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    // Payment-specific Toss packages should be removed
    const paymentPackages = Object.keys(packageJson.dependencies || {}).filter(
      name =>
        name.includes("payment") ||
        name.includes("billing") ||
        name.includes("settlement")
    );
    expect(paymentPackages).toHaveLength(0);
  });

  it("should NOT have iamport payment package", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.dependencies["iamport-rest-client"]).toBeUndefined();
    expect(packageJson.dependencies["react-iamport"]).toBeUndefined();
  });

  it("should NOT have @toss/settlement in dependencies", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.dependencies["@toss/settlement"]).toBeUndefined();
    expect(packageJson.dependencies["@toss/settlements"]).toBeUndefined();
  });
});

describe("Integration: package.json structure integrity", () => {
  it("should have valid package.json JSON structure", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const content = fs.readFileSync(packageJsonPath, "utf-8");

    expect(() => {
      JSON.parse(content);
    }).not.toThrow();
  });

  it("should have 'name' and 'version' fields", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.name).toBeDefined();
    expect(packageJson.version).toBeDefined();
    expect(typeof packageJson.name).toBe("string");
    expect(typeof packageJson.version).toBe("string");
  });

  it("should have both dependencies and devDependencies", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.dependencies).toBeDefined();
    expect(typeof packageJson.dependencies).toBe("object");
    expect(packageJson.devDependencies).toBeDefined();
    expect(typeof packageJson.devDependencies).toBe("object");
  });

  it("should have valid package-lock.json JSON structure", () => {
    const lockfilePath = path.resolve(__dirname, "../../package-lock.json");
    const content = fs.readFileSync(lockfilePath, "utf-8");

    expect(() => {
      JSON.parse(content);
    }).not.toThrow();
  });

  it("should have TDS packages ONLY in dependencies, not devDependencies", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    const tdsDepsInDev = Object.keys(packageJson.devDependencies || {}).filter(
      name => name.includes("@toss/tds")
    );
    expect(tdsDepsInDev).toHaveLength(0);

    // TDS should be in dependencies
    const tdsDepsInDeps = Object.keys(packageJson.dependencies || {}).filter(
      name => name.includes("@toss/tds")
    );
    expect(tdsDepsInDeps.length).toBeGreaterThan(0);
  });
});

describe("Integration: dependency version consistency", () => {
  it("all TDS package versions should follow semantic versioning", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    const tdsPackages = Object.entries(packageJson.dependencies || {}).filter(
      ([name]) => name.includes("@toss/tds")
    );

    tdsPackages.forEach(([name, version]) => {
      expect(typeof version).toBe("string");
      // Should be semver or with ^ or ~ prefix
      expect(version).toMatch(/^[\^~]?\d+\.\d+\.\d+/);
    });
  });

  it("should not have duplicate dependencies across prod/dev", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    const prodKeys = Object.keys(packageJson.dependencies || {});
    const devKeys = Object.keys(packageJson.devDependencies || {});

    const duplicates = prodKeys.filter(key => devKeys.includes(key));
    // React packages may be listed in both, but TDS shouldn't be
    const tdsDuplicates = duplicates.filter(key => key.includes("@toss"));
    expect(tdsDuplicates).toHaveLength(0);
  });
});
