import React, { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { dracula } from "@uiw/codemirror-theme-dracula";
import {
  Code,
  Play,
  Timer,
  MessageCircle,
  CheckCircle,
  ArrowLeft,
  FileText,
  TrendingUp,
} from "lucide-react";
import ResumeAnalyzer from "./components/ResumeAnalyzer";
import ResumeRanker from "./components/ResumeRanker";

/* ---------------- helpers ---------------- */
const extractJSON = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
};

const languageConfig = {
  JavaScript: {
    extension: javascript(),
    template: `function solution() {\n  \n}`,
  },
  Python: {
    extension: python(),
    template: `def solution():\n    pass`,
  },
  Java: {
    extension: java(),
    template: `class Solution {\n  public static void solution() {\n    \n  }\n}`,
  },
  "C++": {
    extension: cpp(),
    template: `#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solution() {\n\n}`,
  },
};

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const [aiReady, setAiReady] = useState(false);
  const [language, setLanguage] = useState("C++");
  const [difficulty, setDifficulty] = useState("Medium");
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState(languageConfig["C++"].template);
  const [clarification, setClarification] = useState("");
  const [clarificationReply, setClarificationReply] = useState("");
  const [feedback, setFeedback] = useState("");
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);

  /* ---------- Puter readiness ---------- */
  useEffect(() => {
    const i = setInterval(() => {
      if (window.puter?.ai?.chat) {
        setAiReady(true);
        clearInterval(i);
      }
    }, 500);
    return () => clearInterval(i);
  }, []);

  /* ---------- timer ---------- */
  useEffect(() => {
    if (!question || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [question, timeLeft]);

  /* ---------- language switch ---------- */
  useEffect(() => {
    setCode(languageConfig[language].template);
  }, [language]);

  /* ---------- reset interview ---------- */
  const resetInterview = () => {
    setQuestion(null);
    setScorecard(null);
    setFeedback("");
    setClarification("");
    setClarificationReply("");
    setTimeLeft(45 * 60);
    setCode(languageConfig[language].template);
  };

  /* ---------- generate question ---------- */
  const generateQuestion = async () => {
    setLoading(true);
    resetInterview();

    const prompt = `
Generate a FAANG-style ${difficulty} coding interview problem.

Return ONLY JSON:
{
  "problem": "",
  "examples": "",
  "constraints": "",
  "followUp": ""
}
`;

    const res = await window.puter.ai.chat(prompt);
    const text = typeof res === "string" ? res : res.message.content;
    const parsed = extractJSON(text);

    if (parsed) setQuestion(parsed);
    else setFeedback("❌ Failed to generate question.");

    setLoading(false);
  };

  /* ---------- clarifying question ---------- */
  const askClarification = async () => {
    if (!clarification) return;
    setClarificationReply("Interviewer is thinking...");

    const prompt = `
You are the interviewer.
Answer the candidate's clarification briefly and realistically.

Question:
${clarification}
`;

    const res = await window.puter.ai.chat(prompt);
    setClarificationReply(
      typeof res === "string" ? res : res.message.content
    );
  };

  /* ---------- submit solution ---------- */
  const submitSolution = async () => {
    setLoading(true);

    const prompt = `
You are a FAANG interviewer.

Language: ${language}
Problem:
${question.problem}

Candidate Solution:
${code}

Evaluate and score.

Return JSON ONLY:
{
  "scores": {
    "correctness": 0,
    "efficiency": 0,
    "codeQuality": 0,
    "communication": 0,
    "problemSolving": 0
  },
  "verdict": "Hire / No Hire",
  "feedback": ""
}
`;

    const res = await window.puter.ai.chat(prompt);
    const text = typeof res === "string" ? res : res.message.content;
    const parsed = extractJSON(text);

    if (parsed) {
      setScorecard(parsed);
      setFeedback(parsed.feedback);
    } else {
      setFeedback("❌ Evaluation failed.");
    }

    setLoading(false);
  };

  /* ---------- UI ---------- */
  if (currentView === "resume-analyzer") {
    return <ResumeAnalyzer onBack={() => setCurrentView("home")} />;
  }

  if (currentView === "resume-ranker") {
    return <ResumeRanker onBack={() => setCurrentView("home")} jobDescription={""} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-tight">
            Career Development Hub
          </h1>
          <p className="text-slate-300 text-xl max-w-2xl mx-auto">
            Master your interview skills and optimize your resume for maximum impact
          </p>
        </div>

      {!question ? (
        /* ---------- start screen ---------- */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Interview Coach Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-10 rounded-xl border border-slate-600 shadow-xl hover:shadow-2xl transition-all">
            <div className="bg-gradient-to-br from-emerald-600 to-green-600 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <Code className="text-white w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Interview Coach</h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              Practice FAANG-style coding interviews with real-time feedback from our AI interviewer. Improve your problem-solving skills with targeted guidance.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block mb-3 font-semibold text-slate-300">Programming Language</label>
                <select
                  className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {Object.keys(languageConfig).map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-3 font-semibold text-slate-300">Problem Difficulty</label>
                <select
                  className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>

            <button
              disabled={!aiReady || loading}
              onClick={generateQuestion}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg"
            >
              {loading ? "Generating Interview..." : "Start Interview Practice"}
            </button>
            {!aiReady && <p className="text-yellow-400 text-xs mt-3 text-center">Loading AI interviewer...</p>}
          </div>

          {/* Resume Analyzer Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-10 rounded-xl border border-slate-600 shadow-xl hover:shadow-2xl transition-all">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <FileText className="text-white w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Resume Analyzer</h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              Optimize your resume for ATS systems and align it perfectly with job descriptions. Get actionable recommendations to increase interview callbacks.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                ATS Compatibility Analysis
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Job Description Matching
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Personalized Recommendations
              </div>
            </div>

            <button
              onClick={() => setCurrentView("resume-analyzer")}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Open Resume Analyzer
            </button>
          </div>

          {/* Resume Ranker Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-10 rounded-xl border border-slate-600 shadow-xl hover:shadow-2xl transition-all">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <TrendingUp className="text-white w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Resume Ranker</h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              Bulk analyze multiple resumes and rank candidates by match score. Send interview invitations directly to selected candidates with personalized emails.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Batch Resume Upload
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Automated Ranking & Scoring
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Email Candidates Directly
              </div>
            </div>

            <button
              onClick={() => setCurrentView("resume-ranker")}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              Open Resume Ranker
            </button>
          </div>
        </div>
      ) : (
        /* ---------- interview screen ---------- */
        <div className="max-w-7xl mx-auto space-y-8">
          {/* header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Timer />
              {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sky-400 font-semibold">
                {language}
              </span>
              <button
                onClick={resetInterview}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft />
                Go Back
              </button>
            </div>
          </div>

          {/* main grid */}
          <div className="grid lg:grid-cols-[1.05fr_1.2fr] gap-8 items-start">
            {/* problem */}
            <div className="bg-gray-900 p-6 rounded-xl space-y-6">
              <section>
                <h3 className="text-emerald-400 font-semibold mb-2">
                  Problem
                </h3>
                <p className="leading-relaxed">{question.problem}</p>
              </section>

              <section>
                <h3 className="text-emerald-400 font-semibold mb-2">
                  Examples
                </h3>
                <pre className="bg-black/40 p-4 rounded-lg text-sm whitespace-pre-wrap">
                  {question.examples}
                </pre>
              </section>

              <section>
                <h3 className="text-emerald-400 font-semibold mb-2">
                  Constraints
                </h3>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  {question.constraints}
                </pre>
              </section>

              <section>
                <h3 className="text-emerald-400 font-semibold mb-2">
                  Follow-up Expectation
                </h3>
                <p className="text-gray-300">
                  {question.followUp}
                </p>
              </section>
            </div>

            {/* editor */}
            <div className="bg-gray-900 rounded-xl overflow-hidden flex flex-col h-[520px]">
              <div className="flex items-center gap-2 p-3 border-b border-gray-800">
                <Code className="text-emerald-400" />
                <span className="font-semibold">Code Editor</span>
              </div>
              <div className="flex-1 overflow-auto">
                <CodeMirror
                  value={code}
                  theme={dracula}
                  extensions={[languageConfig[language].extension]}
                  onChange={setCode}
                />
              </div>
            </div>
          </div>

          {/* clarification */}
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-3">
            <p className="text-sky-400 font-semibold flex items-center gap-2">
              <MessageCircle /> Ask the interviewer
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 p-3 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="e.g. Are negative numbers allowed?"
                value={clarification}
                onChange={(e) => setClarification(e.target.value)}
              />
              <button
                onClick={askClarification}
                className="px-5 py-3 bg-sky-500 rounded-lg font-semibold"
              >
                Ask
              </button>
            </div>
            {clarificationReply && (
              <div className="bg-black/30 p-3 rounded-lg text-gray-300">
                <span className="text-emerald-400 font-semibold">
                  Interviewer:
                </span>{" "}
                {clarificationReply}
              </div>
            )}
          </div>

          {/* submit */}
          <div className="flex justify-center pt-4">
            <button
              onClick={submitSolution}
              className="flex items-center gap-3 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-lg font-bold shadow-lg"
            >
              <Play />
              Submit Solution
            </button>
          </div>

          {/* scorecard */}
          {scorecard && (
            <div className="bg-gray-900 p-6 rounded-xl space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle className="text-emerald-400" />
                Final Verdict: {scorecard.verdict}
              </h2>
              <pre className="bg-black/40 p-4 rounded text-sm">
                {JSON.stringify(scorecard.scores, null, 2)}
              </pre>
              <p className="text-gray-200">{feedback}</p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

