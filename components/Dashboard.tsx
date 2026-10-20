
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, BookOpen, DollarSign, Award, Sparkles, Briefcase, Map, ArrowRight, Loader2, Target, Eye, EyeOff, Zap, AlertTriangle } from 'lucide-react';

const data = [
  { name: 'Mon', earnings: 12, learning: 45 },
  { name: 'Tue', earnings: 18, learning: 60 },
  { name: 'Wed', earnings: 15, learning: 30 },
  { name: 'Thu', earnings: 25, learning: 90 },
  { name: 'Fri', earnings: 32, learning: 45 },
  { name: 'Sat', earnings: 45, learning: 120 },
  { name: 'Sun', earnings: 50, learning: 100 },
];

interface DashboardProps {
  state: {
    form: { role: string; goal: string; interests: string };
    path: string | null;
    isGenerating: boolean;
  };
  onFormChange: (field: string, value: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  onNavigateToTree: () => void;
}

const StatCard = ({ icon: Icon, title, value, sub, color }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start space-x-4">
    <div className={`p-3 rounded-xl ${color} text-white shadow-md`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center">
        <TrendingUp size={12} className="mr-1" /> {sub}
      </p>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ state, onFormChange, onGenerate, onReset, onNavigateToTree }) => {
  const { form, path, isGenerating } = state;
  const [showWidgets, setShowWidgets] = useState(true);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Mission Banner */}
      <div className="bg-gradient-to-r from-rose-600 to-orange-600 rounded-xl p-4 text-white shadow-lg flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="flex items-center space-x-4 relative z-10">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <AlertTriangle size={24} className="text-white" />
            </div>
            <div>
                <h3 className="font-bold text-lg leading-tight">Adapt or Become Obsolete</h3>
                <p className="text-white/90 text-sm font-medium">In the AI age, passive consumption is a risk. Active evolution is your only safety net.</p>
            </div>
        </div>
        <button className="hidden sm:block px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-bold transition-colors border border-white/20">
            Start Evolving
        </button>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome back, Alex</h2>
          <p className="text-slate-500">You've generated <span className="font-semibold text-emerald-600">$197.00</span> in value this week by evolving your skills.</p>
        </div>
        <div className="flex items-center space-x-3">
             <button 
                onClick={() => setShowWidgets(!showWidgets)}
                className="flex items-center space-x-2 bg-white text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 border border-slate-200 transition-colors"
             >
                {showWidgets ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showWidgets ? "Hide Widgets" : "Show Widgets"}</span>
             </button>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
              Redeem Value
            </button>
        </div>
      </div>

      {showWidgets && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            <StatCard icon={Zap} title="Evolution Value" value="$1,240.50" sub="+12.5% vs last week" color="bg-emerald-500" />
            <StatCard icon={BookOpen} title="Hours Learned" value="34.5 hrs" sub="Top 5% of learners" color="bg-indigo-500" />
            <StatCard icon={Award} title="Knowledge Assets" value="12 Published" sub="3 Trending" color="bg-violet-500" />
            <StatCard icon={TrendingUp} title="Adaptability Score" value="89/100" sub="High resilience" color="bg-rose-500" />
          </div>
      )}

      {/* AI Career Architect Section */}
      {showWidgets && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl animate-fade-in">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <div className="inline-flex items-center px-3 py-1 bg-white/10 rounded-full border border-white/10 text-xs font-bold text-yellow-300 mb-3">
                            <Sparkles size={12} className="mr-1.5" />
                            New Feature
                        </div>
                        <h3 className="text-2xl font-bold mb-2 flex items-center">AI Career Architect</h3>
                        <p className="text-indigo-200 text-sm leading-relaxed">
                            Don't just learn randomly. Let our AI analyze market trends to build a future-proof career roadmap tailored specifically for you.
                        </p>
                    </div>

                    <div className="space-y-4 bg-white/5 p-5 rounded-xl border border-white/10 backdrop-blur-sm">
                        <div>
                            <label className="block text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1.5">Current Role</label>
                            <div className="relative">
                                <Briefcase size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={form.role}
                                    onChange={(e) => onFormChange('role', e.target.value)}
                                    placeholder="e.g. Junior Frontend Dev" 
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-600 transition-all"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1.5">Target Goal</label>
                                <div className="relative">
                                    <Target size={16} className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={form.goal}
                                        onChange={(e) => onFormChange('goal', e.target.value)}
                                        placeholder="e.g. Tech Lead" 
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-600 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1.5">Interests</label>
                                <div className="relative">
                                    <Map size={16} className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={form.interests}
                                        onChange={(e) => onFormChange('interests', e.target.value)}
                                        placeholder="e.g. AI, 3D" 
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-600 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={onGenerate}
                            disabled={isGenerating || !form.role || !form.goal}
                            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? <Loader2 size={18} className="animate-spin mr-2"/> : <Sparkles size={18} className="mr-2 fill-white/20" />}
                            {isGenerating ? "Designing Path..." : "Generate My Roadmap"}
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white/90 backdrop-blur-md rounded-xl p-6 text-slate-800 border border-white/20 min-h-[300px] flex flex-col relative shadow-inner">
                    {!path ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60">
                            <Map size={48} className="mb-4 text-slate-300" />
                            <p className="text-center text-sm font-medium">Enter your career details on the left<br/>to reveal your personalized path to success.</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in flex-1 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-4">
                                <div>
                                    <h4 className="font-bold text-lg text-indigo-900">Your Strategic Roadmap</h4>
                                    <p className="text-xs text-slate-500">Based on market analysis for {form.role} → {form.goal}</p>
                                </div>
                                <button onClick={onReset} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Reset</button>
                            </div>
                            <div className="prose prose-sm prose-slate max-w-none prose-p:text-slate-600 prose-headings:text-slate-800 prose-strong:text-indigo-700 prose-li:marker:text-emerald-500">
                                {/* Simple markdown rendering logic - in production use react-markdown */}
                                {path.split('\n').map((line, i) => {
                                    if (line.startsWith('##')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-indigo-800">{line.replace('##', '')}</h3>;
                                    if (line.startsWith('**')) return <p key={i} className="font-bold my-2">{line.replace(/\*\*/g, '')}</p>;
                                    if (line.trim().startsWith('-')) return <li key={i} className="ml-4 mb-1">{line.replace('-', '')}</li>;
                                    return <p key={i} className="mb-2">{line}</p>;
                                })}
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                                <button 
                                    onClick={onNavigateToTree}
                                    className="flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg"
                                >
                                    Save to Learning Plan <ArrowRight size={16} className="ml-1" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Value Generation & Learning Activity</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorEarn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLearn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Area type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEarn)" name="Value ($)" />
                <Area type="monotone" dataKey="learning" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLearn)" name="Learning (min)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Your Top Performing Insights</h3>
          <div className="space-y-4">
            {[
              { title: "React Hooks Simplified", views: "1.2k", earn: "$45.00" },
              { title: "Understanding Gemini API", views: "980", earn: "$32.50" },
              { title: "CSS Grid vs Flexbox", views: "850", earn: "$21.00" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                <div>
                  <h4 className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                  <p className="text-xs text-slate-400">{item.views} learners helped</p>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-emerald-600">{item.earn}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors">
            View All Insights
          </button>
        </div>
      </div>
    </div>
  );
};
