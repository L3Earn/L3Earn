
import React from 'react';
import { Network, Sparkles, ArrowRight, PenTool, BookOpen, Target, Briefcase, Map, Loader2, PlayCircle, PlusSquare, Code, Cpu, Palette, CheckCircle, Bookmark, DollarSign, TrendingUp, Zap, Search, ExternalLink, AlertCircle } from 'lucide-react';
import { LearningPathData, ViewState } from '../types';

interface LearningTreeProps {
  onChangeView: (view: ViewState) => void;
  state: {
    form: { currentRole: string; targetGoal: string; interests: string };
    data: LearningPathData | null;
    isGenerating: boolean;
    isSaved: boolean;
    error: string | null;
  };
  onFormChange: (updates: { currentRole?: string; targetGoal?: string; interests?: string }) => void;
  onGenerate: (role?: string, goal?: string, interests?: string) => void;
  onSave: () => void;
  onReset: () => void;
  onConfigureStudio: (config: { topic: string; audience: string; difficulty: string }) => void;
}

const SAMPLE_PATHS = [
  {
    role: 'Junior Frontend Developer',
    goal: 'Full Stack Architect',
    interests: 'Cloud Infrastructure, System Design, Scalability',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    label: 'Tech'
  },
  {
    role: 'Graphic Designer',
    goal: 'Senior Product Designer',
    interests: 'UX Research, Design Systems, Accessibility',
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    label: 'Design'
  },
  {
    role: 'Data Analyst',
    goal: 'AI Engineer',
    interests: 'LLMs, Vector Databases, Python',
    icon: Cpu,
    color: 'from-emerald-500 to-teal-500',
    label: 'AI'
  }
];

