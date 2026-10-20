
import React from 'react';
import { ArrowRight, Zap, BrainCircuit, Network, ShieldCheck, TrendingUp, PlayCircle, Lock } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onReadManifesto: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn, onReadManifesto }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full z-50 relative">
        <div className="flex items-center space-x-2 font-bold text-xl tracking-tight">
           <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Zap size={20} fill="currentColor" className="text-white" />
           </div>
           <span>L2Earn</span>
        </div>
        <div className="flex items-center space-x-6">
           <button onClick={onReadManifesto} className="hidden md:block text-sm font-medium text-slate-400 hover:text-white transition-colors">Manifesto</button>
           <button onClick={onSignIn} className="text-sm font-bold text-white hover:text-indigo-300 transition-colors">Sign In</button>
           <button 
             onClick={onGetStarted}
             className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-lg hover:shadow-white/10"
           >
             Get Started
           </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-32 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
           <div className="inline-flex items-center px-3 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-rose-500 mr-2 animate-pulse"></span>
              Mission: Evolve or Obsolete
           </div>
           
           <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              The Era of <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 animate-gradient-x">Passive Learning</span> is Over.
           </h1>
           
           <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              AI automates the average. <strong>L2Earn</strong> is the cognitive engine designed to build the one thing AI cannot replace: 
              <span className="text-white font-semibold"> Deep, Adaptive Human Intelligence.</span>
           </p>

           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onGetStarted}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex items-center group w-full sm:w-auto justify-center"
              >
                Start Evolution
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => {
                    const el = document.getElementById('how-it-works');
                    el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-bold text-lg hover:bg-slate-700 transition-all border border-slate-700 w-full sm:w-auto justify-center"
              >
                How it Works
              </button>
           </div>
        </div>
      </header>

      {/* Feature Grid (The Solution) */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-800/50 border-y border-white/5">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-bold mb-4">The Protocol for Continuous Evolution</h2>
               <p className="text-slate-400">Three layers to future-proof your productivity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Card 1 */}
               <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-colors group">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                     <TrendingUp size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">AI Career Architect</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                     Don't guess what to learn. Our AI analyzes global job markets in real-time to generate a high-ROI learning roadmap tailored to your goals.
                  </p>
               </div>

               {/* Card 2 */}
               <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 hover:border-violet-500/50 transition-colors group">
                  <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform">
                     <BrainCircuit size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">FH-DREAM Engine</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                     Passive video watching is dead. Engage with the 7-step cognitive cycle: Focus, Head First Visualization, Feynman Validation, and Mastery.
                  </p>
               </div>

               {/* Card 3 */}
               <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 hover:border-emerald-500/50 transition-colors group">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                     <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Proof of Adaptation</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                     Mint your new skills as verifiable "Knowledge Blocks" on-chain. Turn your adaptability into a liquid asset that employers trust.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Demo / Preview Section */}
      <section className="py-24 px-6 overflow-hidden">
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
               <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
                  Deep Learning Tech
               </div>
               <h2 className="text-4xl font-bold mb-6 leading-tight">
                  Stop Watching. <br />
                  <span className="text-indigo-400">Start Structuring.</span>
               </h2>
               <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                  Our <strong>Creator Studio</strong> doesn't just generate text. It builds interactive <strong>Knowledge Maps (RRTrees)</strong> and <strong>Visual Metaphors</strong> that force your brain to encode information deeply.
               </p>
               
               <div className="space-y-4">
                  {[
                     "Auto-generate visual analogies for complex topics",
                     "Interactive Feynman Technique quizzes",
                     "Market value analysis for every skill",
                     "Export knowledge as commercial assets"
                  ].map((item, i) => (
                     <div key={i} className="flex items-center text-slate-300">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center mr-3 shrink-0">
                           <ShieldCheck size={14} className="text-emerald-500" />
                        </div>
                        {item}
                     </div>
                  ))}
               </div>
            </div>

            <div className="relative">
               {/* Decorative blobs */}
               <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-[2rem] opacity-20 blur-xl animate-pulse"></div>
               
               {/* Mock UI */}
               <div className="relative bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden aspect-[4/3] group">
                  <div className="absolute top-0 left-0 right-0 h-10 bg-slate-800 border-b border-slate-700 flex items-center px-4 space-x-2">
                     <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
                     <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                     <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                  </div>
                  
                  {/* Internal Mock Content */}
                  <div className="p-8 mt-6 grid grid-cols-2 gap-6 h-full opacity-80 group-hover:opacity-100 transition-opacity">
                      <div className="space-y-4">
                          <div className="h-8 w-3/4 bg-slate-700 rounded-lg"></div>
                          <div className="h-4 w-full bg-slate-800 rounded"></div>
                          <div className="h-4 w-5/6 bg-slate-800 rounded"></div>
                          <div className="h-32 w-full bg-indigo-900/30 border border-indigo-500/30 rounded-xl flex items-center justify-center">
                              <Network className="text-indigo-500" size={32} />
                          </div>
                      </div>
                      <div className="space-y-3">
                          <div className="h-20 w-full bg-slate-800 rounded-xl"></div>
                          <div className="h-20 w-full bg-slate-800 rounded-xl"></div>
                          <div className="h-20 w-full bg-slate-800 rounded-xl"></div>
                      </div>
                  </div>

                  {/* Floating Badge */}
                  <div className="absolute bottom-6 right-6 bg-white text-slate-900 px-4 py-2 rounded-lg font-bold shadow-lg flex items-center animate-bounce">
                      <PlayCircle size={16} className="mr-2 text-indigo-600" /> Live Demo
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-24 px-6 text-center border-t border-white/5 bg-slate-900">
         <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to evolve your productivity?</h2>
            <p className="text-slate-400 mb-10 text-lg">Join the protocol that turns your learning curve into your earning curve.</p>
            <button 
                onClick={onGetStarted}
                className="px-10 py-4 bg-white text-indigo-900 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition-colors shadow-xl shadow-white/10"
            >
                Launch App
            </button>
            <p className="mt-8 text-sm text-slate-600">
                &copy; 2024 L2Earn Protocol. Built for the Post-AI Economy.
            </p>
         </div>
      </footer>

    </div>
  );
};
