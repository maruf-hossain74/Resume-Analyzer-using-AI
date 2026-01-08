import React, { useState } from "react";
import {
  Users,
  Upload,
  Loader,
  Trash2,
  Mail,
  FileUp,
  ChevronDown,
  CheckCircle,
} from "lucide-react";

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

export default function ResumeRanker({ aiReady }) {
  const [resumes, setResumes] = useState([]);
  const [jobDescription, setJobDescription] = useState("");
  const [rankings, setRankings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState({});
  const [emailDialog, setEmailDialog] = useState(null);
  const [emailForm, setEmailForm] = useState({ email: "", subject: "", body: "" });

  const handleResumeUpload = async (e) => {
    const files = e.target.files;
    if (!files) return;

    for (let file of files) {
      // Handle images directly with Puter's img2txt
      if (file.type.startsWith("image/")) {
        try {
          const extractedText = await window.puter.ai.img2txt(file);
          
          if (extractedText && extractedText.trim()) {
            addResume(file.name, extractedText);
          } else {
            addResume(file.name, "⚠️ No text found in image. Please use a clearer image or upload as .txt file.");
          }
        } catch (err) {
          console.error("OCR error:", err);
          addResume(file.name, "Error extracting text from image: " + err.message);
        }
      } else {
        // For other file types, use FileReader
        const reader = new FileReader();
        reader.onload = async (event) => {
          const content = event.target?.result;

          try {
            if (file.type === "application/pdf") {
              try {
                const extractedText = await extractTextFromPdf(content);
                
                if (extractedText && extractedText.trim()) {
                  addResume(file.name, extractedText);
                } else {
                  addResume(file.name, "❌ No text found in PDF. Please try:\n• Use a text-based PDF (not scanned image)\n• Upload a .txt file instead");
                }
              } catch (err) {
                console.error("PDF Error:", err);
                addResume(file.name, `❌ Error reading PDF: ${err.message}\n\nPlease try:\n• Use a different PDF\n• Upload a .txt file`);
              }
            } else {
              // Other file types (text, etc)
              try {
                const text = new TextDecoder().decode(new Uint8Array(content));
                addResume(file.name, text);
              } catch (err) {
                addResume(file.name, "Error reading file: " + err.message);
              }
            }
          } catch (err) {
            console.error("File read error:", err);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

  const addResume = (name, text) => {
    setResumes((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name,
        text,
        preview: text.substring(0, 150) + "...",
      },
    ]);
  };

  const deleteResume = (id) => {
    setResumes((prev) => prev.filter((r) => r.id !== id));
  };

  const rankResumes = async () => {
    if (!resumes.length || !jobDescription.trim()) {
      alert("Please upload resumes and provide a job description");
      return;
    }

    setLoading(true);
    setRankings(null);

    const resumesList = resumes
      .map((r, i) => `CANDIDATE_NAME: ${r.name}\nCONTENT:\n${r.text}`)
      .join("\n\n---NEXT_CANDIDATE---\n\n");

    const prompt = `
You are an expert HR recruiter. Rank the following candidates based on the job description.

JOB DESCRIPTION:
${jobDescription}

RESUMES (Each candidate is marked with CANDIDATE_NAME):
${resumesList}

Rank them from best to worst fit. For each candidate, use the exact filename as the candidateName in your response.

Return ONLY JSON with NO additional text:
{
  "rankedCandidates": [
    {
      "rank": 1,
      "candidateName": "EXACT_FILENAME_HERE",
      "score": 0-100,
      "verdict": "Strong Fit / Good Fit / Moderate Fit / Weak Fit",
      "strengths": ["strength1", "strength2"],
      "gaps": ["gap1", "gap2"],
      "overallAssessment": "1-2 sentence summary"
    }
  ]
}
`;

    try {
      const res = await window.puter.ai.chat(prompt);
      const text = typeof res === "string" ? res : res.message?.content || res;
      const parsed = extractJSON(text);

      if (parsed) {
        setRankings(parsed.rankedCandidates);
      } else {
        alert("Failed to rank resumes. Please try again.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const openEmailDialog = (candidate, index) => {
    setEmailDialog({
      candidateName: candidate.candidateName,
      index,
      position: "Senior Software Engineer", // default
    });
    setEmailForm({
      email: "candidate@example.com",
      subject: `Interview Invitation - ${candidate.candidateName}`,
      body: `Dear ${candidate.candidateName},\n\nWe are pleased to invite you to interview for the Senior Software Engineer position.\n\nPlease confirm your availability at your earliest convenience.\n\nBest regards,\nHR Team`,
    });
  };

  const sendInterviewInvite = async () => {
    if (!emailDialog) return;

    // For demo, we'll use Puter's mail functionality if available
    // In production, you'd use a backend service
    alert(
      `Email would be sent to: ${emailForm.email}\n\nSubject: ${emailForm.subject}\n\nBody: ${emailForm.body}`
    );
    setEmailStatus((prev) => ({
      ...prev,
      [emailDialog.index]: "sent",
    }));
    setEmailDialog(null);
  };

  if (!aiReady) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
        <p className="text-gray-400">Loading AI capabilities...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20 pt-10">
      <h1 className="text-4xl font-bold mb-2">Resume Ranker for HR</h1>
      <p className="text-gray-400 mb-8">
        Upload multiple resumes and let AI automatically rank candidates for
        your position.
      </p>

      {!rankings ? (
        <div className="grid lg:grid-cols-[1fr_1fr] gap-8">
          {/* Left Panel - Uploads */}
          <div className="space-y-6">
            {/* Resume Uploads */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Upload Resumes (Multiple)
              </h3>

              <label className="flex items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-purple-500 transition">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx,image/*"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
                <FileUp className="w-6 h-6 text-purple-400" />
                <span className="font-semibold">
                  Upload one or more resumes
                </span>
              </label>

              {resumes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    {resumes.length} resume(s) uploaded
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {resumes.map((resume) => (
                      <div
                        key={resume.id}
                        className="bg-gray-800 p-3 rounded-lg flex justify-between items-start gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {resume.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {resume.preview}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteResume(resume.id)}
                          className="p-2 hover:bg-red-900/20 rounded text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Job Description */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg">Job Description</h3>
              <textarea
                className="w-full h-64 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none text-white"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {/* Rank Button */}
            <button
              onClick={rankResumes}
              disabled={loading || resumes.length === 0 || !jobDescription.trim()}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Ranking Candidates...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  Rank All Candidates
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Summary */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-fit sticky top-24">
            <h3 className="font-bold text-lg mb-4">Summary</h3>
            <div className="space-y-4 text-gray-400">
              <div>
                <p className="text-sm">Resumes Uploaded</p>
                <p className="text-3xl font-bold text-purple-400">
                  {resumes.length}
                </p>
              </div>
              <div>
                <p className="text-sm">Job Description Status</p>
                <p className="text-lg font-semibold">
                  {jobDescription.trim()
                    ? "✓ Provided"
                    : "✗ Not provided"}
                </p>
              </div>
              <div className="bg-purple-900/20 border border-purple-900/50 p-4 rounded-lg text-sm">
                <p className="font-semibold mb-2">Ready to rank?</p>
                <p>
                  Upload resumes, add a job description, and click "Rank All
                  Candidates" to get AI-powered rankings.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Rankings View */
        <div className="space-y-6">
          <button
            onClick={() => {
              setRankings(null);
              setResumes([]);
              setJobDescription("");
            }}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition"
          >
            ← Back to Upload
          </button>

          {rankings.map((candidate, idx) => (
            <div
              key={idx}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg px-4 py-3 font-bold text-xl text-white">
                    #{candidate.rank}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">
                      {candidate.candidateName}
                    </h3>
                    <p className="text-gray-400 mt-1">
                      {candidate.verdict}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-purple-400">
                    {candidate.score}
                  </div>
                  <div className="text-sm text-gray-400">Match Score</div>
                </div>
              </div>

              {/* Assessment */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-300 leading-relaxed">
                  {candidate.overallAssessment}
                </p>
              </div>

              {/* Strengths & Gaps */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold mb-3 text-emerald-400">Strengths</h4>
                  <ul className="space-y-2">
                    {candidate.strengths?.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-1">✓</span>
                        <span className="text-gray-300 text-sm">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-3 text-red-400">Skill Gaps</h4>
                  <ul className="space-y-2">
                    {candidate.gaps?.map((g, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">✗</span>
                        <span className="text-gray-300 text-sm">{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => openEmailDialog(candidate, idx)}
                  disabled={emailStatus[idx] === "sent"}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                    emailStatus[idx] === "sent"
                      ? "bg-emerald-900/20 text-emerald-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-500"
                  }`}
                >
                  {emailStatus[idx] === "sent" ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Invited
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Email Dialog Modal */}
      {emailDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full space-y-6 p-8">
            <h2 className="text-2xl font-bold">
              Send Interview Invitation to {emailDialog.candidateName}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Candidate Email
                </label>
                <input
                  type="email"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                  value={emailForm.email}
                  onChange={(e) =>
                    setEmailForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="candidate@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                  value={emailForm.subject}
                  onChange={(e) =>
                    setEmailForm((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Email Body
                </label>
                <textarea
                  className="w-full h-40 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none text-white"
                  value={emailForm.body}
                  onChange={(e) =>
                    setEmailForm((prev) => ({ ...prev, body: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEmailDialog(null)}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={sendInterviewInvite}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition"
              >
                <Mail className="w-4 h-4" />
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}