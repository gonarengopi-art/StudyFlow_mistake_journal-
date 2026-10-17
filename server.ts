import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Support base64 image uploads from camera / screenshots up to 25MB
app.use(express.json({ limit: '25mb' }));

// Lazy/Safe server-side initialization of Gemini API
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

function parseBase64(dataUriOrBase64: string): { mimeType: string; data: string } {
  const match = dataUriOrBase64.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: 'image/jpeg', data: dataUriOrBase64 };
}

// ==========================================
// FEATURE 1: AI SNAP & EXTRACT MISTAKE
// ==========================================
app.post('/api/ai/extract-mistake', async (req, res) => {
  try {
    const { imageBase64, text, existingSubjects = [], existingTopics = [] } = req.body;

    if (!imageBase64 && !text) {
      return res.status(400).json({
        error: 'Please provide an image (base64) or raw problem text to analyze.',
      });
    }

    const ai = getAiClient();

    const subjectList = existingSubjects.map((s: any) => s.name).join(', ');
    const topicList = existingTopics.map((t: any) => t.name).join(', ');

    const promptInstructions = `
You are an expert academic tutor and exam analyzer (covering STEM, MCAT, JEE, SAT, AP, University, Medicine, Law, etc.).
Analyze the provided student mistake / problem (which may be an image of a handwritten or printed exam question, a screenshot, test booklet, or raw pasted text).

Context of student's current journal:
- Existing subjects: [${subjectList || 'None yet, suggest appropriate one (e.g., Physics, Chemistry, Mathematics, Biology, Computer Science)'}]
- Existing topics: [${topicList || 'None yet, suggest appropriate one'}]

Your task is to thoroughly analyze the problem, diagnose what went wrong, and return a clean JSON object with this exact structure:
{
  "title": "Short descriptive 3-6 word academic title (e.g., 'Carnot Cycle Efficiency Sign Trap')",
  "suggestedSubject": "Name of the subject (use an existing one if suitable, otherwise suggest a standard subject like Physics, Chemistry, Mathematics, Biology, etc.)",
  "suggestedTopic": "Topic within the subject (e.g., 'Thermodynamics', 'Differential Calculus', 'Reaction Kinetics')",
  "suggestedSubtopic": "Specific subtopic or concept name (optional, or empty string)",
  "originalQuestion": "Complete, crystal-clear formatted transcript of the problem (in Markdown with clean mathematical equations, bullet points, options A/B/C/D if multiple choice)",
  "myAnswer": "The student's incorrect answer or chosen option if visible or evident from annotations/marks/text; if not explicit, describe the incorrect assumption or value",
  "correctAnswer": "The correct final option letter (e.g., 'Option B') and/or correct value with clear units",
  "whatIGotWrong": "Concise, precise diagnosis of where the logic or calculation broke down (e.g., 'Forgot to convert Celsius to Kelvin before computing ratio', 'Applied chain rule incorrectly on inner exponent')",
  "correctExplanation": "Step-by-step rigorous pedagogical solution and derivation, explaining WHY the correct formula/logic applies",
  "reflection": "1-2 sentences in first-person addressing what cognitive rush or conceptual misunderstanding happened (e.g., 'I jumped to the formula without checking standard SI units.')",
  "futureAdvice": "1 punchy golden rule or mnemonic for next time (e.g., 'Always convert temperature to Kelvin immediately before doing thermodynamic calculations!')",
  "categories": ["Must pick 1 to 3 relevant tags from: 'Careless Error', 'Content Gap', 'Misread Question', 'Exam Technique', 'Timing Issue', 'Calculation Error', 'Knowledge Recall', 'Other'"]
}

Ensure the output is strictly valid JSON without wrapping in markdown codeblocks.
`;

    const parts: any[] = [];

    if (imageBase64) {
      const { mimeType, data } = parseBase64(imageBase64);
      parts.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    }

    if (text) {
      parts.push({
        text: `Student notes or pasted problem text:\n"""\n${text}\n"""`,
      });
    }

    parts.push({
      text: promptInstructions,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(outputText);
    } catch {
      // Clean possible fences
      const cleaned = outputText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in /api/ai/extract-mistake:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to extract mistake information with AI.',
    });
  }
});

// ==========================================
// FEATURE 2: AI CLONE PRACTICE QUESTION GENERATOR
// ==========================================
app.post('/api/ai/generate-clone-practice', async (req, res) => {
  try {
    const {
      originalQuestion,
      correctAnswer = '',
      whatIGotWrong = '',
      reflection = '',
      subjectName = '',
      topicName = '',
      categories = [],
      difficulty = 'Medium',
    } = req.body;

    if (!originalQuestion) {
      return res.status(400).json({
        error: 'Please provide the original question to generate a practice clone.',
      });
    }

    const ai = getAiClient();

    const prompt = `
You are an expert exam question author and cognitive tutor for competitive exams (JEE, NEET, MCAT, SAT, AP, University).
A student previously made an error on this problem:
---
SUBJECT: ${subjectName || 'Academic Subject'}
TOPIC: ${topicName || 'General Topic'}
ORIGINAL QUESTION:
${originalQuestion}

CORRECT ANSWER: ${correctAnswer}
WHAT STUDENT GOT WRONG / CONCEPT TRAP: ${whatIGotWrong || reflection || 'Common conceptual pitfall'}
MISTAKE CATEGORIES: ${Array.isArray(categories) ? categories.join(', ') : 'Concept Trap'}
DESIRED DIFFICULTY: ${difficulty}
---

Your mission:
Create a BRAND NEW, original "clone" question that tests the EXACT SAME underlying principle, formula, or cognitive discernment, but with DIFFERENT numbers, scenario, chemical species, or physical setup.
Crucially, one of the incorrect options (distractors) should be specifically crafted to catch the student if they repeat the exact same trap they fell into earlier!

Return a strictly valid JSON object matching this schema:
{
  "title": "Title for this practice challenge (e.g. 'Carnot Efficiency Variation #2')",
  "difficulty": "${difficulty}",
  "question": "Clear, standalone problem statement in Markdown with formatted formulas/scenarios",
  "options": [
    {
      "label": "A",
      "text": "Option text or numerical value",
      "isCorrect": boolean,
      "feedback": "Why this option is correct OR what specific mistake leads to choosing this distractor"
    },
    {
      "label": "B",
      "text": "Option text or numerical value",
      "isCorrect": boolean,
      "feedback": "Feedback for option B"
    },
    {
      "label": "C",
      "text": "Option text or numerical value",
      "isCorrect": boolean,
      "feedback": "Feedback for option C"
    },
    {
      "label": "D",
      "text": "Option text or numerical value",
      "isCorrect": boolean,
      "feedback": "Feedback for option D"
    }
  ],
  "correctOption": "A or B or C or D",
  "hint": "A subtle conceptual hint to nudge the student without revealing the final answer",
  "conceptSummary": "Key formula, theorem, or mental model tested here",
  "fullSolution": "Full step-by-step rigorous solution demonstrating how to arrive at the correct answer and avoid the trap"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(outputText);
    } catch {
      const cleaned = outputText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-clone-practice:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate clone practice question with AI.',
    });
  }
});

// ==========================================
// VITE DEV SERVER / PRODUCTION STATIC
// ==========================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyFlow server running on http://0.0.0.0:${PORT} [${isProd ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
