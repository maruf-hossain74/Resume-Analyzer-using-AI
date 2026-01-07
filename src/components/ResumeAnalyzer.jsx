import React, { useState } from "react";
import {
  Upload,
  FileText,
  Loader,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Brain,
  ArrowLeft,
} from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import * as Tesseract from "tesseract.js";
import { analyzeResume } from "../services/resumeAnalyzerService";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function ResumeAnalyzer({ onBack }) {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [extracting, setExtracting] = useState(false);

  const extractPdfText = async (file) => {
    try {
      setExtracting(true);
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
          console.warn(`Could not extract page ${i}:`, pageError);
        }
      }

      if (!text.trim()) {
        alert(
          "No text found in PDF. The PDF may be scanned. Please try uploading an image or pasting text instead."
        );
        setExtracting(false);
        return;
      }

      setResumeText(text);
      setExtracting(false);
    } catch (error) {
      console.error("Error extracting PDF:", error);
      alert(
        `Failed to extract PDF: ${error.message || "Unknown error"}. Try uploading an image instead.`
      );
      setExtracting(false);
    }
  };

  const extractImageText = async (file) => {
    try {
      setExtracting(true);
      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`);
          }
        },
      });
      
      if (!result.data.text.trim()) {
        alert("No text found in image. Please ensure the image is clear and readable.");
        setExtracting(false);
        return;
      }
      
      setResumeText(result.data.text);
      setExtracting(false);
    } catch (error) {
      console.error("Error extracting image text:", error);
      alert(
        `Failed to extract text from image: ${error.message || "Unknown error"}. Please try another image or paste text directly.`
      );
      setExtracting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB. Please upload a smaller file.");
      return;
    }

    const fileType = file.type;
    
    if (fileType === "application/pdf") {
      await extractPdfText(file);
    } else if (fileType.startsWith("image/")) {
      await extractImageText(file);
    } else {
      alert(
        "Please upload a PDF or image file (PDF, JPG, PNG, GIF, BMP, WebP)"
      );
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      alert("Please provide resume content");
      return;
    }
    if (!jobDescription.trim()) {
      alert("Please provide a job description");
      return;
    }

    setLoading(true);
    try {
      // Since we're using local analysis without backend, we'll perform analysis here
      const result = performLocalAnalysis(resumeText, jobDescription);
      setAnalysis(result);
    } catch (error) {
      console.error("Error analyzing resume:", error);
      alert("Error analyzing resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const performLocalAnalysis = (resume, jobDesc) => {
    const resumeLower = resume.toLowerCase();
    const jobDescLower = jobDesc.toLowerCase();

    // Semantic analysis instead of simple keyword matching
    const semanticAnalysis = performSemanticAnalysis(resume, jobDesc);
    const matchPercentage = semanticAnalysis.overallMatch;
    const semanticMatches = semanticAnalysis.matches;

    // ATS Score calculation
    const atsScore = calculateATSScore(resume);

    // Extract skills from resume and job description
    const resumeSkills = extractSkills(resume);
    const jobSkills = extractSkills(jobDesc);
    const skillGap = identifySkillGaps(resumeSkills, jobSkills);

    // Extract suggestions
    const suggestions = generateSuggestions(
      resume,
      jobDesc,
      semanticMatches,
      semanticAnalysis.unmatchedConcepts
    );

    // Generate gap analysis and learning paths
    const gapAnalysis = generateGapAnalysis(skillGap, jobDesc);
    const learningPaths = generateLearningPaths(skillGap.missingSkills);
    const projectSuggestion = generateProjectSuggestion(jobDesc, skillGap);

    return {
      matchPercentage,
      atsScore,
      matchedKeywords: semanticMatches.map(m => m.concept),
      missingKeywords: semanticAnalysis.unmatchedConcepts,
      suggestions,
      strengths: generateStrengths(resume, jobDesc),
      improvementAreas: generateImprovementAreas(resume, jobDesc),
      skills: {
        present: resumeSkills,
        required: jobSkills,
        gap: skillGap,
      },
      gapAnalysis,
      learningPaths,
      projectSuggestion,
      semanticAnalysis,
    };
  };

  // Semantic Analysis System
  const semanticThesaurus = {
    "api development": ["rest", "restful", "graphql", "rest api", "api", "endpoint", "web service", "http", "json", "xml", "swagger", "openapi", "api design", "api gateway", "serverless", "lambda"],
    "frontend development": ["react", "vue", "angular", "next", "gatsby", "svelte", "nuxt", "ui", "ux", "user interface", "web design", "html", "css", "responsive design", "user experience", "web components", "jsx", "tsx", "tailwind", "bootstrap", "material ui"],
    "backend development": ["node.js", "nodejs", "express", "django", "flask", "fastapi", "java", "spring", "laravel", "server", "backend", "api server", "business logic", "data processing", "postgresql", "mysql", "database"],
    "frontend frameworks": ["react", "react.js", "vue", "vue.js", "angular", "angularjs", "next.js", "nextjs", "gatsby", "svelte", "nuxt", "nuxt.js", "ember", "backbone"],
    "backend frameworks": ["express", "express.js", "django", "django rest", "flask", "fastapi", "spring", "spring boot", "laravel", "rails", "ruby on rails", "asp.net", "asp.net core"],
    "mobile development": ["react native", "flutter", "ios", "android", "swift", "kotlin", "xamarin", "mobile app", "cross-platform", "native app", "hybrid app", "app development"],
    "cloud computing": ["aws", "azure", "gcp", "google cloud", "cloud", "ec2", "lambda", "s3", "rds", "cloudformation", "cloud infrastructure", "serverless", "cloud services", "ibm cloud", "oracle cloud"],
    "containerization": ["docker", "container", "dockerfile", "registry", "orchestration", "compose", "container registry", "image registry", "containerized application"],
    "kubernetes": ["k8s", "pods", "helm", "deployment", "ingress", "service", "cluster", "orchestration", "container orchestration", "kube", "kubectl"],
    "devops": ["ci/cd", "continuous integration", "continuous deployment", "jenkins", "gitlab ci", "github actions", "pipeline", "automation", "infrastructure", "infrastructure as code", "iac", "terraform", "ansible", "deployment", "monitoring"],
    "database design": ["sql", "nosql", "mongodb", "postgresql", "postgres", "mysql", "database", "schema", "normalization", "indexes", "query optimization", "database design", "relational", "document database", "dynamo db"],
    "testing": ["unit test", "integration test", "jest", "mocha", "pytest", "testing", "qunit", "cucumber", "selenium", "test automation", "tdd", "bdd", "e2e test", "end to end testing", "test driven development"],
    "version control": ["git", "github", "gitlab", "bitbucket", "svn", "version control", "scm", "commit", "branch", "merge", "git flow", "pull request", "merge request"],
    "agile methodology": ["agile", "scrum", "kanban", "sprint", "jira", "confluence", "waterfall", "lean", "xp", "extreme programming", "scrumban", "agile development"],
    "machine learning": ["ml", "machine learning", "deep learning", "neural network", "tensorflow", "pytorch", "scikit-learn", "keras", "ai", "artificial intelligence", "nlp", "computer vision", "model", "training", "prediction"],
    "data analysis": ["data", "analytics", "pandas", "numpy", "matplotlib", "plotly", "excel", "pivot table", "statistical analysis", "data visualization", "data science", "analytics"],
    "security": ["authentication", "authorization", "encryption", "ssl", "https", "jwt", "oauth", "security", "firewall", "intrusion detection", "vulnerability", "penetration testing", "security scanning", "secure coding"],
    "performance optimization": ["optimization", "performance", "caching", "cdn", "lazy loading", "code splitting", "minification", "compression", "performance monitoring", "profiling", "optimization technique"],
    "microservices": ["microservices", "service", "distributed", "service mesh", "istio", "consul", "architecture", "service architecture", "microservice architecture"],
    "system design": ["architecture", "system design", "design pattern", "scalability", "availability", "distributed system", "load balancing", "caching", "partitioning", "architectural pattern"],
    "documentation": ["documentation", "readme", "javadoc", "swagger", "openapi", "technical writing", "api documentation", "wiki", "confluence", "docs"],
    "communication": ["communication", "presentation", "documentation", "technical writing", "speaking", "reporting", "stakeholder management", "collaboration"],
    "leadership": ["leadership", "management", "team lead", "mentor", "coaching", "delegation", "supervision", "team management", "people management"],
    "problem solving": ["problem solving", "analytical", "debugging", "troubleshooting", "critical thinking", "logic", "analytical thinking"],
    "collaboration": ["collaboration", "teamwork", "coordination", "partnership", "cooperation", "cross-functional", "team collaboration"],
    "web technologies": ["html", "css", "javascript", "dom", "web api", "web socket", "rest", "http", "https", "web standards"],
    "build tools": ["webpack", "vite", "rollup", "parcel", "gulp", "grunt", "build", "bundler", "module bundler", "build tool"],
    "package managers": ["npm", "yarn", "pnpm", "pip", "maven", "gradle", "package manager", "dependency management"],
    "cli development": ["cli", "command line", "console", "terminal", "bash", "shell script", "command-line tool", "cli tool"],
    "rest api": ["rest", "restful", "rest api", "http method", "get", "post", "put", "delete", "crud", "endpoint", "resource"],
    "graphql": ["graphql", "apollo", "query", "mutation", "subscription", "schema", "schema design", "query language"],
    "message queue": ["message queue", "kafka", "rabbitmq", "redis", "queue", "pub/sub", "publish subscribe", "asynchronous messaging"],
    "monitoring": ["monitoring", "logging", "prometheus", "grafana", "elk stack", "datadog", "observability", "metrics", "alerting"],
    "ci-cd pipeline": ["ci/cd", "jenkins", "gitlab", "github", "circle ci", "travis", "pipeline", "continuous integration", "continuous deployment", "automation"],
  };

  const performSemanticAnalysis = (resumeText, jobDescText) => {
    const resume = resumeText.toLowerCase();
    const jobDesc = jobDescText.toLowerCase();

    // Tokenize into meaningful chunks
    const jobConcepts = extractConceptsFromText(jobDesc);
    const resumeConcepts = extractConceptsFromText(resume);

    const matches = [];
    const unmatchedConcepts = [];
    let totalScore = 0;

    jobConcepts.forEach((jobConcept) => {
      const conceptFamily = findConceptFamily(jobConcept);
      const matchedTerms = [];
      let bestScore = 0;

      // Check for exact and semantic matches
      if (resume.includes(jobConcept)) {
        bestScore = 100;
        matchedTerms.push(jobConcept);
      } else if (conceptFamily && conceptFamily.relatedTerms) {
        // Check for related terms/synonyms
        conceptFamily.relatedTerms.forEach((term) => {
          if (resume.includes(term)) {
            bestScore = Math.max(bestScore, 80);
            matchedTerms.push(term);
          }
        });
      }

      // Check for partial matches and semantic closeness
      if (bestScore === 0) {
        const partialMatches = resumeConcepts.filter(
          (concept) => calculateSemanticSimilarity(jobConcept, concept) > 0.6
        );
        if (partialMatches.length > 0) {
          bestScore = 60;
          matchedTerms.push(...partialMatches);
        }
      }

      if (bestScore > 0) {
        matches.push({
          concept: jobConcept,
          score: bestScore,
          matchedIn: matchedTerms,
          category: conceptFamily?.category || "general",
        });
        totalScore += bestScore;
      } else {
        unmatchedConcepts.push(jobConcept);
      }
    });

    const overallMatch = Math.round((totalScore / (jobConcepts.length * 100)) * 100);

    return {
      overallMatch: Math.min(overallMatch, 100),
      matches,
      unmatchedConcepts,
      jobConcepts,
      resumeConcepts,
      totalJobConcepts: jobConcepts.length,
      matchedConceptCount: matches.length,
    };
  };

  const extractConceptsFromText = (text) => {
    const concepts = new Set();

    // Extract concepts from thesaurus keys and their related terms
    Object.entries(semanticThesaurus).forEach(([key, relatedTerms]) => {
      if (text.includes(key)) {
        concepts.add(key);
      }
      relatedTerms.forEach((term) => {
        if (text.includes(term)) {
          concepts.add(key);
        }
      });
    });

    // Also add extracted individual technical terms
    const technicalTerms = [
      "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php", "r", "scala",
      "react", "vue", "angular", "svelte", "nextjs", "nuxtjs", "gatsby", "ember",
      "nodejs", "express", "django", "flask", "fastapi", "spring", "laravel", "rails",
      "sql", "mongodb", "postgresql", "mysql", "firebase", "dynamodb", "cassandra", "oracle",
      "aws", "azure", "gcp", "heroku", "vercel", "netlify", "digitalocean",
      "docker", "kubernetes", "jenkins", "gitlab", "github", "circleci", "travis",
      "git", "webpack", "vite", "rollup", "parcel", "babel", "npm", "yarn", "pnpm", "maven", "gradle",
      "html", "css", "sass", "less", "bootstrap", "tailwind", "material ui", "ant design",
      "graphql", "rest", "soap", "grpc", "websocket",
      "jwt", "oauth", "oauth2", "saml", "ldap", "kerberos",
      "redis", "rabbitmq", "kafka", "elasticsearch", "memcached", "apache", "nginx",
      "junit", "pytest", "mocha", "jest", "rspec", "cucumber", "selenium",
      "agile", "scrum", "kanban", "jira", "confluence", "asana", "trello",
      "linux", "windows", "macos", "unix", "centos", "ubuntu", "debian",
      "terraform", "ansible", "puppet", "chef", "vagrant",
      "prometheus", "grafana", "datadog", "newrelic", "elk", "splunk",
      "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy",
      "microservices", "rest api", "graphql", "websocket", "grpc",
      "database", "nosql", "relational", "document", "time-series",
      "authentication", "authorization", "encryption", "ssl", "tls",
      "testing", "unit test", "integration test", "e2e test", "tdd", "bdd",
      "devops", "ci/cd", "continuous integration", "continuous deployment",
      "cloud", "serverless", "iaas", "paas", "saas",
      "architecture", "design pattern", "microservices", "monolith",
      "performance", "scalability", "availability", "reliability",
      "leadership", "management", "mentoring", "coaching",
      "agile", "waterfall", "scrum", "kanban",
      "communication", "documentation", "presentation", "writing",
      "problem solving", "debugging", "optimization",
    ];

    technicalTerms.forEach((term) => {
      if (text.includes(term)) {
        concepts.add(term);
      }
    });

    return Array.from(concepts);
  };

  const findConceptFamily = (concept) => {
    for (const [key, relatedTerms] of Object.entries(semanticThesaurus)) {
      if (key === concept || relatedTerms.includes(concept)) {
        return {
          category: key,
          relatedTerms,
        };
      }
    }
    return null;
  };

  const calculateSemanticSimilarity = (term1, term2) => {
    // Levenshtein distance based similarity
    const maxLen = Math.max(term1.length, term2.length);
    if (maxLen === 0) return 1.0;

    const distance = levenshteinDistance(term1, term2);
    return 1 - distance / maxLen;
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

  const extractSkills = (text) => {
    const textLower = text.toLowerCase();
    const technicalSkills = [
      "javascript",
      "typescript",
      "python",
      "java",
      "c++",
      "react",
      "vue",
      "angular",
      "node.js",
      "express",
      "django",
      "flask",
      "sql",
      "mongodb",
      "aws",
      "azure",
      "docker",
      "kubernetes",
      "git",
      "rest api",
      "graphql",
      "html",
      "css",
      "tailwind",
      "bootstrap",
      "webpack",
      "vite",
      "jest",
      "testing",
      "ci/cd",
      "jenkins",
      "github actions",
      "terraform",
      "ansible",
      "microservices",
      "agile",
      "scrum",
      "linux",
      "windows",
      "mac",
      "mac os",
      "devops",
      "cloud",
      "api",
      "web development",
      "full stack",
      "frontend",
      "backend",
      "database",
      "machine learning",
      "artificial intelligence",
      "data analysis",
      "data science",
      "deep learning",
      "neural network",
      "tensorflow",
      "pytorch",
      "pandas",
      "numpy",
    ];

    const softSkills = [
      "communication",
      "leadership",
      "problem solving",
      "team work",
      "collaboration",
      "project management",
      "critical thinking",
      "time management",
      "attention to detail",
      "creativity",
      "adaptability",
      "work ethic",
      "accountability",
    ];

    const foundSkills = {
      technical: [],
      soft: [],
      other: [],
    };

    technicalSkills.forEach((skill) => {
      if (textLower.includes(skill)) {
        foundSkills.technical.push(skill);
      }
    });

    softSkills.forEach((skill) => {
      if (textLower.includes(skill)) {
        foundSkills.soft.push(skill);
      }
    });

    return foundSkills;
  };

  const identifySkillGaps = (resumeSkills, jobSkills) => {
    const allResumeSkills = [
      ...resumeSkills.technical,
      ...resumeSkills.soft,
    ];
    const allJobSkills = [...jobSkills.technical, ...jobSkills.soft];

    const missingSkills = allJobSkills.filter(
      (skill) => !allResumeSkills.includes(skill)
    );

    const matchedSkills = jobSkills.technical.filter((skill) =>
      resumeSkills.technical.includes(skill)
    );

    return {
      missingSkills,
      matchedSkills,
      matchPercentage: Math.round(
        (matchedSkills.length / jobSkills.technical.length) * 100
      ),
    };
  };

  const generateGapAnalysis = (skillGap, jobDesc) => {
    const criticalSkills = skillGap.missingSkills.slice(0, 3);
    const analysis = [];

    if (criticalSkills.length > 0) {
      analysis.push({
        priority: "Critical",
        skills: criticalSkills,
        description: `The role requires advanced proficiency in ${criticalSkills.join(", ")}. These are core competencies that differentiate competitive candidates. Prioritize building expertise in these areas immediately.`,
      });
    }

    const remainingSkills = skillGap.missingSkills.slice(3, 6);
    if (remainingSkills.length > 0) {
      analysis.push({
        priority: "High",
        skills: remainingSkills,
        description: `Additional skills including ${remainingSkills.join(", ")} would significantly enhance your candidacy and make you a more competitive applicant.`,
      });
    }

    return analysis;
  };

  const generateLearningPaths = (missingSkills) => {
    const skillLearningMap = {
      javascript: {
        resources: ["freeCodeCamp", "MDN Web Docs", "JavaScript.info"],
        timeframe: "4-8 weeks",
        platform: ["Udemy", "Coursera"],
      },
      typescript: {
        resources: ["Official TypeScript Handbook", "freeCodeCamp", "Udemy"],
        timeframe: "2-4 weeks",
        platform: ["TypeScript.org", "Udemy"],
      },
      react: {
        resources: ["Official React Docs", "freeCodeCamp", "Scrimba"],
        timeframe: "6-10 weeks",
        platform: ["React.dev", "Udemy", "Frontend Masters"],
      },
      "python": {
        resources: ["Python.org", "Real Python", "freeCodeCamp"],
        timeframe: "4-8 weeks",
        platform: ["Udemy", "Coursera"],
      },
      "aws": {
        resources: ["AWS Training Center", "A Cloud Guru", "Linux Academy"],
        timeframe: "8-12 weeks",
        platform: ["AWS Academy", "Udemy"],
      },
      "docker": {
        resources: ["Docker Docs", "Play with Docker", "freeCodeCamp"],
        timeframe: "2-4 weeks",
        platform: ["Docker.com", "Udemy"],
      },
      "kubernetes": {
        resources: ["Official Kubernetes Docs", "Linux Academy", "freeCodeCamp"],
        timeframe: "6-10 weeks",
        platform: ["Linux Academy", "Udemy"],
      },
      "sql": {
        resources: ["Mode Analytics SQL", "LeetCode Database", "HackerRank"],
        timeframe: "3-6 weeks",
        platform: ["Mode Analytics", "Udemy"],
      },
    };

    const paths = [];

    missingSkills.slice(0, 3).forEach((skill) => {
      const skillLower = skill.toLowerCase();
      const resourceData = skillLearningMap[skillLower] || {
        resources: ["Official Documentation", "Udemy", "Coursera"],
        timeframe: "4-8 weeks",
        platform: ["Udemy", "Coursera"],
      };

      paths.push({
        skill,
        resources: resourceData.resources,
        timeframe: resourceData.timeframe,
        platform: resourceData.platform,
      });
    });

    return paths;
  };

  const generateProjectSuggestion = (jobDesc, skillGap) => {
    // Identify technology stack from job description
    const techStack = [];
    const skillPatterns = {
      "React": ["react", "component", "jsx", "hooks"],
      "Node.js": ["nodejs", "node.js", "express", "backend"],
      "Python": ["python", "django", "flask"],
      "AWS": ["aws", "s3", "lambda", "cloud"],
      "Docker": ["docker", "container", "kubernetes"],
    };

    Object.entries(skillPatterns).forEach(([tech, patterns]) => {
      if (patterns.some((pattern) => jobDesc.toLowerCase().includes(pattern))) {
        techStack.push(tech);
      }
    });

    const projectType = jobDesc.toLowerCase().includes("ecommerce")
      ? "E-Commerce Platform"
      : jobDesc.toLowerCase().includes("social")
        ? "Social Media Application"
        : jobDesc.toLowerCase().includes("saas")
          ? "SaaS Application"
          : jobDesc.toLowerCase().includes("analytics")
            ? "Analytics Dashboard"
            : "Full-Stack Application";

    return {
      title: `Build a ${projectType}`,
      description: `Create a comprehensive portfolio project that demonstrates proficiency in the required tech stack: ${techStack.length > 0 ? techStack.join(", ") : "modern web technologies"}.`,
      features: [
        "User authentication and authorization",
        "Real-time data processing",
        "Responsive UI/UX design",
        "RESTful API design",
        "Database design and optimization",
        "Error handling and logging",
        "Unit and integration testing",
        "CI/CD pipeline implementation",
        "Cloud deployment (AWS/Azure/GCP)",
        "Performance optimization",
      ],
      techStack: techStack.length > 0 ? techStack : ["React", "Node.js", "MongoDB"],
      estimatedDuration: "8-12 weeks",
      portfolio: true,
      githubPublic: true,
      demoUrl: true,
    };
  };

  const calculateATSScore = (resume) => {
    let score = 50; // Base score

    // Check for professional formatting
    if (resume.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/)) score += 10;

    // Check for contact info
    if (resume.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/)) score += 5;
    if (resume.match(/[\w\.-]+@[\w\.-]+\.\w+/)) score += 5;

    // Check for sections
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

    // Check for bullet points
    if ((resume.match(/[•\-\*]/g) || []).length > 5) score += 10;

    // Check for action verbs
    const actionVerbs = [
      "developed",
      "managed",
      "led",
      "created",
      "implemented",
      "designed",
      "improved",
      "achieved",
    ];
    if (actionVerbs.some((verb) => resume.toLowerCase().includes(verb)))
      score += 5;

    return Math.min(score, 100);
  };

  const generateSuggestions = (resume, jobDesc, semanticMatches, unmatchedConcepts) => {
    const suggestions = [];
    const resumeLower = resume.toLowerCase();
    const jobDescLower = jobDesc.toLowerCase();

    // Semantic Analysis Based Suggestions
    if (unmatchedConcepts && unmatchedConcepts.length > 0) {
      const criticalMissing = unmatchedConcepts.slice(0, 3);
      const conceptFamilies = criticalMissing.map(concept => {
        const family = findConceptFamily(concept);
        return family ? family.category : concept;
      }).join(", ");
      
      suggestions.push({
        category: "Semantic Gap - Technical Alignment",
        text: `Your resume lacks semantic alignment in critical areas: ${conceptFamilies}. Incorporate related keywords, demonstrate experience with similar technologies, and highlight relevant project work to improve semantic matching with this role.`,
      });
    }

    // Match Coverage Feedback
    const totalConcepts = (semanticMatches || []).length + (unmatchedConcepts || []).length;
    if (totalConcepts > 0) {
      const matchRate = ((semanticMatches || []).length / totalConcepts) * 100;
      if (matchRate < 70) {
        suggestions.push({
          category: "Job Requirements Alignment",
          text: `Your resume's semantic coverage is ${Math.round(matchRate)}%. Increase alignment by: (1) Adding missing technology stacks, (2) Emphasizing relevant methodologies, (3) Highlighting similar projects or experiences that demonstrate capability in required domains.`,
        });
      }
    }

    // Keyword Optimization for ATS
    if (!resumeLower.match(/\d+\s*(years|yrs)/i)) {
      suggestions.push({
        category: "Experience Clarity",
        text: "Explicitly state years of professional experience for each role. Include both duration in years and specific employment dates to demonstrate career progression.",
      });
    }

    // Quantifiable Achievements
    if (
      !resumeLower.match(/[0-9]{1,3}%|[0-9]+(\.[0-9]+)?x\s+(increase|growth|improvement)/i)
    ) {
      suggestions.push({
        category: "Quantifiable Achievements",
        text: "Enhance impact statements with measurable results (e.g., 'increased revenue by 25%', 'reduced processing time by 40%'). Quantified accomplishments demonstrate concrete value delivery and are significantly more compelling to recruiters.",
      });
    }

    // Formatting & Readability
    if (!(resumeLower.match(/[•\-\*]/g) || []).length > 5) {
      suggestions.push({
        category: "Formatting & Readability",
        text: "Use consistent bullet-point formatting throughout your professional experience section. This improves ATS compatibility and makes content more scannable for human reviewers.",
      });
    }

    // Content Structure Recommendations
    const sections = [
      "professional summary",
      "core competencies",
      "professional certifications",
      "professional affiliations",
    ];
    const missingSections = sections.filter(
      (section) => !resumeLower.includes(section)
    );
    if (missingSections.length > 0) {
      suggestions.push({
        category: "Content Structure",
        text: `Consider adding a ${missingSections.slice(0, 2).join(" or ")} section to provide additional context and strengthen your candidacy.`,
      });
    }

    // Industry-Specific Recommendations
    if (jobDescLower.includes("leadership") || jobDescLower.includes("manage") || jobDescLower.includes("lead")) {
      if (!resumeLower.match(/lead|manage|supervise|directed|team/i)) {
        suggestions.push({
          category: "Leadership Visibility",
          text: "The role emphasizes leadership responsibilities. Highlight team management experiences, project leadership, mentoring activities, and cross-functional collaboration to demonstrate capability for leadership requirements.",
        });
      }
    }

    // Technical Depth
    if (jobDescLower.match(/senior|architect|technical lead|principal/i)) {
      if (!resumeLower.match(/architecture|design|pattern|framework|scale|optimize|mentor/i)) {
        suggestions.push({
          category: "Technical Depth Enhancement",
          text: "Senior-level roles require demonstrating deep technical expertise. Add content about system architecture, technical design decisions, performance optimizations, and technical mentorship to establish seniority.",
        });
      }
    }

    return suggestions;
  };

  const generateStrengths = (resume, jobDesc) => {
    const strengths = [];

    if (resume.match(/phd|master|m\.s\.|m\.a\.|b\.s\.|b\.a\.|certification in|certified|degree/i)) {
      strengths.push("Comprehensive educational qualifications demonstrating professional development and expertise");
    }

    if (resume.match(/lead|manager|director|supervisor|head of|chief|vice president|president/i)) {
      strengths.push("Leadership and management experience showcasing progressive career growth and team management capabilities");
    }

    if (resume.match(/certificate|certified|certification|credential|licensed|accredited/i)) {
      strengths.push("Professional certifications and credentials enhancing domain expertise and industry credibility");
    }

    if ((resume.match(/\d+\+?\s+(years?|months?)/gi) || []).length > 2) {
      strengths.push("Clear professional timeline demonstrating sustained career trajectory and experience depth");
    }

    if (resume.match(/[0-9]{1,3}%|[0-9]+x|improved|increased|optimized|streamlined|enhanced|accelerated/i)) {
      strengths.push("Strong emphasis on measurable impact and quantified business outcomes");
    }

    if (resume.match(/\b(skills|proficiencies|expertise in)\b/i)) {
      strengths.push("Well-defined technical skills and competencies clearly articulated");
    }

    return strengths.length > 0
      ? strengths
      : ["Resume demonstrates relevant professional experience and qualifications"];
  };

  const generateImprovementAreas = (resume, jobDesc) => {
    const areas = [];

    if (!resume.match(/\d+\+?\s+(years?|yrs)/i)) {
      areas.push("Career timeline lacks specificity: Clearly indicate the duration of experience for each position to help recruiters assess your expertise level.");
    }

    if ((resume.match(/[•\-\*]/g) || []).length < 8) {
      areas.push("Insufficient use of bullet points: Enhance visual hierarchy and scannability by using consistent bullet-point formatting throughout your experience section.");
    }

    if (!resume.match(/[\w\.-]+@[\w\.-]+\.\w+/)) {
      areas.push("Contact information incomplete: Include a professional email address prominently in the header for easy recruiter outreach.");
    }

    if (resume.split("\n").length < 15) {
      areas.push("Content depth is insufficient: Expand your professional experience descriptions with more detail about accomplishments, responsibilities, and impact.");
    }

    if (!resume.match(/phone|\(\d{3}\)|\d{3}[-.]?\d{3}[-.]?\d{4}/i)) {
      areas.push("Phone number missing: Include your phone number in the contact section for comprehensive recruiter accessibility.");
    }

    return areas;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-3 rounded-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Resume Analyzer</h1>
                <p className="text-slate-400 text-sm mt-1">Professional Resume Optimization & ATS Compatibility</p>
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

        <p className="text-slate-300 text-center mb-10 text-sm leading-relaxed max-w-2xl mx-auto">
          Gain comprehensive insights into your resume's effectiveness. Receive actionable recommendations to increase ATS compatibility, 
          improve keyword alignment with job descriptions, and enhance overall candidacy.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Resume Input */}
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-400" />
                Your Resume
              </h2>
              <p className="text-slate-400 text-sm mb-6">Upload or paste your resume content</p>

              <div className="flex gap-2 mb-6 bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all text-sm ${
                    activeTab === "upload"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setActiveTab("paste")}
                  className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all text-sm ${
                    activeTab === "paste"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Paste Text
                </button>
              </div>

              {activeTab === "upload" ? (
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center hover:border-blue-500 hover:bg-slate-700/30 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-input"
                    disabled={extracting}
                  />
                  <label htmlFor="file-input" className="cursor-pointer block">
                    {extracting ? (
                      <>
                        <Loader className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
                        <p className="text-white font-semibold mb-2 text-lg">
                          Extracting text...
                        </p>
                        <p className="text-slate-400 text-sm">
                          Processing your file. This may take a moment for large files.
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                        <p className="text-white font-semibold mb-2 text-lg">
                          Upload PDF or Image
                        </p>
                        <p className="text-slate-400 text-sm mb-3">
                          Drag and drop or click to select
                        </p>
                        <p className="text-slate-500 text-xs">
                          Supported formats: PDF, JPG, PNG, GIF, BMP, WebP (Max 10MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your complete resume text here..."
                  className="w-full h-72 bg-slate-700 text-white p-5 rounded-xl border border-slate-600 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm leading-relaxed"
                />
              )}
            </div>

            {/* Job Description Input */}
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-400" />
                Target Job Description
              </h2>
              <p className="text-slate-400 text-sm mb-6">Paste the complete job description you're applying for</p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here..."
                className="w-full h-72 bg-slate-700 text-white p-5 rounded-xl border border-slate-600 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm leading-relaxed"
              />
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || extracting}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-lg"
            >
              {loading ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <TrendingUp className="w-6 h-6" />
                  Analyze & Get Recommendations
                </>
              )}
            </button>
          </div>

          {/* Analysis Results */}
          <div className="space-y-8">
            {analysis ? (
              <>
                {/* Score Cards */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600 shadow-xl">
                  <h3 className="text-2xl font-bold text-white mb-8">Assessment Scores</h3>

                  {/* Match Percentage */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-slate-400 font-medium">Job Description Match</span>
                        <p className="text-xs text-slate-500 mt-1">Keyword alignment with target role</p>
                      </div>
                      <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        {analysis.matchPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all shadow-lg shadow-blue-500/50"
                        style={{ width: `${analysis.matchPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* ATS Score */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-slate-400 font-medium">ATS Compatibility Score</span>
                        <p className="text-xs text-slate-500 mt-1">Formatting & system readability</p>
                      </div>
                      <span className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                        {analysis.atsScore}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all shadow-lg shadow-green-500/50"
                        style={{ width: `${analysis.atsScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Semantic Analysis Details */}
                  {analysis.semanticAnalysis && (
                    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-blue-600/30 shadow-lg">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <Brain className="w-6 h-6 text-blue-400" />
                        Semantic Concept Matching
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-slate-400 font-medium">Total Concepts Found</p>
                            <p className="text-blue-300 font-bold text-lg">{analysis.semanticAnalysis.totalJobConcepts}</p>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-slate-400 font-medium">Concepts Matched</p>
                            <p className="text-emerald-300 font-bold text-lg">{analysis.semanticAnalysis.matchedConceptCount}</p>
                          </div>
                        </div>

                        {/* Matched Concepts */}
                        {analysis.semanticAnalysis.matches.length > 0 && (
                          <div>
                            <h4 className="text-blue-300 font-semibold mb-3 text-sm">Matched Concepts</h4>
                            <div className="flex flex-wrap gap-2">
                              {analysis.semanticAnalysis.matches.slice(0, 8).map((match, idx) => (
                                <div key={idx} className="flex items-center gap-1 bg-blue-900/40 border border-blue-600/30 rounded-lg px-3 py-2">
                                  <span className="text-blue-300 text-xs font-semibold">{match.concept}</span>
                                  <span className="text-blue-400 text-xs font-bold bg-blue-900/60 px-2 py-0.5 rounded">{match.score}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Unmatched Concepts */}
                        {analysis.semanticAnalysis.unmatchedConcepts.length > 0 && (
                          <div className="border-t border-slate-600 pt-4">
                            <h4 className="text-amber-300 font-semibold mb-3 text-sm">Concepts to Address</h4>
                            <p className="text-slate-400 text-xs mb-3">These concepts appear in the job description but lack strong presence in your resume:</p>
                            <div className="flex flex-wrap gap-2">
                              {analysis.semanticAnalysis.unmatchedConcepts.slice(0, 8).map((concept, idx) => (
                                <span key={idx} className="bg-amber-900/40 text-amber-300 px-3 py-1 rounded-lg text-xs border border-amber-600/30">
                                  {concept}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Strengths */}
                {analysis.strengths.length > 0 && (
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-emerald-600/30 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                      Key Strengths
                    </h3>
                    <ul className="space-y-4">
                      {analysis.strengths.map((strength, idx) => (
                        <li key={idx} className="text-emerald-300 flex gap-3 text-sm">
                          <span className="text-emerald-400 font-bold mt-1">✓</span>
                          <span className="leading-relaxed">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {analysis.suggestions.length > 0 && (
                  <div className="bg-gray-800 rounded-lg p-6 border border-blue-500">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      Optimization Recommendations
                    </h3>
                    <div className="space-y-3">
                      {analysis.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="bg-gray-700 rounded p-3">
                          <p className="text-blue-300 font-semibold text-sm mb-1">
                            {suggestion.category}
                          </p>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {suggestion.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvement Areas */}
                {analysis.improvementAreas.length > 0 && (
                  <div className="bg-gray-800 rounded-lg p-6 border border-yellow-500">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      Areas for Improvement
                    </h3>
                    <div className="space-y-3">
                      {analysis.improvementAreas.map((area, idx) => (
                        <div key={idx} className="bg-gray-700 rounded p-3">
                          <p className="text-yellow-300 text-sm leading-relaxed">
                            {area}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Keywords */}
                {analysis.missingKeywords.length > 0 && (
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-amber-600/30 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                      <AlertCircle className="w-6 h-6 text-amber-400" />
                      Keywords to Add
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">These terms appear in the job description but not in your resume:</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missingKeywords.slice(0, 12).map((keyword) => (
                        <span
                          key={keyword}
                          className="bg-amber-900/40 text-amber-300 px-4 py-2 rounded-lg text-xs font-medium border border-amber-600/30 hover:border-amber-600 transition-colors"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Analysis */}
                {analysis.skills && (
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-indigo-600/30 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-indigo-400" />
                      Skills Assessment
                    </h3>

                    <div className="space-y-6">
                      {/* Current Skills */}
                      <div>
                        <h4 className="text-indigo-300 font-semibold mb-3">Your Current Skills</h4>
                        <div className="space-y-3">
                          {analysis.skills.present.technical.length > 0 && (
                            <div>
                              <p className="text-slate-400 text-sm font-medium mb-2">Technical Skills ({analysis.skills.present.technical.length})</p>
                              <div className="flex flex-wrap gap-2">
                                {analysis.skills.present.technical.map((skill) => (
                                  <span key={skill} className="bg-indigo-900/40 text-indigo-300 px-3 py-1 rounded-full text-xs border border-indigo-600/30">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {analysis.skills.present.soft.length > 0 && (
                            <div>
                              <p className="text-slate-400 text-sm font-medium mb-2">Soft Skills ({analysis.skills.present.soft.length})</p>
                              <div className="flex flex-wrap gap-2">
                                {analysis.skills.present.soft.map((skill) => (
                                  <span key={skill} className="bg-indigo-900/40 text-indigo-300 px-3 py-1 rounded-full text-xs border border-indigo-600/30">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Required Skills */}
                      <div className="border-t border-slate-600 pt-4">
                        <h4 className="text-emerald-300 font-semibold mb-3">Required Skills for Role</h4>
                        <div className="space-y-3">
                          {analysis.skills.required.technical.length > 0 && (
                            <div>
                              <p className="text-slate-400 text-sm font-medium mb-2">Technical Skills ({analysis.skills.required.technical.length})</p>
                              <div className="flex flex-wrap gap-2">
                                {analysis.skills.required.technical.map((skill) => (
                                  <span
                                    key={skill}
                                    className={`px-3 py-1 rounded-full text-xs border ${
                                      analysis.skills.present.technical.includes(skill)
                                        ? "bg-emerald-900/40 text-emerald-300 border-emerald-600/30"
                                        : "bg-red-900/40 text-red-300 border-red-600/30"
                                    }`}
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skill Gap Analysis */}
                {analysis.gapAnalysis && analysis.gapAnalysis.length > 0 && (
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-orange-600/30 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-orange-400" />
                      Gap Analysis
                    </h3>
                    <div className="space-y-4">
                      {analysis.gapAnalysis.map((gap, idx) => (
                        <div key={idx} className="bg-slate-700/50 rounded-lg p-4 border-l-4 border-orange-500">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-block bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                              {gap.priority}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm mb-3">{gap.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {gap.skills.map((skill) => (
                              <span key={skill} className="bg-orange-900/40 text-orange-300 px-3 py-1 rounded text-xs font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learning Paths */}
                {analysis.learningPaths && analysis.learningPaths.length > 0 && (
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-cyan-600/30 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-cyan-400" />
                      How to Obtain Required Skills
                    </h3>
                    <div className="space-y-4">
                      {analysis.learningPaths.map((path, idx) => (
                        <div key={idx} className="bg-slate-700/50 rounded-lg p-5 border border-cyan-600/30">
                          <h4 className="text-cyan-300 font-semibold mb-3 text-sm uppercase tracking-wide">{path.skill}</h4>
                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="text-slate-400 font-medium mb-1">Learning Resources:</p>
                              <ul className="text-cyan-300 ml-4">
                                {path.resources.map((resource, i) => (
                                  <li key={i} className="text-xs">• {resource}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-slate-400 font-medium">Timeframe:</p>
                                <p className="text-cyan-300">{path.timeframe}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-medium">Platforms:</p>
                                <p className="text-cyan-300">{path.platform.join(", ")}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Portfolio Project Suggestion */}
                {analysis.projectSuggestion && (
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-purple-600/30 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-purple-400" />
                      Recommended Portfolio Project
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-purple-300 font-semibold text-lg mb-2">{analysis.projectSuggestion.title}</h4>
                        <p className="text-slate-300 text-sm leading-relaxed mb-4">{analysis.projectSuggestion.description}</p>
                      </div>

                      <div>
                        <p className="text-slate-400 text-sm font-medium mb-2">Technology Stack:</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.projectSuggestion.techStack.map((tech) => (
                            <span key={tech} className="bg-purple-900/40 text-purple-300 px-3 py-1 rounded text-xs font-medium border border-purple-600/30">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-slate-400 text-sm font-medium mb-2">Key Features to Implement:</p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {analysis.projectSuggestion.features.map((feature, idx) => (
                            <li key={idx} className="text-purple-300 text-xs flex items-start gap-2">
                              <span className="text-purple-400 font-bold mt-0.5">→</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="border-t border-slate-600 pt-4 grid grid-cols-3 gap-4 text-center text-xs">
                        <div>
                          <p className="text-slate-400 font-medium">Duration:</p>
                          <p className="text-purple-300 font-semibold">{analysis.projectSuggestion.estimatedDuration}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">Portfolio Impact:</p>
                          <p className="text-purple-300 font-semibold">High</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">Recommendation:</p>
                          <p className="text-purple-300 font-semibold">Essential</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-12 border border-slate-600 text-center shadow-lg">
                <Brain className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400 text-lg font-medium">Ready to analyze</p>
                <p className="text-slate-500 text-sm mt-2">Upload or paste your resume and job description above to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
