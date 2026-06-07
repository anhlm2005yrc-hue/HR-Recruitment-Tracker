import React, { useState, useEffect } from "react";
import { JDInputs, generateJobDescription } from "../../lib/ai";
import { Slicon } from "../Slicon";

interface AiGeneratorScreenProps {
  onSaveAsJob: (title: string, description: string) => void;
}

export const AiGeneratorScreen: React.FC<AiGeneratorScreenProps> = ({ onSaveAsJob }) => {
  const [inputs, setInputs] = useState<JDInputs>({
    title: "",
    department: "Engineering",
    responsibilities: "",
    qualifications: "",
    tone: "Professional",
  });

  const [apiKey, setApiKey] = useState("");
  const [showKeyField, setShowKeyField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [outputJd, setOutputJd] = useState("");
  const [errorText, setErrorText] = useState("");

  // Retrieve Groq key on load
  useEffect(() => {
    const savedKey = localStorage.getItem("groq_api_key") || "";
    setApiKey(savedKey);
    if (!savedKey) {
      setShowKeyField(true);
    }
  }, []);

  const saveApiKey = (key: string) => {
    const trimmed = key.trim();
    localStorage.setItem("groq_api_key", trimmed);
    setApiKey(trimmed);
    setShowKeyField(false);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    if (!apiKey) {
      setErrorText("API key is required. Please set up your Groq API Key first.");
      setShowKeyField(true);
      return;
    }

    if (!inputs.title || !inputs.department || !inputs.responsibilities || !inputs.qualifications) {
      setErrorText("Please fill out all required fields first.");
      return;
    }

    setLoading(true);
    try {
      const generated = await generateJobDescription(inputs, apiKey);
      setOutputJd(generated);
      
      // Auto scroll to preview panel on mobile
      if (window.innerWidth < 768) {
        setTimeout(() => {
          document.getElementById("jd_preview_container")?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    } catch (err: any) {
      setErrorText(err?.message || "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete =
    inputs.title.trim() &&
    inputs.department.trim() &&
    inputs.responsibilities.trim() &&
    inputs.qualifications.trim();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Column 1-2: Input Form Panel */}
      <div className="lg:col-span-2 space-y-5">
        
        {/* Personal API Key Configure Settings Panel (R6.10) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Slicon
                name="settings"
                size={18}
                className={apiKey ? "text-emerald-600" : "text-amber-500 animate-pulse"}
              />
              <span className="text-sm font-bold text-gray-800">Groq API Key Sourcing</span>
            </div>
            <button
              onClick={() => setShowKeyField(!showKeyField)}
              className="text-xs text-[#2D6A4F] hover:underline font-semibold"
            >
              {showKeyField ? "Minimize" : "Configure Key"}
            </button>
          </div>

          {!showKeyField ? (
            <div className="flex items-center justify-between bg-[#F0FAF4] p-3.5 rounded-xl border border-[#D8F3DC]">
              <span className="text-xs text-[#2D6A4F] font-bold uppercase flex items-center gap-1.5">
                <Slicon name="check-circle" size={14} />
                Credentials Configured
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {apiKey ? `••••${apiKey.slice(-4)}` : "None"}
              </span>
            </div>
          ) : (
            <div className="space-y-3 bg-[#F3F4F6]/40 p-4 rounded-xl border border-gray-150 relative">
              <p className="text-xs text-gray-400 leading-relaxed">
                Provide your custom Groq API Key. The system stores it locally in the browser's <code>localStorage</code> securely and never uploads it elsewhere.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="Paste gsk_... key from console"
                  className="flex-grow h-10 px-3.5 rounded-xl border border-gray-205 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-xs font-mono bg-white"
                  defaultValue={apiKey}
                  id="api_key_field"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const inputElement = e.currentTarget as HTMLInputElement;
                      saveApiKey(inputElement.value);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("api_key_field") as HTMLInputElement;
                    saveApiKey(el?.value || "");
                  }}
                  className="h-10 px-3 flex items-center justify-center rounded-xl bg-[#2D6A4F] hover:bg-[#1A3A2E] text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* The Generator Form */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-sm">
          <form onSubmit={handleGenerate} className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-1.5 mb-3">
              AI Job Sourcing Parameters
            </h4>

            {/* Error indicators */}
            {errorText && (
              <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl flex items-start gap-2 border border-red-100">
                <Slicon name="warning" size={16} className="text-red-650 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorText}</p>
              </div>
            )}

            {/* Job Title */}
            <div>
              <label className="block text-[11px] font-bold text-gray-505 uppercase tracking-wide mb-1">
                Job Title *
              </label>
              <input
                type="text"
                disabled={loading}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm disabled:bg-gray-50"
                placeholder="e.g. Senior Software Engineer"
                value={inputs.title}
                onChange={(e) => setInputs({ ...inputs, title: e.target.value })}
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-[11px] font-bold text-gray-505 uppercase tracking-wide mb-1">
                Department *
              </label>
              <select
                disabled={loading}
                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
                value={inputs.department}
                onChange={(e) => setInputs({ ...inputs, department: e.target.value })}
              >
                <option value="Engineering">Engineering</option>
                <option value="Marketing">Marketing</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Product">Product</option>
                <option value="Finance">Finance</option>
                <option value="Design">Design</option>
              </select>
            </div>

            {/* Key Responsibilities */}
            <div>
              <label className="block text-[11px] font-bold text-gray-505 uppercase tracking-wide mb-1">
                Key Responsibilities *
              </label>
              <textarea
                disabled={loading}
                rows={3}
                className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm leading-relaxed"
                placeholder="5 core responsibilities or roles details..."
                value={inputs.responsibilities}
                onChange={(e) => setInputs({ ...inputs, responsibilities: e.target.value })}
              />
            </div>

            {/* Required Qualifications */}
            <div>
              <label className="block text-[11px] font-bold text-gray-505 uppercase tracking-wide mb-1">
                Required Qualifications *
              </label>
              <textarea
                disabled={loading}
                rows={3}
                className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm leading-relaxed"
                placeholder="Core degrees, certifications, years experience required..."
                value={inputs.qualifications}
                onChange={(e) => setInputs({ ...inputs, qualifications: e.target.value })}
              />
            </div>

            {/* Tone selector & generate button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !isFormComplete}
                className="py-3 px-6 rounded-xl bg-[#2D6A4F] hover:bg-[#1A3A2E] text-white text-xs font-bold tracking-wider uppercase shadow shadow-green-200 transition-all flex items-center justify-center gap-2 flex-grow disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
              >
                {loading ? (
                  <>
                    <Slicon name="loader" size={16} className="animate-spin" />
                    Generating in process...
                  </>
                ) : (
                  <>
                    <Slicon name="sparkles" size={16} />
                    Generate Job Description
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Column 3-5: Structured Preview Panel (R6.7 - R6.9) */}
      <div
        id="jd_preview_container"
        className="lg:col-span-3 bg-white p-5 md:p-6 rounded-2xl border border-gray-150/80 shadow-sm flex flex-col justify-between"
      >
        <div className="flex flex-col h-full justify-between gap-5 col-span-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-3 flex-shrink-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
              Structured JD Preview Output
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#2D6A4F] bg-[#F0FAF4] px-2.5 py-1 border border-[#D8F3DC] rounded-full">
              Sora Typographies
            </span>
          </div>

          {/* Core compiled description body */}
          <div className="flex-grow min-y-[320px] max-h-[500px] overflow-y-auto scrollbar-thin rounded-xl p-4 bg-gray-50/50 border border-gray-100/50">
            {!outputJd ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center text-gray-400">
                <Slicon name="file" size={44} className="text-gray-300 mb-3 animate-pulse" />
                <h5 className="font-bold text-gray-700 text-sm mb-1">Preview Sourced Output</h5>
                <p className="text-xs text-gray-400 max-w-sm">
                  Complete the active inputs on the left and trigger generation to render the professional job description outline.
                </p>
              </div>
            ) : (
              <div className="text-xs leading-relaxed text-gray-750 font-serif whitespace-pre-wrap select-text selection:bg-[#D8F3DC] selection:text-[#1A3A2E] whitespace-pre-line">
                {/* Visual markdown divider rendering */}
                {outputJd}
              </div>
            )}
          </div>

          {/* Action panels triggered after generation complete */}
          {outputJd && (
            <div className="flex items-center border-t pt-4 gap-3">
              {/* Regenerate */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-700 bg-white hover:bg-gray-50 transition-all min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Slicon name="refresh" size={14} className={loading ? "animate-spin" : ""} />
                Regenerate
              </button>

              {/* Save As Job */}
              <button
                onClick={() => onSaveAsJob(inputs.title, outputJd)}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#2D6A4F] hover:bg-[#1A3A2E] text-xs font-bold uppercase tracking-wider text-white shadow transition-all min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Slicon name="save" size={14} />
                Save Sourced opening
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
