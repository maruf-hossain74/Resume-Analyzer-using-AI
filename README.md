# Interview Suite Pro - AI-Powered Interview & HR Platform

AI-powered platform for interview preparation, resume analysis, and candidate ranking. Built with React + Vite + Puter AI.

---

## Features

### 🧑‍💻 Interview Coach
- Practice FAANG-style coding problems with real-time feedback
- Support for JavaScript, Python, Java, C++
- 45-minute interview timer with AI evaluation
- Scoring on: correctness, efficiency, code quality, communication

### 📄 Resume Analyzer
- Upload resumes: PDF, images (OCR), text, documents
- AI analysis: candidate score, strengths, weaknesses, skill gaps
- Compare against job descriptions
- Actionable improvement suggestions

### 👥 Resume Ranker
- Batch process 100+ resumes instantly
- AI-powered candidate ranking with match scores
- Send interview invitations via email
- Personalized messaging for each candidate

---

## Background & Motivation

### Problem
- Interview coaching costs $50-150/hour (inaccessible)
- HR teams waste 15-20 hours per hire screening resumes
- Existing tools: single-purpose, lack AI feedback, poor UX

### Why Interview Suite Pro?
✅ **All-in-One**: Interview prep + Resume analysis + Candidate ranking  
✅ **AI-Powered**: Real-time feedback on 4+ dimensions  
✅ **Free & Open**: Democratizing interview preparation  
✅ **Multi-Format**: PDF, images, text support  
✅ **Batch Processing**: Rank hundreds of candidates instantly  
✅ **Modern Stack**: React 18 + Vite for speed  

---

## Implementation Approach

### Architecture
```
Frontend (React + Vite) → Puter AI API → AI Analysis → Results
```

### Tech Stack
- **Frontend**: React 18, Vite, CSS3
- **Backend**: Puter AI API (REST)
- **File Processing**: PDF extraction, OCR, text parsing
- **State Management**: React Hooks

### Components
1. **InterviewCoach** - Code editor + timer + feedback system
2. **ResumeAnalyzer** - File upload + AI analysis display
3. **ResumeRanker** - Batch processing + ranking + emails
4. **LandingPage** - Feature showcase & navigation

### Data Flow
```
User Input → Validation → API Call → Parse Response → Update State → Render
```

### Key Implementation Details
- Client-side file handling (no server needed)
- Real-time state management
- Copy-to-clipboard functionality
- Email template system
- Error handling & graceful fallbacks

---

## Getting Started

### Prerequisites
- Node.js 16+ & npm/yarn
- Git

### Installation
```bash
git clone https://github.com/niamul1317/Interview-Suite-Pro.git
cd Interview-Suite-Pro
npm install
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

---

## Project Structure
```
src/
├── components/
│   ├── InterviewCoach.jsx
│   ├── ResumeAnalyzer.jsx
│   ├── ResumeRanker.jsx
│   └── LandingPage.jsx
├── App.jsx
├── index.css
└── main.jsx
```

---

## Usage

### Interview Coach
1. Select coding problem
2. Write solution in editor
3. Submit for AI evaluation
4. Receive detailed feedback

### Resume Analyzer
1. Upload resume (PDF/image/text)
2. Optionally add job description
3. View comprehensive analysis
4. Apply suggestions

### Resume Ranker
1. Upload multiple resumes
2. Set job requirements
3. Review ranked candidates
4. Send interview invitations

---

## Technologies Used
- React 18 - UI framework
- Vite - Build tool
- Puter AI - Language model
- CSS3 - Styling
- HTML5 - File handling

---

## License
MIT License - Open source and free for all

## Author
Developed by the Interview Suite Pro team

## Support
Issues & suggestions welcome! Create an issue on GitHub.



## Features

### 🧑‍💻 Interview Coach
- Practice FAANG-style coding interview problems
- Support for multiple programming languages (JavaScript, Python, Java, C++)
- Real-time code editing with syntax highlighting
- 45-minute interview timer
- Ask clarifying questions to the AI interviewer
- Instant feedback and performance scoring on:
  - Correctness
  - Efficiency
  - Code Quality
  - Communication
  - Problem Solving
- Detailed verbal feedback

### 📄 Resume Analyzer
- Multiple input methods:
  - Paste resume text directly
  - Upload PDF files
  - Upload images (with OCR)
  - Upload text documents
- Comprehensive analysis including:
  - Candidate score (0-100%)
  - Match verdict (Strong/Good/Moderate/Weak Fit)
  - Strengths identification
  - Weaknesses analysis
  - Technical skill gaps
  - Actionable improvement suggestions
- Compare resume against job description
- Copy analysis results to clipboard

### 👥 Resume Ranker
- Upload multiple resumes at once
- AI-powered candidate ranking
- Batch processing of candidates
- Detailed ranking with:
  - Match scores
  - Individual assessments
  - Strength and weakness analysis
  - Interview invitation feature
- Send interview invitation emails to top candidates
- Email customization for each candidate

## Technology Stack

- **Frontend**: React 19.1 + Vite
- **Styling**: Tailwind CSS 4.1
- **Code Editor**: CodeMirror with Dracula theme
- **AI**: Puter AI (GPT-5-nano/Gemini)
- **PDF Processing**: pdf.js
- **Icons**: Lucide React
- **Language Support**: C++, Python, Java, JavaScript

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <repo-url>
cd ai-interview-coach\ demo
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

The application will start at `http://localhost:5173`

