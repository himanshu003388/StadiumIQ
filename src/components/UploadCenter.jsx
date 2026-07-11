import React, { useState, useRef } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS } from '../utils/styles';

function UploadCenter() {
  const { importDataset } = useStadiumContext();
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);
  const [commitSuccess, setCommitSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setErrorMessage('');
    setCommitSuccess(false);
    setParsedPreview(null);
    const validTypes = ['.csv', '.txt', '.pdf', '.md'];
    const extension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(extension)) {
      setErrorMessage('Unsupported file format. Please upload a .csv, .txt, or .pdf file.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      setErrorMessage('File too large. Maximum size allowed is 2MB.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsParsing(true);
    setErrorMessage('');

    try {
      // 1. Fetch CSRF token
      const csrfRes = await fetch('/api/csrf-token');
      if (!csrfRes.ok) throw new Error('Security validation failed (CSRF init).');
      const { csrfToken } = await csrfRes.json();

      // 2. Read file to Base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];

          // 3. Post to parser API
          const response = await fetch('/api/parse-document', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({
              fileData: base64Data,
              fileName: file.name,
              mimeType:
                file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain'),
            }),
          });

          if (!response.ok) {
            const errJson = await response.json();
            throw new Error(errJson.error || 'Failed to parse the file.');
          }

          const resData = await response.json();
          if (resData.success && resData.data) {
            setParsedPreview(resData.data);
          } else {
            throw new Error('No structured operational data could be extracted.');
          }
        } catch (err) {
          setErrorMessage(err.message);
        } finally {
          setIsParsing(false);
        }
      };

      reader.onerror = () => {
        setErrorMessage('Failed to read file from disk.');
        setIsParsing(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setErrorMessage(err.message);
      setIsParsing(false);
    }
  };

  const handleCommit = () => {
    if (!parsedPreview) return;
    importDataset(parsedPreview);
    setCommitSuccess(true);
    setFile(null);
    setParsedPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateSampleCSV = () => {
    const csvContent = `# GATE UPDATES (format: Gate, density, waitTimeMinutes, accessible, direction, accessibleFeatures)
Gate,A,0.95,32,true,North,wheelchair-ramp;hearing-loop
Gate,B,0.15,2,true,North,wheelchair-ramp
Gate,E,0.88,25,true,East,wheelchair-ramp;wide-lane

# INCIDENT UPDATES (format: id, type, zone, severity, description, status, aiRecommendedAction)
INC-101,medical,South Stand,high,Fan reporting heat exhaustion near Section 112,active,Dispatch closest medical volunteer V6 Priya Sharma immediately.
INC-102,equipment,North Stand,medium,Turnstile ticket scanner 4 offline at Gate B,active,Dispatch tech-support volunteer. Reset local controller.
INC-103,crowd,East Wing,critical,Crowd congestion anomaly at gate exit corridor,active,Reroute fans to Gate F. Update digital signage boards.

# VOLUNTEER UPDATES (format: id, name, zone, languages, skills)
V7,Carlos Gomez,North Stand,en;es,first-aid;crowd-control
V8,Jane Sterling,East Wing,en;fr,tech-support;guest-services
V9,Rashid Al-Mansoori,South Stand,en;ar,translation;first-aid`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stadium_iq_sample_ops_data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="p-4 md:p-6 flex flex-col gap-6 max-w-4xl mx-auto"
      role="region"
      aria-label="Dataset Upload Center"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold font-mono text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400">upload_file</span>
          Upload Center
        </h1>
        <p className="text-xs" style={{ color: COLORS.outline }}>
          Evaluators can upload CSV spreadsheet updates or PDF/TXT situation reports. Stadium IQ
          uses Gemini AI to extract gates, incidents, or volunteer rosters and injects them directly
          into the live simulator.
        </p>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all"
        style={{
          borderColor: file ? COLORS.primary : COLORS.outlineVariant,
          background: file
            ? `color-mix(in srgb, ${COLORS.primary} 4%, transparent)`
            : COLORS.surfaceContainerLow,
        }}
      >
        <span
          className="material-symbols-outlined text-4xl"
          style={{ color: file ? COLORS.primary : COLORS.outline }}
        >
          cloud_upload
        </span>
        <div className="text-center">
          {file ? (
            <p className="font-semibold text-sm text-white">{file.name}</p>
          ) : (
            <p className="text-sm text-white">Drag and drop file here, or click to browse</p>
          )}
          <p className="text-xs mt-1" style={{ color: COLORS.outline }}>
            Supports .csv, .txt, or .pdf (Max 2MB)
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.txt,.pdf,.md"
          className="hidden"
          id="file-upload-input"
          aria-label="Upload operations file"
        />

        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost text-xs px-4 py-2"
          >
            Browse Files
          </button>

          <button
            onClick={generateSampleCSV}
            className="btn-ghost text-xs px-4 py-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
            title="Download a template CSV to test with"
          >
            Download Sample CSV
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="card p-4 border-l-4 border-red-500 bg-red-950/20" role="alert">
          <div className="flex gap-2.5 items-center">
            <span className="material-symbols-outlined text-red-500">error</span>
            <p className="text-xs text-red-200 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {commitSuccess && (
        <div
          className="card p-4 border-l-4 border-emerald-500 bg-emerald-950/20 animate-fade-in-up"
          role="status"
        >
          <div className="flex gap-2.5 items-center">
            <span className="material-symbols-outlined text-emerald-400">check_circle</span>
            <div>
              <p className="text-xs text-emerald-200 font-bold">Data Committed Successfully!</p>
              <p className="text-[10px] text-emerald-300 opacity-85 mt-0.5">
                The gates, active incidents, and volunteers lists have been updated in the
                simulator.
              </p>
            </div>
          </div>
        </div>
      )}

      {file && !parsedPreview && (
        <button
          onClick={handleUpload}
          disabled={isParsing}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {isParsing ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              <span>Gemini is extracting data...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">analytics</span>
              <span>Extract & Parse with GenAI</span>
            </>
          )}
        </button>
      )}

      {/* Parsed Data Preview */}
      {parsedPreview && (
        <div className="flex flex-col gap-4 animate-fade-in-up">
          <div
            className="flex justify-between items-center border-b pb-2"
            style={{ borderColor: COLORS.surfaceDim }}
          >
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400">visibility</span>
              Extracted Dataset Preview
            </h2>
            <button
              onClick={handleCommit}
              className="btn-primary text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-500"
            >
              Commit to Simulator
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gates */}
            <div className="card p-4 flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-blue-400">sensor_door</span>
                Gates ({parsedPreview.gates?.length || 0})
              </h3>
              {parsedPreview.gates && parsedPreview.gates.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {parsedPreview.gates.map((g) => (
                    <div
                      key={g.id ?? `gate-${g.direction}`}
                      className="p-2 rounded bg-white/5 border border-white/10 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">Gate {g.id}</p>
                        <p className="text-[10px]" style={{ color: COLORS.outline }}>
                          {g.direction} • {g.accessible ? 'ADA' : 'Standard'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold text-white">
                          {Math.round(g.density * 100)}%
                        </p>
                        <p className="text-[9px]" style={{ color: COLORS.outline }}>
                          {g.waitTimeMinutes}m wait
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px]" style={{ color: COLORS.outline }}>
                  No gate updates found.
                </p>
              )}
            </div>

            {/* Incidents */}
            <div className="card p-4 flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-red-400">warning</span>
                Incidents ({parsedPreview.incidents?.length || 0})
              </h3>
              {parsedPreview.incidents && parsedPreview.incidents.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {parsedPreview.incidents.map((i) => (
                    <div
                      key={i.id ?? `inc-${i.zone}-${i.severity}`}
                      className="p-2 rounded bg-white/5 border border-white/10"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-bold text-red-300">{i.id}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                            i.severity === 'critical'
                              ? 'bg-red-900/40 text-red-200 border border-red-500/30'
                              : i.severity === 'medium'
                                ? 'bg-amber-900/40 text-amber-200 border border-amber-500/30'
                                : 'bg-blue-900/40 text-blue-200 border border-blue-500/30'
                          }`}
                        >
                          {i.severity}
                        </span>
                      </div>
                      <p className="text-xs text-white mt-1 font-medium line-clamp-2">
                        {i.description}
                      </p>
                      <p className="text-[9px] mt-1" style={{ color: COLORS.outline }}>
                        Zone: {i.zone}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px]" style={{ color: COLORS.outline }}>
                  No incident updates found.
                </p>
              )}
            </div>

            {/* Volunteers */}
            <div className="card p-4 flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-purple-400">groups</span>
                Volunteers ({parsedPreview.volunteers?.length || 0})
              </h3>
              {parsedPreview.volunteers && parsedPreview.volunteers.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {parsedPreview.volunteers.map((v) => (
                    <div
                      key={v.id ?? v.name}
                      className="p-2 rounded bg-white/5 border border-white/10"
                    >
                      <p className="text-xs font-bold text-white">{v.name}</p>
                      <p className="text-[9px]" style={{ color: COLORS.outline }}>
                        Zone: {v.zone} • Lang: {v.languages?.join(', ')}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {v.skills?.map((s) => (
                          <span
                            key={s}
                            className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-white/80"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px]" style={{ color: COLORS.outline }}>
                  No volunteer updates found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadCenter;
