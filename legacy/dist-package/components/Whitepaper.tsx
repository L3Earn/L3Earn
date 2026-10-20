
import React, { useState } from 'react';
import { ArrowLeft, Zap, Globe, Database, Cpu, Repeat, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';

interface WhitepaperProps {
  onBack: () => void;
}

// --- Visual Components (SVGs) ---

const TokenFlowChart = () => (
  <svg viewBox="0 0 800 400" className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200 shadow-sm my-6">
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
      </marker>
    </defs>
    
    {/* Central Token */}
    <circle cx="400" cy="200" r="50" fill="#eef2ff" stroke="#6366f1" strokeWidth="3" />
    <text x="400" y="205" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#4f46e5">Evolution Fuel</text>
    
    {/* Nodes */}
    <g transform="translate(400, 60)">
      <rect x="-60" y="-30" width="120" height="60" rx="10" fill="#fff" stroke="#94a3b8" strokeWidth="2" />
      <text x="0" y="5" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e293b">Active Learners</text>
    </g>

    <g transform="translate(650, 200)">
      <rect x="-60" y="-30" width="120" height="60" rx="10" fill="#fff" stroke="#94a3b8" strokeWidth="2" />
      <text x="0" y="5" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e293b">Knowledge Creators</text>
    </g>

    <g transform="translate(400, 340)">
      <rect x="-70" y="-30" width="140" height="60" rx="10" fill="#fff" stroke="#94a3b8" strokeWidth="2" />
      <text x="0" y="5" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e293b">Adaptation Pool</text>
    </g>

    <g transform="translate(150, 200)">
      <rect x="-70" y="-30" width="140" height="60" rx="10" fill="#fff" stroke="#94a3b8" strokeWidth="2" />
      <text x="0" y="5" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e293b">Industry Partners</text>
    </g>

    {/* Flows */}
    {/* Treasury -> Learner */}
    <path d="M 400 310 Q 280 300 350 100" fill="none" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="5,5" />
    <text x="290" y="250" fontSize="10" fill="#059669">Adaptation Rewards</text>

    {/* Learner -> Creator */}
    <path d="M 460 60 Q 650 60 650 160" fill="none" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrowhead)" />
    <text x="560" y="100" fontSize="10" fill="#4f46e5">Consume Knowledge</text>

    {/* Creator -> Treasury */}
    <path d="M 650 240 Q 650 340 480 340" fill="none" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrowhead)" />
    <text x="580" y="320" fontSize="10" fill="#4f46e5">Contribution</text>

    {/* Data Buyers -> Treasury */}
    <path d="M 150 240 Q 150 340 320 340" fill="none" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowhead)" />
    <text x="160" y="320" fontSize="10" fill="#059669">Grants & Funding</text>

     {/* Learner -> Data Buyers (Data Flow) */}
    <path d="M 340 60 Q 150 60 150 160" fill="none" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="5,5" />
    <text x="160" y="100" fontSize="10" fill="#d97706">Skilled Talent Stream</text>

  </svg>
);

