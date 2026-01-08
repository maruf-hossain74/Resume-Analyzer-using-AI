import React, { useState, useEffect } from "react";
import { FileText, Upload, Loader, Download, FileUp, Copy } from "lucide-react";

// Load PDF.js worker
let pdfjsLib = null;

const loadPdfLib = async () => {
  if (pdfjsLib) return pdfjsLib;
  
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  script.async = true;
  
  return new Promise((resolve) => {
    script.onload = () => {
      pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    document.head.appendChild(script);
  });
};

const extractTextFromPdf = async (arrayBuffer) => {
  try {
    const pdfLib = await loadPdfLib();
    const pdf = await pdfLib.getDocument({ data: arrayBuffer }).promise;
    let extractedText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      extractedText += pageText + '\n';
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF: ' + error.message);
  }
};

const extractJSON = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
};

export default function ResumeAnalyzer({ aiReady }) {
  const [inputMethod, setInputMethod] = useState("paste"); // paste, upload, image
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result;

        if (file.type === "application/pdf") {
          // For PDF files - extract text using PDF.js
          try {
            setResumeText("📄 Extracting text from PDF...");
            const extractedText = await extractTextFromPdf(content);
            
            if (extractedText && extractedText.trim()) {
              setResumeText(extractedText);
            } else {
              setResumeText("❌ No text found in PDF. Please try:\n• Use a text-based PDF (not scanned image)\n• Paste text directly instead\n• Upload a .txt file");
            }
            setLoading(false);
          } catch (err) {
            console.error("PDF Error:", err);
            setResumeText(`❌ Error reading PDF: ${err.message}\n\nPlease try:\n• Use a different PDF\n• Paste text directly\n• Upload a .txt or image file`);
            setLoading(false);
          }
        } else if (file.type.startsWith("image/")) {
          // For images - use Puter's img2txt function with File object
          try {
            setResumeText("🔍 Extracting text from image...");
            
            const extractedText = await window.puter.ai.img2txt(file);
            
            if (extractedText && extractedText.trim()) {
              setResumeText(extractedText);
            } else {
              setResumeText("❌ No text found in image. Please try:\n• Use a clearer/higher quality image\n• Paste text directly instead\n• Upload a .txt file");
            }
            setLoading(false);
          } catch (err) {
            console.error("OCR Error:", err);
            setResumeText("❌ Error extracting text from image: " + err.message + "\n\nPlease try:\n• Use a clearer image\n• Paste text directly\n• Upload a .txt file");
            setLoading(false);
          }
        } else {
          // For text files
          try {
            const text = new TextDecoder().decode(new Uint8Array(content));
            setResumeText(text);
            setLoading(false);
          } catch (err) {
            setResumeText("Error reading file: " + err.message);
            setLoading(false);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setResumeText("Error: " + err.message);
      setLoading(false);
    }
  };

  const analyzeResume = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setAnalysis({
        error: "Please provide both resume and job description",
      });
      return;
    }

    setLoading(true);
    setAnalysis(null);

    const prompt = `
You are an expert HR recruiter and resume analyst. Analyze the following resume against the job description and provide a comprehensive evaluation.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY JSON with NO additional text:
{
  "candidateScore": 0-100,
  "verdict": "Strong Fit / Good Fit / Moderate Fit / Weak Fit",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "technicalSkillsGap": ["missing_skill1", "missing_skill2"],
  "suggestions": ["improvement1", "improvement2", "improvement3"],
  "summary": "2-3 sentence overall assessment"
}
`;

    try {
      const res = await window.puter.ai.chat(prompt);
      const text = typeof res === "string" ? res : res.message?.content || res;
      const parsed = extractJSON(text);

      if (parsed) {
        setAnalysis(parsed);
      } else {
        setAnalysis({
          error:
            "Failed to analyze resume. Please try again with a clearer resume.",
        });
      }
    } catch (err) {
      setAnalysis({ error: "Error: " + err.message });
    }
    setLoading(false);
  };

  const copyAnalysisToClipboard = () => {
    const text = JSON.stringify(analysis, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!aiReady) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-sky-400" />
        <p className="text-gray-400">Loading AI capabilities...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pb-20">
      <div className="pt-10">
        <h1 className="text-4xl font-bold mb-2">Resume Analyzer</h1>
        <p className="text-gray-400 mb-8">
          Upload your resume and provide a job description to get AI-powered
          analysis and insights.
        </p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {/* Input Method Selector */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="font-bold text-lg mb-4">Resume Input</h2>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/50 transition">
                  <input
                    type="radio"
                    name="input"
                    value="paste"
                    checked={inputMethod === "paste"}
                    onChange={(e) => setInputMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 font-semibold">Paste Text</span>
                </label>
                <label className="flex items-center p-3 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/50 transition">
                  <input
                    type="radio"
                    name="input"
                    value="upload"
                    checked={inputMethod === "upload"}
                    onChange={(e) => setInputMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 font-semibold">Upload PDF/TXT</span>
                </label>
                <label className="flex items-center p-3 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/50 transition">
                  <input
                    type="radio"
                    name="input"
                    value="image"
                    checked={inputMethod === "image"}
                    onChange={(e) => setInputMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 font-semibold">Upload Image</span>
                </label>
              </div>
            </div>

            {/* Resume Input */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                {inputMethod === "paste"
                  ? "Your Resume"
                  : inputMethod === "upload"
                  ? "Upload Resume (PDF/TXT)"
                  : "Upload Resume (Image)"}
              </h3>

              {inputMethod === "paste" ? (
                <textarea
                  className="w-full h-64 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none resize-none text-white"
                  placeholder="Paste your resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              ) : (
                <div>
                  <label className="flex items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-sky-500 transition">
                    <input
                      type="file"
                      accept={
                        inputMethod === "upload"
                          ? ".pdf,.txt,.doc,.docx"
                          : "image/*"
                      }
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <FileUp className="w-6 h-6 text-sky-400" />
                    <span className="font-semibold">
                      Click to upload or drag and drop
                    </span>
                  </label>
                  {fileName && (
                    <p className="text-sm text-gray-400 mt-2">
                      Selected: {fileName}
                    </p>
                  )}
                  {resumeText && (
                    <div className="mt-4 p-3 bg-gray-800 rounded-lg text-sm text-gray-300 max-h-40 overflow-y-auto">
                      <p className="font-semibold mb-2">Preview:</p>
                      {resumeText.substring(0, 300)}...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Job Description */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                Job Description
              </h3>
              <textarea
                className="w-full h-64 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none resize-none text-white"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {/* Analyze Button */}
            <button
              onClick={analyzeResume}
              disabled={loading || !resumeText.trim()}
              className="w-full py-4 bg-sky-600 hover:bg-sky-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Analyze Resume
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Results */}
          <div>
            {analysis && !analysis.error && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6 sticky top-24">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold">Analysis Results</h2>
                  <button
                    onClick={copyAnalysisToClipboard}
                    className="p-2 hover:bg-gray-800 rounded-lg transition"
                    title="Copy to clipboard"
                  >
                    <Copy
                      className={`w-5 h-5 ${copied ? "text-emerald-400" : "text-gray-400"}`}
                    />
                  </button>
                </div>

                {/* Score */}
                <div className="text-center">
                  <div className="text-6xl font-bold text-sky-400">
                    {analysis.candidateScore}%
                  </div>
                  <div className="text-xl font-semibold mt-2">
                    {analysis.verdict}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Summary</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                {/* Strengths */}
                <div>
                  <h4 className="font-bold mb-3 text-emerald-400">Strengths</h4>
                  <ul className="space-y-2">
                    {analysis.strengths?.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span className="text-gray-300">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div>
                  <h4 className="font-bold mb-3 text-red-400">Weaknesses</h4>
                  <ul className="space-y-2">
                    {analysis.weaknesses?.map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">✗</span>
                        <span className="text-gray-300">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Skill Gaps */}
                {analysis.technicalSkillsGap?.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-3 text-yellow-400">
                      Technical Skill Gaps
                    </h4>
                    <ul className="space-y-2">
                      {analysis.technicalSkillsGap.map((skill, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-yellow-400 font-bold">⚠</span>
                          <span className="text-gray-300">{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                <div>
                  <h4 className="font-bold mb-3 text-purple-400">
                    How to Improve
                  </h4>
                  <ul className="space-y-2">
                    {analysis.suggestions?.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold">→</span>
                        <span className="text-gray-300">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {analysis?.error && (
              <div className="bg-red-900/20 border border-red-900/50 rounded-2xl p-6">
                <p className="text-red-400 font-semibold">{analysis.error}</p>
              </div>
            )}

            {!analysis && !loading && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  Results will appear here after analysis
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
