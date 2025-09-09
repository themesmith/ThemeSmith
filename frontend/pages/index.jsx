import React, { useState } from 'react';
import SiteHeader from '../components/site-header';

export default function ThemeBuilder() {
  const [spec, setSpec] = useState({ projectName: 'Clean Grid Blog', platform: 'ghost' });
  const [outputUrl, setOutputUrl] = useState(null);
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    setStatus('Building…');
    try {
      const res = await fetch('/api/generate-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spec),
      });
      const data = await res.json();
      setOutputUrl(data.download);
      setStatus(data.message || 'Done');
      // eslint-disable-next-line no-console
      console.log(data.validator);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div>
      <SiteHeader />
      <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>AI Theme Generator</h1>

      <input
        type="text"
        placeholder="Project Name"
        value={spec.projectName || ''}
        onChange={(e) => setSpec({ ...spec, projectName: e.target.value })}
        style={{ width: '100%', padding: 8, marginTop: 8 }}
      />

      <select
        value={spec.platform || 'ghost'}
        onChange={(e) => setSpec({ ...spec, platform: e.target.value })}
        style={{ width: '100%', padding: 8, marginTop: 8 }}
      >
        <option value="ghost">Ghost</option>
      </select>

      <button type="button" style={{ marginTop: 16 }} onClick={handleSubmit}>
        Generate Theme
      </button>

      <div style={{ marginTop: 12 }}>{status}</div>

      {outputUrl && (
        <a href={outputUrl} style={{ marginTop: 12, display: 'block' }}>
          Download Theme
        </a>
      )}
      </div>
    </div>
  );
}
