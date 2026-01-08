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
  Loader,
} from "lucide-react";

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

export default function InterviewCoach({ aiReady }) {
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

  useEffect(() => {
    if (!question || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [question, timeLeft]);

  useEffect(() => {
    setCode(languageConfig[language].template);
  }, [language]);

  const resetInterview = () => {
    setQuestion(null);
    setScorecard(null);
    setFeedback("");
    setClarification("");
    setClarificationReply("");
    setTimeLeft(45 * 60);
    setCode(languageConfig[language].template);
  };

  const generateQuestion = async () => {
    setLoading(true);
    resetInterview();

    const prompt = `
Generate a FAANG-style ${difficulty} coding interview problem.

Return ONLY JSON:
{
  "problem": "Clear problem statement",
  "examples": "Example 1:\nInput: ...\nOutput: ...",
  "constraints": "List of constraints",
  "followUp": "Expected follow-up question"
}
`;

    try {
      const res = await window.puter.ai.chat(prompt);
      const text = typeof res === "string" ? res : res.message?.content || res;
      const parsed = extractJSON(text);

      if (parsed) setQuestion(parsed);
      else setFeedback("❌ Failed to generate question. Please try again.");
    } catch (e) {
      setFeedback("❌ Error: " + e.message);
    }
    setLoading(false);
  };

  const askClarification = async () => {
    if (!clarification) return;
    setClarificationReply("Interviewer is thinking...");

    const prompt = `
You are a professional FAANG interviewer.
Answer the candidate's clarification question briefly and realistically.

Question: ${clarification}

Keep answer to 1-2 sentences.`;

    try {
      const res = await window.puter.ai.chat(prompt);
      setClarificationReply(
        typeof res === "string" ? res : res.message?.content || res
      );
    } catch (e) {
      setClarificationReply("Error: " + e.message);
    }
  };

  const submitSolution = async () => {
    setLoading(true);
    setFeedback("");

    const prompt = `
You are a FAANG interviewer evaluating a coding solution.

Language: ${language}
Problem: ${question.problem}

Candidate Solution:
${code}

Evaluate the solution and return ONLY JSON:
{
  "scores": {
    "correctness": 0-100,
    "efficiency": 0-100,
    "codeQuality": 0-100,
    "communication": 0-100,
    "problemSolving": 0-100
  },
  "verdict": "Strong Hire / Hire / Leaning Hire / Maybe / Leaning No Hire / No Hire",
  "feedback": "Detailed feedback"
}
`;

    try {
      const res = await window.puter.ai.chat(prompt);
      const text = typeof res === "string" ? res : res.message?.content || res;
      const parsed = extractJSON(text);

      if (parsed) {
        setScorecard(parsed);
        setFeedback(parsed.feedback);
      } else {
        setFeedback("❌ Evaluation failed. Please try again.");
      }
    } catch (e) {
      setFeedback("❌ Error: " + e.message);
    }
    setLoading(false);
  };

  if (!aiReady) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-400" />
        <p className="text-gray-400">Loading AI capabilities...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20">
      {!question ? (
        <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 p-8 rounded-2xl space-y-6 mt-10">
          <h2 className="text-3xl font-bold">Interview Coach</h2>
          <p className="text-gray-400">
            Practice FAANG-style coding interviews with real-time AI feedback.
          </p>

          <div>
            <label className="block mb-3 font-semibold text-gray-300">
              Programming Language
            </label>
            <select
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {Object.keys(languageConfig).map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-3 font-semibold text-gray-300">
              Difficulty Level
            </label>
            <select
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>

          <button
            disabled={!aiReady || loading}
            onClick={generateQuestion}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition"
          >
            {loading ? "Generating..." : "Start Interview"}
          </button>

          {feedback && (
            <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-lg text-red-400">
              {feedback}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center bg-gray-900 p-6 rounded-xl border border-gray-800">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg">
              <Timer className="w-5 h-5" />
              {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sky-400 font-semibold">{language}</span>
              <button
                onClick={resetInterview}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
            {/* Problem Panel */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl space-y-6">
              <section>
                <h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Problem
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {question.problem}
                </p>
              </section>

              <section>
                <h3 className="text-emerald-400 font-semibold mb-3">
                  Examples
                </h3>
                <pre className="bg-black/40 p-4 rounded-lg text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                  {question.examples}
                </pre>
              </section>

              <section>
                <h3 className="text-emerald-400 font-semibold mb-3">
                  Constraints
                </h3>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  {question.constraints}
                </pre>
              </section>

              <section>
                <h3 className="text-emerald-400 font-semibold mb-3">
                  Follow-up Expected
                </h3>
                <p className="text-gray-300">{question.followUp}</p>
              </section>
            </div>

            {/* Code Editor */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col h-[600px]">
              <div className="flex items-center gap-2 p-4 border-b border-gray-800 bg-gray-800">
                <Code className="text-emerald-400 w-5 h-5" />
                <span className="font-semibold">Code Editor</span>
              </div>
              <div className="flex-1 overflow-auto">
                <CodeMirror
                  value={code}
                  theme={dracula}
                  extensions={[languageConfig[language].extension]}
                  onChange={setCode}
                  height="100%"
                />
              </div>
            </div>
          </div>

          {/* Clarification Section */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl space-y-4">
            <p className="text-sky-400 font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Ask the Interviewer
            </p>
            <div className="flex gap-3">
              <input
                className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 text-white"
                placeholder="Ask any clarification question..."
                value={clarification}
                onChange={(e) => setClarification(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && askClarification()
                }
              />
              <button
                onClick={askClarification}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold transition"
              >
                Ask
              </button>
            </div>
            {clarificationReply && (
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <span className="text-emerald-400 font-semibold">
                  Interviewer:
                </span>
                <p className="text-gray-300 mt-2">{clarificationReply}</p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              onClick={submitSolution}
              disabled={loading}
              className="flex items-center gap-3 px-12 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-lg font-bold transition"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Submit Solution
                </>
              )}
            </button>
          </div>

          {/* Scorecard */}
          {scorecard && (
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <CheckCircle className="text-emerald-400 w-8 h-8" />
                Verdict: {scorecard.verdict}
              </h2>

              <div className="grid md:grid-cols-5 gap-4">
                {Object.entries(scorecard.scores).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-gray-800 p-4 rounded-lg text-center"
                  >
                    <div className="text-2xl font-bold text-emerald-400">
                      {value}
                    </div>
                    <div className="text-sm text-gray-400 capitalize mt-2">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="font-bold mb-3 text-lg">Detailed Feedback</h3>
                <p className="text-gray-300 leading-relaxed">{feedback}</p>
              </div>

              <button
                onClick={resetInterview}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold transition"
              >
                Try Another Problem
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