const DataValueChart = () => (
  <svg viewBox="0 0 800 300" className="w-full h-auto bg-slate-900 rounded-xl shadow-lg my-6 border border-slate-700">
    {/* Background Grid */}
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5"/>
      </pattern>
    </defs>
    <rect width="800" height="300" fill="url(#grid)" />

    {/* Step 1: Input */}
    <g transform="translate(100, 150)">
       <circle r="40" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
       <Cpu size={30} className="text-white" x={-15} y={-15} />
       <text x="0" y="60" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold">Continuous Learning</text>
       <text x="0" y="75" textAnchor="middle" fill="#64748b" fontSize="10">(FH-DREAM Process)</text>
    </g>

    {/* Arrow 1 */}
    <path d="M 150 150 L 250 150" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="4,4" />

    {/* Step 2: Processing */}
    <g transform="translate(300, 150)">
       <rect x="-50" y="-50" width="100" height="100" rx="10" fill="#1e293b" stroke="#6366f1" strokeWidth="2" />
       <Database size={40} className="text-indigo-400" x={-20} y={-20} />
       <text x="0" y="70" textAnchor="middle" fill="#a5b4fc" fontSize="12" fontWeight="bold">Skill Restructuring</text>
       <text x="0" y="85" textAnchor="middle" fill="#64748b" fontSize="10">(Adapting to Change)</text>
    </g>

    {/* Arrow 2 */}
    <path d="M 360 150 L 460 150" stroke="#6366f1" strokeWidth="4" />

    {/* Step 3: Product */}
    <g transform="translate(510, 150)">
       <polygon points="0,-50 50,0 0,50 -50,0" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2" />
       <ShieldCheck size={30} className="text-amber-400" x={-15} y={-15} />
       <text x="0" y="70" textAnchor="middle" fill="#fcd34d" fontSize="12" fontWeight="bold">Future-Proof Human</text>
       <text x="0" y="85" textAnchor="middle" fill="#64748b" fontSize="10">(Irreplaceable)</text>
    </g>

    {/* Arrow 3 */}
    <path d="M 570 150 L 670 150" stroke="#10b981" strokeWidth="2" />

    {/* Step 4: Value */}
    <g transform="translate(720, 150)">
       <circle r="40" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
       <text x="0" y="5" textAnchor="middle" fill="#34d399" fontSize="24" fontWeight="bold">Value</text>
       <text x="0" y="60" textAnchor="middle" fill="#6ee7b7" fontSize="12" fontWeight="bold">Productivity</text>
       <text x="0" y="75" textAnchor="middle" fill="#059669" fontSize="10">(Sustainable Growth)</text>
    </g>
  </svg>
);


