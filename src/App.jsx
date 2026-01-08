import React, { useEffect, useState } from "react";
import {
  Code,
  Home,
  Menu,
  X,
  FileText,
  Users,
} from "lucide-react";
import InterviewCoach from "./components/InterviewCoach";
import ResumeAnalyzer from "./components/ResumeAnalyzer";
import ResumeRanker from "./components/ResumeRanker";
import LandingPage from "./components/LandingPage";

export default function App() {
  const [aiReady, setAiReady] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  /* ---------- Navigation Component ---------- */
  const Navigation = () => (
    <nav className="fixed top-0 left-0 right-0 bg-gray-950 border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Code className="w-8 h-8 text-emerald-400" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
            Interview Suite Pro
          </h1>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => setCurrentPage("home")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              currentPage === "home"
                ? "bg-emerald-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
            }`}
          >
            <Home className="w-5 h-5" />
            Home
          </button>
          <button
            onClick={() => setCurrentPage("interview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              currentPage === "interview"
                ? "bg-emerald-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
            }`}
          >
            <Code className="w-5 h-5" />
            Interview Coach
          </button>
          <button
            onClick={() => setCurrentPage("analyzer")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              currentPage === "analyzer"
                ? "bg-sky-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
            }`}
          >
            <FileText className="w-5 h-5" />
            Resume Analyzer
          </button>
          <button
            onClick={() => setCurrentPage("ranker")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              currentPage === "ranker"
                ? "bg-purple-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
            }`}
          >
            <Users className="w-5 h-5" />
            Resume Ranker
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900 p-4 space-y-2">
          <button
            onClick={() => {
              setCurrentPage("home");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-800 rounded-lg flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Home
          </button>
          <button
            onClick={() => {
              setCurrentPage("interview");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-800 rounded-lg flex items-center gap-2"
          >
            <Code className="w-5 h-5" />
            Interview Coach
          </button>
          <button
            onClick={() => {
              setCurrentPage("analyzer");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-800 rounded-lg flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Resume Analyzer
          </button>
          <button
            onClick={() => {
              setCurrentPage("ranker");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-800 rounded-lg flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            Resume Ranker
          </button>
        </div>
      )}
    </nav>
  );

  /* ---------- Page Routing ---------- */
  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <LandingPage onNavigate={setCurrentPage} />;
      case "interview":
        return <InterviewCoach aiReady={aiReady} />;
      case "analyzer":
        return <ResumeAnalyzer aiReady={aiReady} />;
      case "ranker":
        return <ResumeRanker aiReady={aiReady} />;
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <div className="pt-20">
        {renderPage()}
      </div>
    </div>
  );
}
