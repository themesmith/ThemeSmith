import React, { useState } from "react";
import SiteHeader from "../components/site-header";

const defaultSpec = {
  projectName: "Clean Grid Blog",
  platform: "ghost",
  layout: {
    homepage: "grid",
    postPage: "single-column",
    tagPage: "minimal",
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
          Create a production-ready Ghost theme from a simple specification.
        </p>

        <div>
          <label style={labelStyle}>Project Name *</label>
          <input
            type="text"
            placeholder="Clean Grid Blog"
            value={spec.projectName || ""}
            onChange={(e) => updateSpec("projectName", e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <div style={sectionStyle}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Layout</h2>
          <label style={labelStyle}>Homepage</label>
          <select
            value={spec.layout?.homepage || "grid"}
            onChange={(e) => updateSpec("layout.homepage", e.target.value)}
            style={inputStyle}
          >
            <option value="grid">Grid</option>
            <option value="list">List</option>
            <option value="minimal">Minimal</option>
          </select>

          <label style={labelStyle}>Post Page</label>
          <select
            value={spec.layout?.postPage || "single-column"}
            onChange={(e) => updateSpec("layout.postPage", e.target.value)}
            style={inputStyle}
          >
            <option value="single-column">Single Column</option>
            <option value="sidebar">With Sidebar</option>
            <option value="minimal">Minimal</option>
          </select>

          <label style={labelStyle}>Tag Page</label>
          <select
            value={spec.layout?.tagPage || "minimal"}
            onChange={(e) => updateSpec("layout.tagPage", e.target.value)}
            style={inputStyle}
          >
            <option value="minimal">Minimal</option>
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Colors</h2>
          <label style={labelStyle}>Primary</label>
          <input
            type="color"
            value={spec.colors?.primary || "#1a1a1a"}
            onChange={(e) => updateSpec("colors.primary", e.target.value)}
            style={{ ...inputStyle, height: 40 }}
          />

          <label style={labelStyle}>Accent</label>
          <input
            type="color"
            value={spec.colors?.accent || "#ff5722"}
            onChange={(e) => updateSpec("colors.accent", e.target.value)}
            style={{ ...inputStyle, height: 40 }}
          />

          <label style={labelStyle}>Background</label>
          <input
            type="color"
            value={spec.colors?.background || "#ffffff"}
            onChange={(e) => updateSpec("colors.background", e.target.value)}
            style={{ ...inputStyle, height: 40 }}
          />

          <label style={labelStyle}>Text</label>
          <input
            type="color"
            value={spec.colors?.text || "#333333"}
            onChange={(e) => updateSpec("colors.text", e.target.value)}
            style={{ ...inputStyle, height: 40 }}
          />
        </div>

        <div style={sectionStyle}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Fonts</h2>
          <label style={labelStyle}>Heading Font</label>
          <input
            type="text"
            placeholder="Inter"
            value={spec.fonts?.heading || ""}
            onChange={(e) => updateSpec("fonts.heading", e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle}>Body Font</label>
          <input
            type="text"
            placeholder="Open Sans"
            value={spec.fonts?.body || ""}
            onChange={(e) => updateSpec("fonts.body", e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={sectionStyle}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Features</h2>
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