export const Whitepaper: React.FC<WhitepaperProps> = ({ onBack }) => {
  const [lang, setLang] = useState<'en' | 'zh'>('zh');

  const content = {
    en: {
        title: "The Protocol for Continuous Evolution",
        subtitle: "A framework to future-proof human productivity through active, verifiable learning in the age of AI.",
        missionTitle: "MISSION: EVOLVE OR BECOME OBSOLETE",
        missionText: "To evolve human productivity through continuous, active learning in the AI era, ensuring we are not rendered obsolete but empowered.",
        sections: [
            {
                title: "1. Manifesto (Abstract)",
                text: "We stand at a crossroads. The exponential growth of AI automation threatens to render passive consumers of information economically obsolete. The old model of 'learn once, work forever' is dead. L2Earn is not just a platform; it is a survival mechanism. It introduces a paradigm of 'Continuous Evolution'. By integrating the FH-DREAM cognitive engine, we empower individuals to constantly restructure their mental models, turning adaptation into a tangible asset."
            },
            {
                title: "2. Proof of Adaptation",
                text: "In a rapidly changing world, the most valuable asset is not what you know, but how fast you can learn. L2Earn verifies not just static knowledge, but 'Adaptation Velocity'. When users master new, complex domains using our framework, they generate a 'Proof of Adaptation'. This verifiable metric signals to the world that an individual is future-proof—capable of leveraging AI rather than being replaced by it."
            },
            {
                title: "3. Incentivized Evolution",
                text: "The protocol gamifies the difficult process of deep learning. We do not pay users to browse; we reward users for evolving. The 'Evolution Fuel' (tokens) serves as a metric of personal growth and a key to unlock advanced cognitive tools. It creates a culture where the pursuit of difficulty is celebrated and rewarded."
            }
        ]
    },
    zh: {
        title: "持续进化协议",
        subtitle: "一个旨在 AI 时代通过主动、可验证的学习，使人类生产力适应未来的框架。",
        missionTitle: "核心使命：进化，否则被淘汰",
        missionText: "在 AI 时代通过持续、主动的学习来进化人类生产力，确保我们掌控技术而非被其淘汰。",
        sections: [
            {
                title: "1. 宣言 (Manifesto)",
                text: "我们正处于十字路口。AI 自动化的指数级增长威胁着将“被动的信息消费者”推向经济淘汰的边缘。“一次学习，终身受用”的旧模式已经消亡。L2Earn 不仅仅是一个平台；它是一种生存机制。它引入了“持续进化”的范式。通过集成 FH-DREAM 认知引擎，我们赋予个人不断重构心智模型的能力，将适应力转化为有形的资产。"
            },
            {
                title: "2. 适应性证明 (Proof of Adaptation)",
                text: "在一个瞬息万变的世界里，最有价值的资产不是你已知什么，而是你学习得有多快。L2Earn 验证的不仅仅是静态知识，更是“适应速度”。当用户使用我们的框架掌握新的复杂领域时，他们生成了“适应性证明”。这一可验证的指标向世界发出信号：此人已适应未来——有能力驾驭 AI，而不是被 AI 取代。"
            },
            {
                title: "3. 激励进化 (Incentivized Evolution)",
                text: "本协议将深度学习这一艰难过程游戏化。我们不为用户的浏览付费，而是奖励用户的“进化”。“进化燃料”（代币）既是个人成长的度量衡，也是解锁高级认知工具的钥匙。它创造了一种文化，即追求困难、挑战自我是值得庆祝和奖励的。"
            }
        ]
    }
  };

  const t = content[lang];

  return (
    <div className="bg-slate-50 min-h-full text-slate-800 selection:bg-indigo-100 selection:text-indigo-800 animate-fade-in overflow-y-auto">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-slate-900 text-lg">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <span>L2Earn Protocol</span>
                </div>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Globe size={16} className="text-slate-500" />
                        <span>{lang === 'en' ? '中文' : 'English'}</span>
                    </button>
                    <button onClick={onBack} className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
                        <ArrowLeft size={16} className="mr-2" /> {lang === 'en' ? 'Back to App' : '返回应用'}
                    </button>
                </div>
            </div>
        </nav>

        {/* Header */}
        <header className="pt-10 pb-16 px-6 text-center bg-white border-b border-slate-200 relative overflow-hidden">
             {/* Mission Banner within Header */}
             <div className="max-w-2xl mx-auto mb-10">
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center justify-center space-x-4 animate-scale-up">
                    <div className="bg-rose-100 p-2 rounded-full text-rose-600">
                        <AlertTriangle size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">{t.missionTitle}</p>
                        <p className="text-sm font-medium text-slate-700">{t.missionText}</p>
                    </div>
                </div>
             </div>

            <div className="max-w-3xl mx-auto relative z-10">
                <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6">Manifesto v2.0</div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                    {t.title}
                </h1>
                <p className="text-xl text-slate-500 leading-relaxed">
                    {t.subtitle}
                </p>
            </div>
        </header>

        {/* Content */}
        <main className="max-w-3xl mx-auto px-6 py-16 space-y-20">

            {/* Abstract */}
            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{t.sections[0].title}</h2>
                <p className="text-lg text-slate-600 leading-relaxed text-justify">
                    {t.sections[0].text}
                </p>
            </section>

            {/* Tokenomics Visualized */}
            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <Repeat size={24} className="mr-3 text-indigo-600" />
                    {lang === 'en' ? 'Adaptation Cycle' : '适应性循环'}
                </h2>
                <p className="text-slate-600 mb-4">
                    {lang === 'en' 
                        ? 'The ecosystem fuels a continuous loop of learning, creating, and evolving.' 
                        : '该生态系统推动了学习、创造和进化的持续循环。'}
                </p>
                <TokenFlowChart />
                <div className="text-xs text-center text-slate-400 mt-2">Figure 1: The Evolution Flywheel</div>
            </section>

            {/* Data as Asset */}
            <section className="bg-slate-900 rounded-3xl p-8 md:p-12 text-slate-300 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center relative z-10">
                    <Database size={24} className="mr-3 text-emerald-400" />
                    {t.sections[1].title}
                </h2>
                
                <div className="grid grid-cols-1 gap-8 relative z-10">
                    <p className="text-lg leading-relaxed text-slate-300">
                        {t.sections[1].text}
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-emerald-400 font-bold mb-4 text-sm uppercase tracking-wider">
                            {lang === 'en' ? 'From Knowledge to Future-Proofing' : '从知识到适应未来'}
                        </h3>
                        <DataValueChart />
                        <ul className="space-y-3 text-sm mt-6">
                            <li className="flex items-start">
                                <span className="text-emerald-500 mr-2 font-bold">1. Input:</span>
                                <span>
                                    {lang === 'en' 
                                    ? 'Users engage in continuous, high-friction learning (FH-DREAM).' 
                                    : '用户参与持续、高强度的学习（FH-DREAM）。'}
                                </span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-indigo-500 mr-2 font-bold">2. Process:</span>
                                <span>
                                    {lang === 'en' 
                                    ? 'Cognitive structures are reorganized to adapt to new paradigms.' 
                                    : '认知结构重组以适应新范式。'}
                                </span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-amber-500 mr-2 font-bold">3. Output:</span>
                                <span>
                                    {lang === 'en' 
                                    ? 'A resilient, adaptable human intellect that compliments AI.' 
                                    : '一个具有弹性、适应力强、能与 AI 互补的人类智慧。'}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Tokenomics Text */}
            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <TrendingUp size={24} className="mr-3 text-indigo-600" />
                    {t.sections[2].title}
                </h2>
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-3">{lang === 'en' ? 'Mechanics' : '机制'}</h3>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                            <li><strong>Growth:</strong> {lang === 'en' ? 'Track personal evolution.' : '追踪个人进化。'}</li>
                            <li><strong>Access:</strong> {lang === 'en' ? 'Unlock advanced AI tools.' : '解锁高级 AI 工具。'}</li>
                            <li><strong>Reputation:</strong> {lang === 'en' ? 'Signal adaptability to the market.' : '向市场发出适应力信号。'}</li>
                        </ul>
                    </div>
                    <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                         <p className="text-slate-600 text-sm leading-relaxed">
                            {t.sections[2].text}
                         </p>
                    </div>
                </div>
            </section>

            {/* Architecture */}
            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">{lang === 'en' ? '4. Technical Infrastructure' : '4. 技术基础设施'}</h2>
                <div className="relative border-l-2 border-slate-200 pl-8 space-y-8">
                    <div className="relative">
                        <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-white border-4 border-indigo-600"></div>
                        <h3 className="font-bold text-slate-800">Layer 1: Identity & Profile</h3>
                        <p className="text-sm text-slate-600 mt-1">Supabase {lang === 'en' ? 'manages your evolution portfolio.' : '管理您的进化组合。'}</p>
                    </div>
                    <div className="relative">
                        <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-white border-4 border-violet-500"></div>
                        <h3 className="font-bold text-slate-800">Layer 2: The Cognitive Engine (AI)</h3>
                        <p className="text-sm text-slate-600 mt-1">Google Gemini API {lang === 'en' ? 'facilitates the FH-DREAM learning cycle.' : '促进 FH-DREAM 学习循环。'}</p>
                    </div>
                    <div className="relative">
                        <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-white border-4 border-emerald-500"></div>
                        <h3 className="font-bold text-slate-800">Layer 3: Verification</h3>
                        <p className="text-sm text-slate-600 mt-1">Optimism / Arbitrum (L2) {lang === 'en' ? 'secures your Proof of Adaptation.' : '保障您的适应性证明。'}</p>
                    </div>
                </div>
            </section>

        </main>

        <footer className="bg-slate-50 border-t border-slate-200 py-12 text-center text-slate-500 text-sm">
            <p>&copy; 2024 L2Earn Foundation. All rights reserved.</p>
        </footer>
    </div>
  );
};