export const LearningTree: React.FC<LearningTreeProps> = ({ onChangeView, state, onFormChange, onGenerate, onSave, onReset, onConfigureStudio }) => {
  const { form, data: treeData, isGenerating: isLoading, isSaved, error } = state;

  const handleSavePath = () => {
    onSave();
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 text-white">
          <Network size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Learning Tree</h2>
          <p className="text-slate-500">Analyze market value and build a high-income skill path.</p>
        </div>
      </div>

      {!treeData ? (
        // Input Form View
        <div className="space-y-12">
            
            {/* Error Message */}
            {error && (
              <div className="max-w-4xl mx-auto bg-rose-50 border border-rose-100 text-rose-800 px-6 py-4 rounded-xl flex items-center justify-between shadow-sm animate-scale-up">
                <div className="flex items-center">
                   <AlertCircle size={20} className="mr-3 shrink-0" />
                   <div>
                     <p className="font-bold text-sm">Generation Failed</p>
                     <p className="text-xs opacity-80">{error}</p>
                   </div>
                </div>
                <button onClick={onReset} className="text-xs font-bold bg-white/50 hover:bg-white px-3 py-1.5 rounded-lg transition-colors border border-rose-100">Dismiss</button>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="p-8 md:p-12 relative z-10">
                <div className="max-w-2xl mx-auto text-center mb-10">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">Focus on Skills that Earn</h3>
                    <p className="text-slate-500 leading-relaxed">
                    Don't just learn randomly. Our AI analyzes the market to answer three critical questions:
                    <b> What jobs pay? Why do they pay? And what is the #1 skill you need?</b>
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                        <Briefcase size={14} className="mr-1.5" /> Current Role
                    </label>
                    <input 
                        value={form.currentRole}
                        onChange={(e) => onFormChange({ currentRole: e.target.value })}
                        placeholder="e.g. Content Writer"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    </div>
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                        <DollarSign size={14} className="mr-1.5" /> Earning Goal / Role
                    </label>
                    <input 
                        value={form.targetGoal}
                        onChange={(e) => onFormChange({ targetGoal: e.target.value })}
                        placeholder="e.g. Technical Copywriter ($100k+)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                        <Map size={14} className="mr-1.5" /> Interests & Passions
                    </label>
                    <input 
                        value={form.interests}
                        onChange={(e) => onFormChange({ interests: e.target.value })}
                        placeholder="e.g. Crypto, Fintech, SaaS"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    </div>
                </div>

                <div className="mt-10 flex justify-center">
                    <button 
                    onClick={() => onGenerate()}
                    disabled={isLoading || !form.currentRole || !form.targetGoal}
                    className="group relative px-8 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl hover:bg-indigo-600 transition-all hover:scale-105 hover:shadow-indigo-500/30 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed overflow-hidden"
                    >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative flex items-center">
                        {isLoading ? <Loader2 size={20} className="animate-spin mr-2" /> : <Search size={20} className="mr-2 text-emerald-400" />}
                        {isLoading ? "Analyzing Market Data..." : "Analyze Earning Potential"}
                    </div>
                    </button>
                </div>
            </div>
            </div>

            {/* Popular Paths Section */}
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-center mb-8 space-x-4">
                   <div className="h-px bg-slate-200 w-16"></div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Or try a high-value example</span>
                   <div className="h-px bg-slate-200 w-16"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {SAMPLE_PATHS.map((sample, idx) => (
                        <button
                            key={idx}
                            onClick={() => onGenerate(sample.role, sample.goal, sample.interests)}
                            disabled={isLoading}
                            className="group text-left bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${sample.color}`}></div>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 transition-colors`}>
                                    <sample.icon size={24} />
                                </div>
                                <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg uppercase tracking-wider">{sample.label}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors">{sample.goal}</h4>
                            <p className="text-xs text-slate-400 mb-3 flex items-center">
                                From: <span className="font-medium text-slate-600 ml-1">{sample.role}</span>
                            </p>
                            <div className="flex items-center text-xs font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                                Analyze Market <ArrowRight size={12} className="ml-1" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      ) : (
        // Results View
        <div className="space-y-8 animate-fade-in">
          
          {/* Market Analysis Dashboard */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
             
             <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-500/50 rounded-full text-xs font-bold text-indigo-200">Market Intelligence</span>
                            {isSaved && <span className="text-emerald-400 text-xs font-bold flex items-center"><CheckCircle size={12} className="mr-1"/> Path Saved</span>}
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">{treeData.roadmapTitle}</h2>
                        
                        <div className="flex flex-col gap-1 mt-2">
                          <p className="text-emerald-400 font-bold text-lg">
                            {treeData.marketAnalysis?.salaryRange || "Analysing Salary..."}
                          </p>
                          {treeData.marketAnalysis?.salarySources && treeData.marketAnalysis.salarySources.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                                {treeData.marketAnalysis.salarySources.map((source, idx) => (
                                    <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors text-slate-300 hover:text-white truncate max-w-[200px]">
                                        <ExternalLink size={10} className="mr-1" />
                                        {source.title || 'Source'}
                                    </a>
                                ))}
                            </div>
                          )}
                        </div>
                    </div>
                    <div className="flex gap-3">
                         <button 
                            onClick={handleSavePath}
                            disabled={isSaved}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center transition-all ${isSaved ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
                         >
                            {isSaved ? <CheckCircle size={16} className="mr-2" /> : <Bookmark size={16} className="mr-2" />}
                            {isSaved ? "Saved" : "Save Strategy"}
                         </button>
                         <button 
                            onClick={onReset}
                            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
                            title="Generate New"
                         >
                            <Search size={20} />
                         </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: The Opportunity */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-2 mb-3 text-emerald-300">
                            <TrendingUp size={18} />
                            <h3 className="font-bold text-sm uppercase tracking-wide">Top Opportunities</h3>
                        </div>
                        <ul className="space-y-2">
                            {treeData.marketAnalysis?.topOpportunities.slice(0, 3).map((opp, i) => (
                                <li key={i} className="text-sm text-slate-200 flex items-start">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-2 shrink-0"></span>
                                    {opp}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Card 2: The Why (Value Prop) */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-2 mb-3 text-yellow-300">
                            <DollarSign size={18} />
                            <h3 className="font-bold text-sm uppercase tracking-wide">Value Proposition</h3>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {treeData.marketAnalysis?.valueProposition}
                        </p>
                    </div>

                    {/* Card 3: The Leverage Skill */}
                    <div className="bg-gradient-to-br from-indigo-600/50 to-purple-600/50 border border-indigo-500/30 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-white">
                                <Zap size={18} className="fill-white" />
                                <h3 className="font-bold text-sm uppercase tracking-wide">#1 High-Leverage Skill</h3>
                            </div>
                            <div className="text-2xl font-bold text-white mb-2">{treeData.marketAnalysis?.keyLeverageSkill}</div>
                            <p className="text-xs text-indigo-100 opacity-80">Focus 80% of your effort here to maximize ROI.</p>
                        </div>
                    </div>
                </div>
             </div>
          </div>

          {/* The Tree Visualization */}
          <div className="relative max-w-4xl mx-auto px-4 pb-20">
            {/* Vertical Connector Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-slate-200 -translate-x-1/2 hidden md:block rounded-full"></div>
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-200 block md:hidden rounded-full"></div>

            <div className="space-y-12 py-6">
              {treeData.nodes.map((node, index) => {
                const isLeft = index % 2 === 0;
                const isCreate = node.strategy === 'CREATE';
                const StrategyIcon = isCreate ? PenTool : BookOpen;
                const colorClass = isCreate ? 'indigo' : 'emerald';
                const bgClass = isCreate ? 'bg-indigo-600' : 'bg-emerald-600';
                const lightBgClass = isCreate ? 'bg-indigo-50' : 'bg-emerald-50';
                const textClass = isCreate ? 'text-indigo-600' : 'text-emerald-600';
                const borderClass = isCreate ? 'border-indigo-100' : 'border-emerald-100';

                return (
                  <div key={index} className={`relative flex items-center md:justify-between ${!isLeft ? 'md:flex-row-reverse' : ''}`}>
                    
                    {/* The Node Dot */}
                    <div className={`absolute left-8 md:left-1/2 w-8 h-8 rounded-full border-4 border-white shadow-lg ${bgClass} z-10 -translate-x-1/2 flex items-center justify-center`}>
                      <span className="text-[10px] font-bold text-white">{node.step}</span>
                    </div>

                    {/* Empty Space for the other side */}
                    <div className="hidden md:block w-5/12"></div>

                    {/* The Content Card */}
                    <div className="w-[calc(100%-4rem)] ml-16 md:ml-0 md:w-5/12 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative">
                       {/* Connection Arrow (Desktop) */}
                       <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-8 h-0.5 bg-slate-200 ${isLeft ? '-right-8' : '-left-8'}`}></div>
                       
                       <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold mb-3 ${lightBgClass} ${textClass}`}>
                          <StrategyIcon size={12} className="mr-1.5" />
                          {isCreate ? 'Self-Guided Path' : 'Marketplace Path'}
                       </div>

                       <h3 className="font-bold text-slate-800 text-lg mb-1">{node.skill}</h3>
                       <p className="text-sm text-slate-500 mb-4">{node.description}</p>
                       
                       <div className={`p-4 rounded-xl border ${borderClass} ${lightBgClass} bg-opacity-50`}>
                          <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${textClass} flex items-center`}>
                            {isCreate ? 'Build to Learn' : 'Recommended Course'}
                          </h4>
                          <p className="text-sm font-medium text-slate-700 mb-3">{node.recommendation}</p>
                          
                          <button 
                             onClick={() => {
                                 if (isCreate) {
                                     // Derive difficulty based on step
                                     const diff = node.step <= 2 ? 'Beginner' : node.step <= 4 ? 'Intermediate' : 'Advanced';
                                     // Derive audience context
                                     const aud = form.currentRole ? `Fellow ${form.currentRole}s` : 'Beginners';
                                     
                                     onConfigureStudio({
                                         topic: node.skill,
                                         audience: aud,
                                         difficulty: diff
                                     });
                                     onChangeView('studio');
                                 } else {
                                     onChangeView('marketplace');
                                 }
                             }}
                             className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${isCreate ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                          >
                             {isCreate ? <PlusSquare size={16} className="mr-2" /> : <PlayCircle size={16} className="mr-2" />}
                             {isCreate ? 'Go to Studio' : 'Find in Market'}
                             <ArrowRight size={14} className="ml-auto opacity-70" />
                          </button>
                       </div>
                       
                       <div className="absolute top-6 right-6 text-xs font-bold text-slate-300 flex items-center">
                          <ClockIcon /> <span className="ml-1">{node.duration}</span>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