## Usage

### Interview Coach
1. Navigate to "Interview Coach" from the home page
2. Select programming language and difficulty level
3. Click "Start Interview" to get a coding problem
4. Use the code editor to write your solution
5. Ask clarifying questions to the interviewer if needed
6. Submit your solution for instant evaluation
7. View detailed feedback and scores

### Resume Analyzer
1. Go to "Resume Analyzer"
2. Choose input method:
   - **Paste Text**: Copy-paste your resume
   - **Upload PDF/TXT**: Upload document files
   - **Upload Image**: Upload resume screenshots/photos (OCR enabled)
3. Paste the job description
4. Click "Analyze Resume"
5. Review the analysis results:
   - Overall match score
   - Strengths and weaknesses
   - Technical skill gaps
   - Improvement suggestions

### Resume Ranker
1. Navigate to "Resume Ranker"
2. Upload multiple resumes (supports PDF, images, text files)
3. Provide the job description
4. Click "Rank All Candidates"
5. View ranked candidates with:
   - Match scores and verdicts
   - Individual assessments
6. Send interview invitations via email to selected candidates
7. Customize email subject and body for each candidate

## Features Powered by Puter AI

- **Problem Generation**: Dynamic FAANG-style problem creation
- **Code Evaluation**: Instant code review and scoring
- **Resume Analysis**: Comprehensive resume evaluation
- **OCR Processing**: Extract text from resume images
- **Candidate Ranking**: AI-powered resume comparison and ranking
- **Interview Guidance**: AI interviewer responses to clarifications

## Puter Integration

This application uses [Puter.js](https://docs.puter.com/) for all AI capabilities:

```javascript
// Load Puter in HTML
<script src="https://js.puter.com/v2/"></script>

// Use AI in code
const response = await puter.ai.chat("Your prompt here");
```

All AI processing is handled through Puter's cloud platform, eliminating the need for backend infrastructure.

## API Key

The application uses Puter's free tier AI services. Each user's session covers their own AI API usage with no backend costs.

## Project Structure

```
src/
├── App.jsx                 # Main app with navigation
├── components/
│   ├── LandingPage.jsx     # Home page with features
│   ├── InterviewCoach.jsx  # Coding interview simulator
│   ├── ResumeAnalyzer.jsx  # Resume analysis tool
│   └── ResumeRanker.jsx    # Candidate ranking tool
├── index.css               # Global styles
└── main.jsx                # React entry point
```

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Known Limitations

- PDF processing may have limitations with complex layouts
- Large resume files (>10MB) may take longer to process
- Email sending is simulated (requires backend integration for production)
- Interview problems require internet connection for AI

## Future Enhancements

- [ ] Real interview recording and playback
- [ ] Backend email service integration
- [ ] Resume database and candidate pipeline management
- [ ] Interview scheduling integration
- [ ] Advanced analytics and reporting
- [ ] Team collaboration features
- [ ] Custom LLM model selection
- [ ] Database storage for interview history

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Check [Puter Documentation](https://docs.puter.com/)
- Report issues on GitHub
- Contact: support@interviewsuitepro.com

## Acknowledgments

- Built with [Puter AI Platform](https://puter.com/)
- UI Components from [Lucide React](https://lucide.dev/)
- Code Editor powered by [CodeMirror](https://codemirror.net/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

**Interview Suite Pro** - Master interviews and hiring with AI 🚀

#   I n t e r v i e w - S u i t e - P r o 
 
 