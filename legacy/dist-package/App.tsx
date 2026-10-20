import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  PlusSquare,
  Settings,
  LogOut,
  Bell,
  Search,
  PlayCircle,
  Star,
  TrendingUp,
  Network,
  Compass,
  Globe,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Wallet,
  User as UserIcon,
  FileText,
} from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { CoursePlayer } from "./components/CoursePlayer";
import { CreatorStudio } from "./components/CreatorStudio";
import { LearningTree } from "./components/LearningTree";
import { Whitepaper } from "./components/Whitepaper";
import { SettingsModal } from "./components/SettingsModal";
import { AuthModal } from "./components/AuthModal";
import { LandingPage } from "./components/LandingPage";
import { ViewState, Course, LearningPathData, CoursePlan } from "./types";
import {
  generateCareerPath,
  generateCourseOutline,
  generateLearningTree,
  generateModuleContent,
} from "./services/geminiService";
import { dbService } from "./services/dbService";
import { isSupabaseConfigured } from "./services/supabase";

const App: React.FC = () => {
  // If user is not logged in, show landing page first
  const [currentView, setCurrentView] = useState<ViewState>("landing");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [language, setLanguage] = useState("en"); // Default language
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Data State
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [user, setUser] = useState<any>(null);

  // --- Initial Mock Data for other components ---
  const INITIAL_TREE_DATA: LearningPathData = {
    roadmapTitle: "Strategic Path: Frontend to Full Stack Architect",
    marketAnalysis: {
      topOpportunities: [
        "Senior Full Stack Engineer",
        "Technical Lead",
        "Solutions Architect",
      ],
      valueProposition:
        "Bridge the gap between UI and Data. Full stack architects control the entire product lifecycle, commanding top-tier equity and salary.",
      keyLeverageSkill: "System Design & Cloud Architecture",
      salaryRange: "$130k - $210k",
      salarySources: [
        { title: "Levels.fyi", uri: "#" },
        { title: "Glassdoor", uri: "#" },
      ],
    },
    nodes: [
      {
        step: 1,
        skill: "Server-Side Rendering (Next.js)",
        description:
          "Move beyond SPA. Learn how hydration and edge computing work to improve performance and SEO.",
        strategy: "CONSUME",
        recommendation: "Advanced Next.js Patterns Course",
        duration: "3 weeks",
      },
      {
        step: 2,
        skill: "Database Design (SQL & NoSQL)",
        description:
          "Data is the core of value. Understand normalization, indexing, and eventual consistency.",
        strategy: "CREATE",
        recommendation: "Build a multi-tenant SaaS schema",
        duration: "4 weeks",
      },
      {
        step: 3,
        skill: "Cloud Infrastructure (AWS/Docker)",
        description:
          "Code needs a home. Learn containerization and serverless patterns to deploy scalable apps.",
        strategy: "CONSUME",
        recommendation: "DevOps for Frontend Devs",
        duration: "3 weeks",
      },
      {
        step: 4,
        skill: "System Design Architecture",
        description:
          "The glue that holds it all together. Load balancing, caching strategies, and CAP theorem.",
        strategy: "CREATE",
        recommendation: "Design a clone of Uber's backend",
        duration: "5 weeks",
      },
    ],
  };

  const INITIAL_STUDIO_PLAN: CoursePlan = {
    courseTitle: "Mastering CSS Grid Layouts",
    description:
      "A comprehensive guide to building complex, responsive 2D layouts on the web without framework bloat.",
    modules: [
      {
        title: "Grid Fundamentals & Syntax",
        duration: "15:00",
        keyTakeaways: [
          "Display grid",
          "Fr units",
          "Implicit vs Explicit grids",
        ],
      },
      {
        title: "Placing Items & Grid Areas",
        duration: "20:00",
        keyTakeaways: ["Grid lines", "Named areas", "Z-index in grid"],
      },
      {
        title: "Responsive Patterns without Media Queries",
        duration: "18:30",
        keyTakeaways: ["Auto-fit vs Auto-fill", "Minmax function", "Clamp()"],
      },
      {
        title: "Real-world Layout Project",
        duration: "45:00",
        keyTakeaways: ["Bento box layout", "Dashboard grid", "Fallbacks"],
      },
    ],
  };

  // --- Lifted State: Dashboard ---
  const [dashboardState, setDashboardState] = useState({
    form: { role: "", goal: "", interests: "" },
    path: null as string | null,
    isGenerating: false,
  });

  // --- Lifted State: Learning Tree ---
  const [treeState, setTreeState] = useState({
    form: {
      currentRole: "Frontend Developer",
      targetGoal: "Full Stack Architect",
      interests: "Scalability, Cloud",
    },
    data: INITIAL_TREE_DATA,
    isGenerating: false,
    isSaved: true,
    error: null as string | null,
  });

  // --- Lifted State: Creator Studio ---
  const [studioState, setStudioState] = useState({
    topic: "CSS Grid",
    audience: "Junior Developers",
    difficulty: "Beginner",
    tone: "Professional",
    plan: INITIAL_STUDIO_PLAN,
    isGenerating: false,
    generatingModuleIndex: null as number | null,
  });

  // --- Load Data Effect ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      // Fetch Courses (Mock or Real)
      const coursesData = await dbService.getCourses();
      setCourses(coursesData);

      // Check Auth
      const currentUser = await dbService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // If user is logged in, verify if we should stay on landing or go to dashboard
        // But usually, if they just refreshed and have a session, we might want to go to dashboard.
        // For now, let's leave default view logic to user interaction or explicit state.
      }

      setIsLoadingData(false);
    };
    loadData();
  }, []);

  const handleCourseClick = (id: string) => {
    setSelectedCourseId(id);
    setCurrentView("learning");
  };

  const handleLoginSuccess = (email: string) => {
    setUser({ email, id: "mock-user-id" });
    setCurrentView("dashboard"); // Auto-navigate to dashboard on login
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("landing"); // Go back to landing on logout
    // dbService.signOut(); // If connected to real backend
  };

  const LANGUAGES = [
    { code: "en", label: "English (US)", flag: "🇺🇸" },
    { code: "zh", label: "中文 (CN)", flag: "🇨🇳" },
    { code: "de", label: "Deutsch (DE)", flag: "🇩🇪" },
    { code: "es", label: "Español (ES)", flag: "🇪🇸" },
    { code: "fr", label: "Français (FR)", flag: "🇫🇷" },
  ];

  // --- Handlers: Dashboard ---
  const handleDashboardGenerate = async () => {
    if (!dashboardState.form.role || !dashboardState.form.goal) return;
    setDashboardState((prev) => ({ ...prev, isGenerating: true }));
    try {
      const result = await generateCareerPath(
        dashboardState.form.role,
        dashboardState.form.interests,
        dashboardState.form.goal,
        language,
      );
      setDashboardState((prev) => ({
        ...prev,
        path: result,
        isGenerating: false,
      }));
    } catch (e) {
      console.error(e);
      setDashboardState((prev) => ({ ...prev, isGenerating: false }));
    }
  };

  // --- Handlers: Learning Tree ---
  const handleTreeGenerate = async (
    role?: string,
    goal?: string,
    interests?: string,
  ) => {
    const cRole = role || treeState.form.currentRole;
    const cGoal = goal || treeState.form.targetGoal;
    const cInterests = interests || treeState.form.interests;

    if (!cRole || !cGoal) return;

    if (role) {
      setTreeState((prev) => ({
        ...prev,
        form: { currentRole: cRole, targetGoal: cGoal, interests: cInterests },
      }));
    }

    setTreeState((prev) => ({
      ...prev,
      isGenerating: true,
      data: null,
      isSaved: false,
      error: null,
    }));

    try {
      const result = await generateLearningTree(
        cRole,
        cGoal,
        cInterests,
        language,
      );
      if (result) {
        setTreeState((prev) => ({
          ...prev,
          data: result,
          isGenerating: false,
        }));
        // Auto-save to DB if user is logged in
        if (user) {
          await dbService.saveLearningPath(user.id, result);
        }
      } else {
        setTreeState((prev) => ({
          ...prev,
          isGenerating: false,
          error:
            "Unable to generate roadmap. Please check your API key or try again.",
        }));
      }
    } catch (e) {
      console.error(e);
      setTreeState((prev) => ({
        ...prev,
        isGenerating: false,
        error:
          "An unexpected error occurred. Please check your network connection.",
      }));
    }
  };

  // --- Handlers: Creator Studio ---
  const handleConfigureStudio = (config: {
    topic: string;
    audience: string;
    difficulty: string;
  }) => {
    setStudioState((prev) => ({
      ...prev,
      topic: config.topic,
      audience: config.audience,
      difficulty: config.difficulty,
      tone: "Professional", // Default to professional
      plan: null, // Reset any previous plan to force new generation based on new context
    }));
  };

  const handleStudioGenerateOutline = async () => {
    if (!studioState.topic || !studioState.audience) return;
    setStudioState((prev) => ({ ...prev, isGenerating: true, plan: null }));
    try {
      const result = await generateCourseOutline(
        studioState.topic,
        studioState.audience,
        studioState.difficulty,
        studioState.tone,
        language,
      );
      setStudioState((prev) => ({
        ...prev,
        plan: result,
        isGenerating: false,
      }));
    } catch (e) {
      console.error(e);
      setStudioState((prev) => ({ ...prev, isGenerating: false }));
    }
  };

  const handleStudioGenerateContent = async (moduleIndex: number) => {
    if (!studioState.plan) return;

    setStudioState((prev) => ({ ...prev, generatingModuleIndex: moduleIndex }));
    const moduleToGen = studioState.plan.modules[moduleIndex];

    try {
      const content = await generateModuleContent(
        moduleToGen.title,
        studioState.topic,
        studioState.audience,
        studioState.tone,
        language,
      );

      if (content) {
        setStudioState((prev) => {
          if (!prev.plan) return prev;
          const newModules = [...prev.plan.modules];
          newModules[moduleIndex] = {
            ...newModules[moduleIndex],
            content: content,
          };
          return {
            ...prev,
            generatingModuleIndex: null,
            plan: { ...prev.plan, modules: newModules },
          };
        });
      } else {
        setStudioState((prev) => ({ ...prev, generatingModuleIndex: null }));
      }
    } catch (e) {
      console.error(e);
      setStudioState((prev) => ({ ...prev, generatingModuleIndex: null }));
    }
  };

  const NavItem = ({
    view,
    icon: Icon,
    label,
  }: {
    view: ViewState;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => {
        setSelectedCourseId(null);
        setCurrentView(view);
      }}
      className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 font-medium whitespace-nowrap overflow-hidden ${
        currentView === view && !selectedCourseId
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      } ${isSidebarCollapsed ? "justify-center" : "space-x-3"}`}
      title={isSidebarCollapsed ? label : undefined}
    >
      <Icon size={20} className="shrink-0" />
      <span
        className={`transition-opacity duration-300 ${isSidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"}`}
      >
        {label}
      </span>
    </button>
  );

  // --- RENDER LANDING PAGE ---
  if (currentView === "landing") {
    return (
      <>
        <LandingPage
          onGetStarted={() => setCurrentView("dashboard")}
          onSignIn={() => setIsAuthOpen(true)}
          onReadManifesto={() => setCurrentView("whitepaper")}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLogin={handleLoginSuccess}
        />
      </>
    );
  }

  // --- RENDER MAIN APP ---
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden selection:bg-indigo-100 selection:text-indigo-700">
      {/* Sidebar - Hide if in whitepaper view */}
      {currentView !== "whitepaper" && (
        <aside
          className={`${isSidebarCollapsed ? "w-20" : "w-64"} bg-white border-r border-slate-200 hidden md:flex flex-col z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out`}
        >
          <div
            className={`p-6 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}
          >
            {!isSidebarCollapsed && (
              <div className="flex items-center space-x-2 text-indigo-700 animate-fade-in">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/30">
                  <BookOpen size={24} />
                </div>
                <span className="text-xl font-bold tracking-tight whitespace-nowrap">
                  Learn2Earn
                </span>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/30">
                <BookOpen size={24} />
              </div>
            )}
          </div>

          {/* Toggle Button */}
          <div className="px-4 mb-2 flex justify-end">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen size={16} />
              ) : (
                <PanelLeftClose size={16} />
              )}
            </button>
          </div>

          <nav className="flex-1 px-3 space-y-2 mt-2">
            <NavItem
              view="dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
            />
            <NavItem
              view="learning-tree"
              icon={Network}
              label="Learning Tree"
            />
            <NavItem
              view="marketplace"
              icon={ShoppingBag}
              label="Explore Courses"
            />
            <NavItem view="studio" icon={PlusSquare} label="Creator Studio" />
          </nav>

          <div className="p-4 border-t border-slate-100">
            {!isSidebarCollapsed ? (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden group cursor-pointer animate-fade-in">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors"></div>
                <p className="text-xs font-medium text-slate-300 mb-1">
                  Evolution Score
                </p>
                <h3 className="text-2xl font-bold tracking-tight">
                  1,240{" "}
                  <span className="text-sm font-normal text-slate-400">XP</span>
                </h3>
                <button className="mt-4 w-full bg-white/10 hover:bg-white/20 text-xs font-bold py-2.5 rounded-lg transition-all border border-white/5">
                  Redeem Value
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-lg relative group">
                  <Wallet size={20} />
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                    1,240 XP
                  </span>
                </button>
              </div>
            )}

            {!isSidebarCollapsed ? (
              <div className="mt-4 space-y-1">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex w-full items-center space-x-3 text-slate-500 px-2 cursor-pointer hover:text-slate-800 transition-colors py-2 rounded-lg hover:bg-slate-50"
                >
                  <Settings size={20} />
                  <span className="text-sm font-medium">Settings</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedCourseId(null);
                    setCurrentView("whitepaper");
                  }}
                  className={`flex w-full items-center space-x-3 px-2 cursor-pointer transition-colors py-2 rounded-lg ${currentView === "whitepaper" ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"}`}
                >
                  <FileText size={20} />
                  <span className="text-sm font-medium">Manifesto</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center space-y-2">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => {
                    setSelectedCourseId(null);
                    setCurrentView("whitepaper");
                  }}
                  className={`p-2 rounded-lg transition-colors ${currentView === "whitepaper" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"}`}
                  title="Manifesto"
                >
                  <FileText size={20} />
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50/50">
        {currentView !== "whitepaper" && (
          /* Top Header - Hide on Whitepaper view */
          <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex items-center bg-white rounded-full px-4 py-2.5 w-80 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-sm">
              <Search size={18} className="text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search for skills, creators, or insights..."
                className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-700 placeholder:text-slate-400 font-medium"
              />
            </div>
            <div className="flex items-center space-x-6">
              {/* Language Selector */}
              <div className="relative group p-2">
                <button className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors">
                  <Globe size={20} />
                  <span className="text-sm font-medium hidden sm:block">
                    {LANGUAGES.find((l) => l.code === language)?.label ||
                      "Language"}
                  </span>
                  <ChevronDown size={14} />
                </button>
                {/* Invisible bridge to prevent menu from closing */}
                <div className="absolute top-full left-0 w-full h-2 bg-transparent"></div>
                <div className="absolute right-0 top-[calc(100%+0.5rem)] mt-0 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden hidden group-hover:block animate-fade-in z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${language === lang.code ? "text-indigo-600 font-bold bg-indigo-50" : "text-slate-600"}`}
                    >
                      <span className="flex items-center">
                        <span className="text-lg mr-2">{lang.flag}</span>
                        {lang.label}
                      </span>
                      {language === lang.code && (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3 cursor-pointer group">
                {user ? (
                  <>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">
                        {user.email || "User"}
                      </p>
                      <p className="text-xs text-slate-500">Authenticated</p>
                    </div>
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="h-10 w-10 rounded-full bg-indigo-100 border-2 border-white ring-2 ring-indigo-50 flex items-center justify-center text-indigo-700 font-bold overflow-hidden shadow-sm hover:scale-105 transition-transform"
                    >
                      <UserIcon size={20} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Dynamic Content View */}
        <div
          className={`flex-1 overflow-auto scroll-smooth ${currentView !== "whitepaper" ? "p-8" : ""}`}
        >
          {currentView === "dashboard" && (
            <div className="space-y-10 max-w-7xl mx-auto">
              <Dashboard
                state={dashboardState}
                onFormChange={(field, value) =>
                  setDashboardState((prev) => ({
                    ...prev,
                    form: { ...prev.form, [field]: value },
                  }))
                }
                onGenerate={handleDashboardGenerate}
                onReset={() =>
                  setDashboardState((prev) => ({ ...prev, path: null }))
                }
                onNavigateToTree={() => setCurrentView("learning-tree")}
              />

              <div className="animate-fade-in delay-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">
                      Continue Learning
                    </h3>
                    <p className="text-slate-500 mt-1">
                      Pick up where you left off
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentView("marketplace")}
                    className="text-indigo-600 text-sm font-bold hover:text-indigo-700 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                  >
                    View all courses
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {isLoadingData
                    ? [1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-80 bg-slate-100 rounded-3xl animate-pulse"
                        ></div>
                      ))
                    : courses.slice(0, 3).map((course, idx) => (
                        <div
                          key={course.id}
                          onClick={() => handleCourseClick(course.id)}
                          className="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group relative flex flex-col h-full"
                        >
                          <div className="h-48 bg-slate-200 relative overflow-hidden">
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 border border-white/30">
                                <PlayCircle
                                  size={32}
                                  fill="currentColor"
                                  className="opacity-90"
                                />
                              </div>
                            </div>
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-700 shadow-sm border border-white/50">
                              {course.category}
                            </div>
                            <div className="absolute bottom-4 right-4 bg-emerald-500/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white shadow-sm flex items-center">
                              <TrendingUp size={12} className="mr-1" />
                              {course.earningsPotential} Potential
                            </div>
                          </div>

                          <div className="p-6 flex-1 flex flex-col">
                            <h4 className="text-lg font-bold text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                              {course.title}
                            </h4>
                            <div className="flex items-center space-x-2 mb-4">
                              <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                                <img
                                  src={`https://picsum.photos/seed/${course.author}/50/50`}
                                  alt={course.author}
                                />
                              </div>
                              <p className="text-sm text-slate-500 font-medium">
                                {course.author}
                              </p>
                            </div>

                            <div className="mt-auto">
                              <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-semibold">
                                <span>{course.progress}% Complete</span>
                                <span className="text-indigo-600">
                                  {course.totalModules} Modules
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-1000 ease-out"
                                  style={{ width: `${course.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            </div>
          )}

          {currentView === "learning" && (
            <CoursePlayer
              courseId={selectedCourseId || "1"}
              onBack={() => {
                setSelectedCourseId(null);
                setCurrentView("dashboard");
              }}
            />
          )}

          {currentView === "learning-tree" && (
            <LearningTree
              onChangeView={setCurrentView}
              state={treeState}
              onFormChange={(updates) =>
                setTreeState((prev) => ({
                  ...prev,
                  form: { ...prev.form, ...updates },
                }))
              }
              onGenerate={handleTreeGenerate}
              onSave={() =>
                setTreeState((prev) => ({ ...prev, isSaved: true }))
              }
              onReset={() =>
                setTreeState((prev) => ({
                  ...prev,
                  data: null,
                  isSaved: false,
                  error: null,
                }))
              }
              onConfigureStudio={handleConfigureStudio}
            />
          )}

          {currentView === "marketplace" && (
            <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">
                    Course Marketplace
                  </h2>
                  <p className="text-slate-500">
                    Invest in your future with high-ROI skills.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
                    Filter
                  </button>
                  <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
                    Sort
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course, idx) => (
                  <div
                    key={course.id}
                    onClick={() => handleCourseClick(course.id)}
                    className="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col h-full"
                  >
                    <div className="h-56 bg-slate-200 relative overflow-hidden">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-700 shadow-sm">
                        {course.category}
                      </div>
                      <div className="absolute bottom-4 right-4 bg-emerald-500/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white shadow-sm flex items-center">
                        <TrendingUp size={12} className="mr-1" />
                        {course.earningsPotential} Potential
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h4 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                        {course.title}
                      </h4>
                      <p className="text-sm text-slate-500 mb-6 line-clamp-2">
                        {course.description}
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                            <img
                              src={`https://picsum.photos/seed/${course.author}/50/50`}
                              alt={course.author}
                            />
                          </div>
                          <div>
                            <p className="text-xs text-slate-900 font-bold">
                              {course.author}
                            </p>
                            <p className="text-sm text-slate-400 font-medium">
                              {course.totalModules} Modules
                            </p>
                          </div>
                        </div>
                        <button className="p-2 rounded-full bg-slate-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors">
                          <ShoppingBag size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === "studio" && (
            <CreatorStudio
              state={studioState}
              onStateChange={(updates) =>
                setStudioState((prev) => ({ ...prev, ...updates }))
              }
              onGenerate={handleStudioGenerateOutline}
              onGenerateContent={handleStudioGenerateContent}
              onDiscard={() =>
                setStudioState((prev) => ({ ...prev, plan: null }))
              }
              onPublish={() => alert("Course published successfully!")}
              onNavigateToTree={() => setCurrentView("learning-tree")}
            />
          )}

          {currentView === "whitepaper" && (
            <Whitepaper onBack={() => setCurrentView("landing")} />
          )}
        </div>
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={handleLogout}
        user={user}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLoginSuccess}
      />
    </div>
  );
};

export default App;
