
export interface Course {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  progress: number;
  totalModules: number;
  earningsPotential: string;
  category: 'Tech' | 'Finance' | 'Design' | 'Science';
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Insight {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  earnings: number;
  views: number;
  date: string;
}

export interface LearningNode {
  step: number;
  skill: string;
  description: string;
  strategy: 'CREATE' | 'CONSUME'; // The two paths requested
  recommendation: string; // "Create a tutorial on X" or "Take course Y"
  duration: string;
}

export interface JobMarketAnalysis {
  topOpportunities: string[]; // "What jobs earn money?"
  valueProposition: string;   // "Why do they earn money?" (The economic problem solved)
  keyLeverageSkill: string;   // "What is the most valuable skill?" (The 80/20 skill)
  salaryRange: string;
  salarySources?: { title: string; uri: string; }[];
}

export interface LearningPathData {
  roadmapTitle: string;
  marketAnalysis: JobMarketAnalysis;
  nodes: LearningNode[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

// New RRTree Structure
export interface RRTreeNode {
  id: string;
  label: string; // The concept name
  type: 'root' | 'concept' | 'detail' | 'example';
  content: string; // The explanation
  children?: RRTreeNode[];
}

export interface LessonContent {
  svgSource: string; // Raw SVG code for the diagram
  rrTree: RRTreeNode; // The root of the knowledge tree
  quiz: QuizQuestion[];
  resources: string[];
}

export interface CourseModule {
  id?: string;
  title: string;
  duration: string;
  keyTakeaways: string[];
  content?: LessonContent; // Optional, populated when user generates specific module content
  isCompleted?: boolean;
  isLocked?: boolean;
}

export interface CoursePlan {
  courseTitle: string;
  description: string;
  modules: CourseModule[];
}

export type ViewState = 'landing' | 'dashboard' | 'marketplace' | 'learning' | 'studio' | 'learning-tree' | 'whitepaper';
