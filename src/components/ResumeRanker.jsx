import React, { useState } from "react";
import {
  Upload,
  ArrowLeft,
  Loader,
  TrendingUp,
  Mail,
  Trash2,
  Send,
} from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import * as Tesseract from "tesseract.js";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function ResumeRanker({ onBack, jobDescription: initialJobDescription }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const [emailModal, setEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("Interview Opportunity");
  const [emailMessage, setEmailMessage] = useState(
    "We are impressed with your profile and would like to invite you for an interview."
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const [jobDescription, setJobDescription] = useState(initialJobDescription || "");

  const extractTextFromFile = async (file) => {
    try {
      setExtracting(true);
      
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item) => item.str || "")
              .join(" ");
            text += pageText + "\n";
          } catch (pageError) {
            console.warn(`Could not extract page ${i}`);
          }
        }
        
        setExtracting(false);
        return text;
      } else if (file.type.startsWith("image/")) {
        const result = await Tesseract.recognize(file, "eng");
        setExtracting(false);
        return result.data.text;
      }
      
      setExtracting(false);
      return "";
    } catch (error) {
      console.error("Error extracting text:", error);
      setExtracting(false);
      return "";
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    const newCandidates = [];

    for (const file of files) {
      const resumeText = await extractTextFromFile(file);
      
      if (resumeText.trim()) {
        const analysis = analyzeResume(resumeText);
        newCandidates.push({
          id: Date.now() + Math.random(),
          fileName: file.name,
          resumeText,
          email: extractEmail(resumeText) || "",
          phone: extractPhone(resumeText) || "",
          name: extractName(resumeText) || "Unknown",
          ...analysis,
        });
      }
    }

    setCandidates([...candidates, ...newCandidates].sort((a, b) => b.matchPercentage - a.matchPercentage));
    setLoading(false);
  };

  const analyzeResume = (resume) => {
    const resumeSkills = extractSkills(resume);
    const jobSkills = jobDescription ? extractSkills(jobDescription) : { technical: [], soft: [] };
    
    const matchPercentage = calculateMatch(resume, jobDescription);
    const atsScore = calculateATSScore(resume);

    return {
      resumeText: resume,
      resumeSkills,
      jobSkills,
      matchPercentage,
      atsScore,
      missingSkills: jobSkills.technical.filter(
        (skill) => !resumeSkills.technical.includes(skill)
      ),
      presentSkills: resumeSkills.technical.filter((skill) =>
        jobSkills.technical.includes(skill)
      ),
    };
  };

  const levenshteinDistance = (s1, s2) => {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix = Array(len2 + 1)
      .fill(null)
      .map(() => Array(len1 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[len2][len1];
  };

  const calculateSemanticSimilarity = (term1, term2) => {
    const maxLen = Math.max(term1.length, term2.length);
    if (maxLen === 0) return 1.0;
    const distance = levenshteinDistance(term1, term2);
    return 1 - distance / maxLen;
  };

  const extractConcepts = (text) => {
    const textLower = text.toLowerCase();
    const concepts = new Set();

    const semanticThesaurus = {
      "frontend": ["react", "vue", "angular", "svelte", "html", "css", "sass", "less", "bootstrap", "tailwind", "javascript", "typescript", "responsive", "ui", "ux", "jsx", "tsx"],
      "backend": ["nodejs", "node.js", "python", "java", "spring", "django", "flask", "fastapi", "laravel", "rails", "api", "rest", "graphql", "express"],
      "database": ["sql", "mongodb", "postgresql", "mysql", "firebase", "redis", "nosql", "elasticsearch", "cassandra", "oracle", "mariadb"],
      "devops": ["docker", "kubernetes", "ci/cd", "jenkins", "gitlab", "github actions", "terraform", "ansible", "aws", "gcp", "azure", "automation"],
      "cloud": ["aws", "azure", "gcp", "cloud", "serverless", "lambda", "ec2", "s3", "cloudflare", "heroku"],
      "testing": ["jest", "pytest", "junit", "testing", "unit test", "integration test", "e2e", "test", "mocha", "rspec", "cucumber"],
      "version control": ["git", "github", "gitlab", "bitbucket", "svn", "version control", "scm"],
      "tools": ["webpack", "vite", "babel", "npm", "yarn", "pnpm", "maven", "gradle", "parcel", "rollup"],
      "communication": ["communication", "collaboration", "teamwork", "presentation", "writing", "documentation"],
      "leadership": ["leadership", "management", "mentoring", "coaching", "delegation", "team lead"],
      "problem solving": ["problem solving", "debugging", "optimization", "critical thinking", "analysis", "troubleshooting"],
      "mobile": ["react native", "flutter", "swift", "kotlin", "android", "ios", "mobile development", "xamarin"],
      "ai_ml": ["machine learning", "deep learning", "tensorflow", "pytorch", "keras", "scikit-learn", "ai", "nlp", "cv", "artificial intelligence", "data science"],
      "security": ["security", "encryption", "ssl", "tls", "authentication", "authorization", "jwt", "oauth", "penetration testing"],
    };

    Object.entries(semanticThesaurus).forEach(([key, relatedTerms]) => {
      if (textLower.includes(key.replace("_", " "))) {
        concepts.add(key.replace("_", " "));
      }
      relatedTerms.forEach((term) => {
        if (textLower.includes(term)) {
          concepts.add(key.replace("_", " "));
        }
      });
    });

    return Array.from(concepts);
  };

  const calculateMatch = (resume, jobDesc) => {
    if (!jobDesc || !jobDesc.trim()) return 50;

    const resumeText = resume.toLowerCase();
    const jobDescText = jobDesc.toLowerCase();

    // First try concept-based matching
    const resumeConcepts = extractConcepts(resume);
    const jobConcepts = extractConcepts(jobDesc);

    let totalScore = 0;
    let conceptMatches = 0;

    // Score concepts
    if (jobConcepts.length > 0) {
      jobConcepts.forEach((jobConcept) => {
        if (resumeConcepts.includes(jobConcept)) {
          totalScore += 100;
          conceptMatches += 1;
        } else {
          const similarConcepts = resumeConcepts.filter(
            (concept) => calculateSemanticSimilarity(jobConcept, concept) > 0.6
          );
          if (similarConcepts.length > 0) {
            totalScore += 60;
            conceptMatches += 1;
          }
        }
      });
    }

    // Also do keyword-based matching as supplementary
    const jobKeywords = jobDescText
      .split(/\s+/)
      .filter(w => w.length > 4 && !["with", "from", "must", "have", "that", "your", "will", "able"].includes(w));
    
    let keywordMatches = 0;
    jobKeywords.forEach((keyword) => {
      if (resumeText.includes(keyword)) {
        keywordMatches++;
      }
    });

    // Combine both scoring methods
    let finalScore = 0;
    
    if (jobConcepts.length > 0) {
      const conceptScore = (totalScore / (jobConcepts.length * 100)) * 100;
      const keywordScore = jobKeywords.length > 0 
        ? (keywordMatches / jobKeywords.length) * 100 
        : 0;
      
      // Weight: 60% concepts, 40% keywords
      finalScore = (conceptScore * 0.6) + (keywordScore * 0.4);
    } else {
      // Fallback to keyword-only matching
      finalScore = jobKeywords.length > 0 
        ? Math.round((keywordMatches / jobKeywords.length) * 100)
        : 50;
    }

    return Math.min(Math.max(Math.round(finalScore), 0), 100);
  };

  const calculateATSScore = (resume) => {
    let score = 50;

    const sections = [
      "experience",
      "education",
      "skills",
      "projects",
      "certification",
    ];
    const foundSections = sections.filter((section) =>
      resume.toLowerCase().includes(section)
    );
    score += foundSections.length * 5;

    if ((resume.match(/[•\-\*]/g) || []).length > 5) score += 10;

    const actionVerbs = [
      "developed",
      "managed",
      "led",
      "created",
      "implemented",
      "designed",
    ];
    if (actionVerbs.some((verb) => resume.toLowerCase().includes(verb)))
      score += 5;

    return Math.min(score, 100);
  };

  const extractSkills = (text) => {
    const textLower = text.toLowerCase();
    const technicalSkills = [
      "javascript", "typescript", "python", "java", "react", "vue", "angular",
      "node.js", "express", "django", "flask", "sql", "mongodb", "aws", "azure",
      "docker", "kubernetes", "git", "rest api", "graphql", "html", "css",
      "devops", "ci/cd", "jenkins", "terraform", "ansible", "kafka", "redis",
      "testing", "jest", "pytest", "agile", "scrum", "kubernetes", "machine learning",
    ];

    const softSkills = [
      "communication", "leadership", "problem solving", "teamwork",
      "project management", "critical thinking", "time management",
    ];

    const foundTechnical = technicalSkills.filter((skill) =>
      textLower.includes(skill)
    );
    const foundSoft = softSkills.filter((skill) => textLower.includes(skill));

    return {
      technical: [...new Set(foundTechnical)],
      soft: [...new Set(foundSoft)],
    };
  };

  const extractEmail = (text) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(emailRegex);
    return match ? match[0] : "";
  };

  const extractPhone = (text) => {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const match = text.match(phoneRegex);
    return match ? match[0] : "";
  };

  const extractName = (text) => {
    const lines = text.split("\n");
    return lines[0]?.trim().substring(0, 50) || "Candidate";
  };

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCandidates(newSelected);
  };

  const deleteCandidate = (id) => {
    setCandidates(candidates.filter((c) => c.id !== id));
  };

  const handleSendEmails = async () => {
    if (selectedCandidates.size === 0) {
      alert("Please select candidates to send emails");
      return;
    }

    setSendingEmail(true);

    const selectedList = candidates.filter((c) =>
      selectedCandidates.has(c.id)
    );

    // Simulate sending emails (in production, use EmailJS or backend API)
    for (const candidate of selectedList) {
      if (candidate.email) {
        console.log(
          `Email sent to ${candidate.name} (${candidate.email}):`,
          emailMessage
        );
        // In production, use:
        // await sendEmail(candidate.email, emailSubject, emailMessage);
      }
    }

    setSendingEmail(false);
    alert(
      `Email templates prepared for ${selectedList.length} candidates. In production, integrate EmailJS or your email service.`
    );
    setEmailModal(false);
    setSelectedCandidates(new Set());
  };

  const getRankBadge = (percentage) => {
    if (percentage >= 80) return { color: "bg-emerald-600", label: "Excellent" };
    if (percentage >= 60) return { color: "bg-blue-600", label: "Good" };
    if (percentage >= 40) return { color: "bg-amber-600", label: "Fair" };
    return { color: "bg-red-600", label: "Poor" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-3 rounded-xl">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Resume Ranker</h1>
                <p className="text-slate-400 text-sm mt-1">Bulk Resume Analysis & Candidate Ranking</p>
              </div>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-5 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>
          <div className="h-0.5 bg-gradient-to-r from-blue-600 via-cyan-600 to-transparent"></div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 sticky top-8">
              {/* Job Description */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-white mb-2">Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description here for better matching..."
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none text-sm resize-none h-24"
                />
              </div>

              <h2 className="text-lg font-bold text-white mb-6">Upload Resumes</h2>
              
              <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-slate-700/30 transition-all cursor-pointer mb-6">
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  disabled={loading || extracting}
                  className="hidden"
                  id="resume-input"
                />
                <label htmlFor="resume-input" className="cursor-pointer block">
                  {extracting || loading ? (
                    <>
                      <Loader className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-spin" />
                      <p className="text-white font-semibold text-sm">Processing...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                      <p className="text-white font-semibold text-sm">Upload PDFs or Images</p>
                      <p className="text-slate-400 text-xs mt-2">Multiple files supported</p>
                    </>
                  )}
                </label>
              </div>

              {/* Stats */}
              {candidates.length > 0 && (
                <div className="space-y-3 bg-slate-700/50 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">Total Candidates</p>
                    <p className="text-2xl font-bold text-white">{candidates.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">Selected</p>
                    <p className="text-2xl font-bold text-blue-400">{selectedCandidates.size}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {candidates.length > 0 && (
                <div className="space-y-3 mt-6">
                  <button
                    onClick={() => setEmailModal(true)}
                    disabled={selectedCandidates.size === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Mail className="w-5 h-5" />
                    Send Email
                  </button>
                  <button
                    onClick={() => {
                      setCandidates([]);
                      setSelectedCandidates(new Set());
                    }}
                    className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-300 font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Candidates List */}
          <div className="lg:col-span-3">
            {candidates.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-16 border border-slate-700 text-center">
                <Upload className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400 text-lg font-medium">No resumes uploaded yet</p>
                <p className="text-slate-500 text-sm mt-2">Upload PDF or image resumes to see rankings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {candidates.map((candidate) => {
                  const badge = getRankBadge(candidate.matchPercentage);
                  const isSelected = selectedCandidates.has(candidate.id);

                  return (
                    <div
                      key={candidate.id}
                      className={`bg-slate-800 rounded-xl p-6 border transition-all cursor-pointer ${
                        isSelected
                          ? "border-blue-500 bg-slate-800/60"
                          : "border-slate-700 hover:border-slate-600"
                      }`}
                      onClick={() => toggleSelection(candidate.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(candidate.id)}
                            className="w-5 h-5 mt-1 cursor-pointer accent-blue-600"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1">
                              {candidate.name}
                            </h3>
                            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                              {candidate.email && (
                                <a
                                  href={`mailto:${candidate.email}`}
                                  className="text-blue-400 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {candidate.email}
                                </a>
                              )}
                              {candidate.phone && <span>{candidate.phone}</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCandidate(candidate.id);
                          }}
                          className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Scores */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-slate-700/50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs mb-1">Job Match</p>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-white">
                              {candidate.matchPercentage}%
                            </span>
                            <span className={`${badge.color} text-white text-xs font-semibold px-2 py-1 rounded`}>
                              {badge.label}
                            </span>
                          </div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs mb-1">ATS Score</p>
                          <p className="text-2xl font-bold text-emerald-400">{candidate.atsScore}</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs mb-1">Skills</p>
                          <p className="text-2xl font-bold text-blue-400">
                            {candidate.resumeSkills.technical.length}
                          </p>
                        </div>
                      </div>

                      {/* Skills Section */}
                      <div className="space-y-4">
                        {/* Technical Skills */}
                        <div>
                          <p className="text-slate-400 text-xs font-semibold mb-2">
                            Technical Skills ({candidate.resumeSkills.technical.length})
                          </p>
                          {candidate.resumeSkills.technical.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {candidate.resumeSkills.technical.slice(0, 8).map((skill) => (
                                <span
                                  key={skill}
                                  className={`text-xs px-2 py-1 rounded ${
                                    candidate.presentSkills.includes(skill)
                                      ? "bg-emerald-900/40 text-emerald-300"
                                      : "bg-blue-900/40 text-blue-300"
                                  }`}
                                >
                                  {skill}
                                </span>
                              ))}
                              {candidate.resumeSkills.technical.length > 8 && (
                                <span className="text-slate-400 text-xs px-2 py-1">
                                  +{candidate.resumeSkills.technical.length - 8} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-slate-500 text-xs italic">No technical skills detected</p>
                          )}
                        </div>

                        {/* Soft Skills */}
                        {candidate.resumeSkills.soft.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs font-semibold mb-2">Soft Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {candidate.resumeSkills.soft.map((skill) => (
                                <span
                                  key={skill}
                                  className="bg-purple-900/40 text-purple-300 text-xs px-2 py-1 rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing Skills for Job */}
                        {jobDescription && candidate.missingSkills.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs font-semibold mb-2">
                              Missing Skills for Job ({candidate.missingSkills.length})
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {candidate.missingSkills.slice(0, 5).map((skill) => (
                                <span
                                  key={skill}
                                  className="bg-red-900/40 text-red-300 text-xs px-2 py-1 rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                              {candidate.missingSkills.length > 5 && (
                                <span className="text-slate-400 text-xs px-2 py-1">
                                  +{candidate.missingSkills.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Send Emails</h2>
              <button
                onClick={() => setEmailModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Recipients Summary */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-2">Sending to:</p>
                <div className="flex flex-wrap gap-2">
                  {candidates
                    .filter((c) => selectedCandidates.has(c.id) && c.email)
                    .map((c) => (
                      <span
                        key={c.id}
                        className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-sm"
                      >
                        {c.email}
                      </span>
                    ))}
                </div>
                <p className="text-slate-400 text-xs mt-3">
                  {candidates.filter((c) => selectedCandidates.has(c.id) && !c.email).length}{" "}
                  candidates without email will be skipped
                </p>
              </div>

              {/* Email Subject */}
              <div>
                <label className="block text-white font-semibold mb-2">Email Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Email subject line"
                />
              </div>

              {/* Email Message */}
              <div>
                <label className="block text-white font-semibold mb-2">Email Message</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Compose your email message"
                />
              </div>

              {/* Note */}
              <div className="bg-amber-600/20 border border-amber-600/50 rounded-lg p-4">
                <p className="text-amber-200 text-sm">
                  <strong>Note:</strong> To send actual emails, integrate EmailJS or connect to your email service backend.
                  This demo prepares the templates for sending.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleSendEmails}
                  disabled={sendingEmail}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {sendingEmail ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Emails
                    </>
                  )}
                </button>
                <button
                  onClick={() => setEmailModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
