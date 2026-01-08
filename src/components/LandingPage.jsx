import React from "react";
import {
  Code,
  FileText,
  Users,
  Zap,
  Target,
  BarChart3,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function LandingPage({ onNavigate }) {
  const features = [
    {
      icon: <Code className="w-8 h-8" />,
      title: "Interview Coach",
      description:
        "Practice FAANG-style coding interviews with real-time AI feedback, problem explanations, and performance scoring.",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Resume Analyzer",
      description:
        "Upload your resume (PDF, image, or text), provide a job description, and get AI-powered analysis including score, strengths, weaknesses, and improvement suggestions.",
      color: "from-sky-500 to-sky-600",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Resume Ranker",
      description:
        "HR professionals can upload multiple resumes, rank candidates automatically, and send interview invitations via email.",
      color: "from-purple-500 to-purple-600",
    },
  ];

  const benefits = [
    { icon: <Zap className="w-6 h-6" />, text: "Instant AI-powered analysis" },
    {
      icon: <Target className="w-6 h-6" />,
      text: "Real-time performance metrics",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      text: "Detailed insights and recommendations",
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      text: "Professional-grade evaluation",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 px-6">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto pt-20 pb-20 text-center">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400 bg-clip-text text-transparent">
          Interview Suite Pro
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
          Master coding interviews, analyze resumes, and find the best talent with
          AI-powered insights. One platform for all your interview and hiring
          needs.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <button
            onClick={() => onNavigate("interview")}
            className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold text-lg transition transform hover:scale-105"
          >
            <Code className="w-5 h-5" />
            Start Interview Coach
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate("analyzer")}
            className="flex items-center gap-2 px-8 py-4 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-lg transition transform hover:scale-105"
          >
            <FileText className="w-5 h-5" />
            Analyze Resume
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate("ranker")}
            className="flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold text-lg transition transform hover:scale-105"
          >
            <Users className="w-5 h-5" />
            Rank Candidates
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto py-20">
        <h2 className="text-4xl font-bold text-center mb-16">
          Powerful Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition transform hover:-translate-y-2"
            >
              <div className={`bg-gradient-to-r ${feature.color} p-4 rounded-lg w-fit mb-6 group-hover:scale-110 transition`}>
                <div className="text-white">{feature.icon}</div>
              </div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Why Choose Us?</h2>
        <div className="grid md:grid-cols-2 gap-6 bg-gray-900 border border-gray-800 rounded-2xl p-12">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="text-emerald-400 flex-shrink-0">
                {benefit.icon}
              </div>
              <span className="text-lg text-gray-300">{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto py-20 text-center">
        <h2 className="text-3xl font-bold mb-8">
          Ready to Transform Your Interview Preparation?
        </h2>
        <p className="text-xl text-gray-400 mb-8">
          Choose your path and start improving today with AI-powered insights.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={() => onNavigate("interview")}
            className="group bg-emerald-600 hover:bg-emerald-500 rounded-xl p-8 transition transform hover:scale-105"
          >
            <Code className="w-8 h-8 mx-auto mb-4 group-hover:scale-125 transition" />
            <h3 className="font-bold text-lg mb-2">Interview Coach</h3>
            <p className="text-sm text-emerald-100 mb-4">
              Practice coding interviews
            </p>
            <span className="text-sm font-semibold flex items-center justify-center gap-2">
              Start Now <ArrowRight className="w-4 h-4" />
            </span>
          </button>
          <button
            onClick={() => onNavigate("analyzer")}
            className="group bg-sky-600 hover:bg-sky-500 rounded-xl p-8 transition transform hover:scale-105"
          >
            <FileText className="w-8 h-8 mx-auto mb-4 group-hover:scale-125 transition" />
            <h3 className="font-bold text-lg mb-2">Resume Analyzer</h3>
            <p className="text-sm text-sky-100 mb-4">
              Get resume insights
            </p>
            <span className="text-sm font-semibold flex items-center justify-center gap-2">
              Analyze <ArrowRight className="w-4 h-4" />
            </span>
          </button>
          <button
            onClick={() => onNavigate("ranker")}
            className="group bg-purple-600 hover:bg-purple-500 rounded-xl p-8 transition transform hover:scale-105"
          >
            <Users className="w-8 h-8 mx-auto mb-4 group-hover:scale-125 transition" />
            <h3 className="font-bold text-lg mb-2">Resume Ranker</h3>
            <p className="text-sm text-purple-100 mb-4">
              Hire the best candidates
            </p>
            <span className="text-sm font-semibold flex items-center justify-center gap-2">
              Rank <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 mt-20 py-10 text-center text-gray-400">
        <p>
          Powered by Puter AI • Building the future of interview preparation
        </p>
      </div>
    </div>
  );
}
