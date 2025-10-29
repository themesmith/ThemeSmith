import React, { useState } from "react";
import SiteHeader from "../components/site-header";

const defaultSpec = {
  projectName: "Clean Grid Blog",
  platform: "ghost",
  layout: {
    homepage: "grid",
    postPage: "single-column",
    tagPage: "minimal",
    archivePage: "grid", // WordPress specific
  },
  colors: {
    primary: "#1a1a1a",
    accent: "#ff5722",
    background: "#ffffff",
    text: "#333333",
  },
  fonts: {
    heading: "Inter",
    body: "Open Sans",
  },
  features: [],
};

export default function ThemeBuilder() {
  const [spec, setSpec] = useState(defaultSpec);
  const [outputUrl, setOutputUrl] = useState(null);
  const [status, setStatus] = useState("");

  const updateSpec = (path, value) => {
    const keys = path.split(".");
    const newSpec = { ...spec };
    let current = newSpec;
    for (let i = 0; i < keys.length - 1; i += 1) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setSpec(newSpec);
  };

  const toggleFeature = (feature) => {
    const features = spec.features || [];
    const newFeatures = features.includes(feature)
      ? features.filter((f) => f !== feature)
      : [...features, feature];
    setSpec({ ...spec, features: newFeatures });
  };

  const handleSubmit = async () => {
    if (!spec.projectName) {
      setStatus("Error: Project Name is required");
      return;
    }
    setStatus("Building…");
    try {
      const res = await fetch("/api/generate-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(spec),
      });
      const data = await res.json();
      if (res.ok) {
        setOutputUrl(data.download);
        setStatus(data.message || "Done");
      } else {
        setStatus(`Error: ${data.error || "Failed to generate theme"}`);
      }
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const sectionStyle = { marginTop: 24, paddingTop: 24, borderTop: "1px solid #eee" };
  const labelStyle = { display: "block", marginTop: 12, marginBottom: 4, fontWeight: 500 };
  const inputStyle = { width: "100%", padding: 8, marginTop: 4 };

  return (
    <div>
      <SiteHeader />
      <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>ThemeSmith Generator</h1>
        <p style={{ color: "#666", marginBottom: 24 }}>
          Create a production-ready
          {" "}
          {spec.platform === "wordpress" ? "WordPress" : "Ghost"}
          {" "}
          theme from a simple specification.
        </p>

        <div>
          <label htmlFor="projectName" style={labelStyle}>Project Name *</label>
          <input
            id="projectName"
            type="text"
            placeholder="Clean Grid Blog"
            value={spec.projectName || ""}
            onChange={(e) => updateSpec("projectName", e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label htmlFor="platform" style={labelStyle}>Platform *</label>
          <select
            id="platform"
            value={spec.platform || "ghost"}
            onChange={(e) => {
              const platform = e.target.value;
              const newLayout = { ...spec.layout };

              // Update layout keys based on platform
              if (platform === "wordpress") {
                newLayout.archivePage = newLayout.tagPage || "grid";
                delete newLayout.tagPage;
              } else if (platform === "ghost") {
                newLayout.tagPage = newLayout.archivePage || "minimal";
                delete newLayout.archivePage;
              }

              setSpec({ ...spec, platform, layout: newLayout });
            }}
            style={inputStyle}
          >
            <option value="ghost">Ghost</option>
            <option value="wordpress">WordPress</option>
          </select>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Layout</h2>
          <label htmlFor="homepage" style={labelStyle}>Homepage</label>
          <select
            id="homepage"
            value={spec.layout?.homepage || "grid"}
            onChange={(e) => updateSpec("layout.homepage", e.target.value)}
            style={inputStyle}
          >
            <option value="grid">Grid</option>
            <option value="list">List</option>
            <option value="minimal">Minimal</option>
          </select>

          <label htmlFor="postPage" style={labelStyle}>Post Page</label>
          <select
            id="postPage"
            value={spec.layout?.postPage || "single-column"}
            onChange={(e) => updateSpec("layout.postPage", e.target.value)}
            style={inputStyle}
          >
            <option value="single-column">Single Column</option>
            <option value="sidebar">With Sidebar</option>
            <option value="minimal">Minimal</option>
          </select>

          {spec.platform === "ghost" ? (
            <>
              <label htmlFor="tagPage" style={labelStyle}>Tag Page</label>
              <select
                id="tagPage"
                value={spec.layout?.tagPage || "minimal"}
                onChange={(e) => updateSpec("layout.tagPage", e.target.value)}
                style={inputStyle}
              >
                <option value="minimal">Minimal</option>
                <option value="grid">Grid</option>
                <option value="list">List</option>
              </select>
            </>
          ) : (
            <>
              <label htmlFor="archivePage" style={labelStyle}>Archive Page</label>
              <select
                id="archivePage"
                value={spec.layout?.archivePage || "grid"}
                onChange={(e) => updateSpec("layout.archivePage", e.target.value)}
                style={inputStyle}
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
                <option value="minimal">Minimal</option>
              </select>
            </>
          )}
        </div>

        <div style={sectionStyle}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Colors</h2>
          <label htmlFor="primaryColor" style={labelStyle}>Primary</label>
          <input
            id="primaryColor"
            type="color"
            value={spec.colors?.primary || "#1a1a1a"}
            onChange={(e) => updateSpec("colors.primary", e.target.value)}
            style={{ ...inputStyle, height: 40 }}
          />

          <label htmlFor="accentColor" style={labelStyle}>Accent</label>
          <input
            id="accentColor"
            type="color"
            value={spec.colors?.accent || "#ff5722"}
            onChange={(e) => updateSpec("colors.accent", e.target.value)}
            style={{ ...inputStyle, height: 40 }}
          />

          <label htmlFor="backgroundColor" style={labelStyle}>Background</label>
          <input
            id="backgroundColor"
            type="color"
            value={spec.colors?.background || "#ffffff"}
            onChange={(e) => updateSpec("colors.background", e.target.value)}
            style={{ ...inputStyle, height: 40 }}
          />

          <label htmlFor="textColor" style={labelStyle}>Text</label>
          <input
            id="textColor"
            type="color"
            value={spec.colors?.text || "#333333"}
            onChange={(e) => updateSpec("colors.text", e.target.value)}
            style={{ ...inputStyle, height: 40 }}
          />
        </div>

        <div style={sectionStyle}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Fonts</h2>
          <label htmlFor="headingFont" style={labelStyle}>Heading Font</label>
          <input
            id="headingFont"
            type="text"
            placeholder="Inter"
            value={spec.fonts?.heading || ""}
            onChange={(e) => updateSpec("fonts.heading", e.target.value)}
            style={inputStyle}
          />

          <label htmlFor="bodyFont" style={labelStyle}>Body Font</label>
          <input
            id="bodyFont"
            type="text"
            placeholder="Open Sans"
            value={spec.fonts?.body || ""}
            onChange={(e) => updateSpec("fonts.body", e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={sectionStyle}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Features</h2>
          {spec.platform === "wordpress" ? (
            <>
              {["gutenberg_blocks", "customizer", "widgets", "menus", "dark_mode", "responsive"].map((feature) => (
                <label key={feature} style={{ display: "block", marginTop: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={(spec.features || []).includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    style={{ marginRight: 8 }}
                  />
                  {feature.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </label>
              ))}
            </>
          ) : (
            <>
              {["dark_mode", "newsletter_signup", "search", "featured_posts"].map((feature) => (
                <label key={feature} style={{ display: "block", marginTop: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={(spec.features || []).includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    style={{ marginRight: 8 }}
                  />
                  {feature.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </label>
              ))}
            </>
          )}
        </div>

        <button
          type="button"
          style={{ marginTop: 24, padding: "12px 24px", fontSize: 16 }}
          onClick={handleSubmit}
        >
          Generate Theme
        </button>

        {status && (
          <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 4 }}>
            {status}
          </div>
        )}

        {outputUrl && (
          <div style={{ marginTop: 16 }}>
            <a
              href={outputUrl}
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "#3b82f6",
                color: "white",
                textDecoration: "none",
                borderRadius: 4,
              }}
            >
              Download Theme ZIP
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
