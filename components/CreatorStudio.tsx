import React, { useState } from "react";
import {
  Sparkles,
  Layers,
  Clock,
  Loader2,
  Plus,
  PenTool,
  BookOpen,
  ChevronRight,
  FileText,
  CheckCircle,
  Video,
  List,
  Link as LinkIcon,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  Network,
  ChevronDown,
  Circle,
  Zap,
} from "lucide-react";
import { CoursePlan, RRTreeNode } from "../types";

interface CreatorStudioProps {
  state: {
    topic: string;
    audience: string;
    difficulty: string;
    tone: string;
    plan: CoursePlan | null;
    isGenerating: boolean;
    generatingModuleIndex: number | null;
  };
  onStateChange: (updates: {
    topic?: string;
    audience?: string;
    difficulty?: string;
    tone?: string;
  }) => void;
  onGenerate: () => void;
  onGenerateContent: (moduleIndex: number) => void;
  onDiscard: () => void;
  onPublish: () => void;
  onNavigateToTree: () => void;
}

// Recursive component to render RRTree
const RRTreeNodeView: React.FC<{ node: RRTreeNode; level?: number }> = ({
  node,
  level = 0,
}) => {
  if (!node) return null; // Safety check

  const [isOpen, setIsOpen] = useState(level < 2); // Open first two levels by default

  const hasChildren = node.children && node.children.length > 0;

  const typeColor =
    {
      root: "text-indigo-700 bg-indigo-50 border-indigo-200",
      concept: "text-slate-800 bg-white border-slate-200",
      detail: "text-slate-600 bg-slate-50 border-transparent",
      example: "text-emerald-700 bg-emerald-50 border-emerald-100 italic",
    }[node.type] || "text-slate-700";

  return (
    <div className={`ml-${level * 4} mt-2 animate-fade-in`}>
      <div
        className={`flex items-start p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${typeColor} relative group`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Connector Line */}
        {level > 0 && (
          <div className="absolute -left-4 top-1/2 w-4 h-px bg-slate-200"></div>
        )}

        <div className="mr-2 mt-0.5 opacity-50">
          {hasChildren ? (
            isOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <Circle size={8} className="fill-current mt-1" />
          )}
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider opacity-60 mb-0.5 block">
            {node.type}
          </span>
          <h4 className="font-semibold text-sm leading-tight">{node.label}</h4>
          {isOpen && (
            <p className="text-xs mt-1.5 opacity-90 leading-relaxed">
              {node.content}
            </p>
          )}
        </div>
      </div>

      {isOpen && hasChildren && node.children && (
        <div className="pl-4 border-l border-slate-200 ml-3">
          {node.children.map((child, idx) => (
            <RRTreeNodeView
              key={child.id || idx}
              node={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CreatorStudio: React.FC<CreatorStudioProps> = ({
  state,
  onStateChange,
  onGenerate,
  onGenerateContent,
  onDiscard,
  onPublish,
  onNavigateToTree,
}) => {
  const {
    topic,
    audience,
    difficulty,
    tone,
    isGenerating,
    plan,
    generatingModuleIndex,
  } = state;
  const [activeModuleIndex, setActiveModuleIndex] = useState<number | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    "knowledge_map" | "quiz" | "resources"
  >("knowledge_map");

  // When a plan is generated, default to showing the first module
  React.useEffect(() => {
    if (plan && activeModuleIndex === null) {
      setActiveModuleIndex(0);
    }
  }, [plan, activeModuleIndex]);

  const activeModule =
    plan && activeModuleIndex !== null ? plan.modules[activeModuleIndex] : null;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 text-white">
            <PenTool size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Creator Studio
            </h2>
            <div className="flex items-center space-x-2">
              <p className="text-slate-500 text-sm">
                Transform your expertise into a structured knowledge graph.
              </p>
              <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider flex items-center">
                <BrainCircuit size={10} className="mr-1" /> FH-DREAM Engine
              </span>
            </div>
          </div>
        </div>
        {plan && (
          <div className="flex space-x-3">
            <button
              onClick={onDiscard}
              className="px-4 py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors text-sm"
            >
              Discard Draft
            </button>
            <button
              onClick={onPublish}
              className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center"
            >
              <CheckCircle size={16} className="mr-2" />
              Publish Course
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel: Configuration & Outline */}
        <div className="w-80 flex flex-col gap-6 shrink-0 h-full overflow-hidden">
          {/* Config Form */}
          <div
            className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-100 shrink-0 transition-all overflow-y-auto custom-scrollbar ${plan ? "opacity-80 hover:opacity-100 max-h-[40vh]" : ""}`}
          >
            <h3 className="font-bold text-slate-800 mb-4 flex items-center text-sm uppercase tracking-wider">
              <Sparkles size={16} className="text-indigo-600 mr-2" />
              Course Config
            </h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => onStateChange({ topic: e.target.value })}
                  placeholder="Topic (e.g. Advanced Pottery)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => onStateChange({ audience: e.target.value })}
                  placeholder="Audience (e.g. Beginners)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={difficulty}
                    onChange={(e) =>
                      onStateChange({ difficulty: e.target.value })
                    }
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <select
                    value={tone}
                    onChange={(e) => onStateChange({ tone: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Casual">Casual/Fun</option>
                    <option value="Academic">Academic</option>
                  </select>
                </div>
              </div>

              {!plan && (
                <button
                  onClick={onGenerate}
                  disabled={isGenerating || !topic || !audience}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex justify-center items-center text-sm"
                >
                  {isGenerating ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <Plus size={16} className="mr-2" />
                  )}
                  {isGenerating ? "Designing..." : "Generate Outline"}
                </button>
              )}
            </div>
          </div>

          {/* Modules List */}
          {plan && (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm">
                  {plan.courseTitle}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {plan.description}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {plan.modules.map((mod, idx) => {
                  const isActive = idx === activeModuleIndex;
                  const hasContent = !!mod.content;
                  const isGeneratingThis = idx === generatingModuleIndex;

                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveModuleIndex(idx)}
                      className={`w-full text-left p-3 rounded-lg text-sm transition-all border flex items-center group ${
                        isActive
                          ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm"
                          : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100 text-slate-600"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold mr-3 shrink-0 ${
                          isGeneratingThis
                            ? "bg-indigo-50 text-indigo-600"
                            : hasContent
                              ? "bg-emerald-100 text-emerald-600"
                              : isActive
                                ? "bg-indigo-200 text-indigo-700"
                                : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isGeneratingThis ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : hasContent ? (
                          <CheckCircle size={14} />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {mod.title}
                          {isGeneratingThis && (
                            <span className="ml-2 text-[10px] text-indigo-500 font-normal animate-pulse">
                              Generating...
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {mod.duration}
                        </p>
                      </div>
                      {isActive && (
                        <ChevronRight size={14} className="text-indigo-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Editor Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col relative">
          {!plan ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 p-8">
              <div className="max-w-2xl w-full">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-slate-800 mb-3">
                    What will you create today?
                  </h2>
                  <p className="text-slate-500 text-lg">
                    Every expert was once a beginner. Share your journey to
                    earn.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Option 1: Market Analysis */}
                  <button
                    onClick={onNavigateToTree}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all text-left group h-full"
                  >
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl inline-block mb-4 group-hover:scale-110 transition-transform">
                      <TrendingUp size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                      Analyze Market Value
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Not sure what's profitable? Use AI to find high-demand
                      skills and generate a learning-to-earning path.
                    </p>
                  </button>

                  {/* Option 2: Direct Creation */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group h-full cursor-default">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl inline-block mb-4 relative z-10">
                      <PenTool size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 relative z-10">
                      Structure a Course
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed relative z-10">
                      Have a topic in mind? Fill out the configuration on the
                      left to generate a curriculum outline instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeModule ? (
            <>
              {/* Editor Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/30">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 uppercase tracking-wider">
                      Module {activeModuleIndex! + 1}
                    </span>
                    <span className="flex items-center text-[10px] font-bold text-slate-400">
                      <Clock size={10} className="mr-1" />{" "}
                      {activeModule.duration}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {activeModule.title}
                  </h2>
                </div>

                {!activeModule.content ? (
                  <button
                    onClick={() => onGenerateContent(activeModuleIndex!)}
                    disabled={generatingModuleIndex === activeModuleIndex}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 flex items-center disabled:opacity-70"
                  >
                    {generatingModuleIndex === activeModuleIndex ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <BrainCircuit size={16} className="mr-2" />
                    )}
                    {generatingModuleIndex === activeModuleIndex
                      ? "Applying Head First Logic..."
                      : "Generate Knowledge Map"}
                  </button>
                ) : (
                  <div className="flex items-center text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 text-xs font-bold">
                    <CheckCircle size={14} className="mr-1.5" /> Content Ready
                  </div>
                )}
              </div>

              {/* Editor Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6">
                  {[
                    {
                      id: "knowledge_map",
                      label: "Visual Metaphor (Step H)",
                      icon: Network,
                    },
                    { id: "quiz", label: "Feynman Check (Step D)", icon: List },
                    {
                      id: "resources",
                      label: "Elaboration (Step E)",
                      icon: LinkIcon,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-indigo-600 text-indigo-600"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <tab.icon size={16} className="mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                  {generatingModuleIndex === activeModuleIndex ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <Loader2
                        size={48}
                        className="animate-spin text-indigo-500 mb-4"
                      />
                      <p className="text-sm font-medium">
                        Running FH-DREAM Cycle...
                      </p>
                      <div className="mt-4 space-y-2 text-xs text-slate-400 w-48">
                        <div className="flex items-center">
                          <CheckCircle
                            size={12}
                            className="mr-2 text-emerald-500"
                          />{" "}
                          Atomizing Concepts (Focus)
                        </div>
                        <div className="flex items-center">
                          <CheckCircle
                            size={12}
                            className="mr-2 text-emerald-500"
                          />{" "}
                          Designing Visuals (Head First)
                        </div>
                        <div className="flex items-center opacity-50">
                          <Loader2 size={12} className="animate-spin mr-2" />{" "}
                          Creating Analogies
                        </div>
                      </div>
                    </div>
                  ) : !activeModule.content ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                      <Sparkles size={48} className="mb-4 text-slate-300" />
                      <p className="max-w-xs text-center">
                        Click "Generate Knowledge Map" to have AI apply the Head
                        First + Feynman method to this module.
                      </p>
                    </div>
                  ) : (
                    <div className="h-full animate-fade-in">
                      {activeTab === "knowledge_map" && (
                        <div className="h-full flex flex-col md:flex-row">
                          {/* Visual Side (SVG) */}
                          <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-100/50 flex flex-col">
                            <div className="flex items-center mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                              <Zap size={14} className="mr-2 text-indigo-500" />{" "}
                              Visual Metaphor (Head First)
                            </div>
                            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-center overflow-hidden">
                              <div
                                className="w-full h-full max-h-[500px]"
                                dangerouslySetInnerHTML={{
                                  __html: activeModule.content.svgSource,
                                }}
                              />
                            </div>
                          </div>

                          {/* Logical Side (RRTree) */}
                          <div className="flex-1 p-6 bg-white overflow-y-auto">
                            <div className="flex items-center mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                              <Network
                                size={14}
                                className="mr-2 text-emerald-500"
                              />{" "}
                              Atomic Structure (Focus)
                            </div>
                            <div className="pl-2">
                              {activeModule.content.rrTree ? (
                                <RRTreeNodeView
                                  node={activeModule.content.rrTree}
                                />
                              ) : (
                                <div className="text-red-500 text-sm">
                                  Error: Tree data missing
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === "quiz" && (
                        <div className="p-8 space-y-6 max-w-2xl mx-auto">
                          {activeModule.content.quiz.map((q, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
                            >
                              <div className="flex items-start mb-4">
                                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded mr-3 mt-0.5">
                                  Q{idx + 1}
                                </span>
                                <h4 className="font-bold text-slate-800">
                                  {q.question}
                                </h4>
                              </div>
                              <div className="space-y-2 pl-10">
                                {q.options.map((opt, optIdx) => (
                                  <div
                                    key={optIdx}
                                    className={`p-3 rounded-lg text-sm border flex items-center ${optIdx === q.correctAnswer ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-slate-100 text-slate-600"}`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${optIdx === q.correctAnswer ? "border-emerald-500 bg-emerald-500" : "border-slate-300"}`}
                                    >
                                      {optIdx === q.correctAnswer && (
                                        <CheckCircle
                                          size={10}
                                          className="text-white"
                                        />
                                      )}
                                    </div>
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === "resources" && (
                        <div className="p-8 space-y-4 max-w-2xl mx-auto">
                          <p className="text-sm text-slate-500 mb-4">
                            Use these resources to <b>Elaborate (Step E)</b> and
                            fill any knowledge gaps identified in the review.
                          </p>
                          {activeModule.content.resources.map((res, idx) => (
                            <div
                              key={idx}
                              className="flex items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors cursor-pointer group"
                            >
                              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <BookOpen size={20} />
                              </div>
                              <span className="font-medium text-slate-700 group-hover:text-indigo-900">
                                {res}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
