
import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, ChevronLeft, Share2, Sparkles, CheckCircle, FileText, Lock, Check, Award, ArrowRight, RotateCcw, XCircle, Volume2, Maximize2, MoreVertical, Bookmark, Network, Zap, ChevronDown, ChevronRight, Circle, Loader2 } from 'lucide-react';
import { polishInsight } from '../services/geminiService';
import { AiTutor } from './AiTutor';
import { LessonContent, RRTreeNode, CourseModule, QuizQuestion } from '../types';

// --- TYPES ---
interface DemoModuleData {
  svg: string;
  tree: RRTreeNode;
  quiz: QuizQuestion[];
}

// --- CONTENT DATABASE ---

// 1. REACT PATTERNS CONTENT
const REACT_CONTENT: Record<string, DemoModuleData> = {
  '1-1': { // Intro to Patterns
    svg: `
      <svg width="100%" height="100%" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
        <defs>
           <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="800" height="500" fill="white"/>
        <rect width="800" height="500" fill="url(#grid)"/>
        
        <!-- Central Hub -->
        <circle cx="400" cy="250" r="60" fill="#eff6ff" stroke="#3b82f6" stroke-width="3"/>
        <text x="400" y="255" text-anchor="middle" font-family="monospace" font-weight="bold" fill="#1e40af">React Core</text>
        
        <!-- Satellites -->
        <g transform="translate(400, 100)">
           <rect x="-60" y="-30" width="120" height="60" rx="8" fill="#f0f9ff" stroke="#0ea5e9" stroke-width="2"/>
           <text x="0" y="5" text-anchor="middle" font-size="12" fill="#0369a1">Composition</text>
        </g>
        <line x1="400" y1="190" x2="400" y2="130" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="5,5"/>

        <g transform="translate(600, 250)">
           <rect x="-60" y="-30" width="120" height="60" rx="8" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="2"/>
           <text x="0" y="5" text-anchor="middle" font-size="12" fill="#5b21b6">Data Flow</text>
        </g>
        <line x1="460" y1="250" x2="540" y2="250" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="5,5"/>

        <g transform="translate(200, 250)">
           <rect x="-60" y="-30" width="120" height="60" rx="8" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
           <text x="0" y="5" text-anchor="middle" font-size="12" fill="#047857">Reusability</text>
        </g>
        <line x1="340" y1="250" x2="260" y2="250" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="5,5"/>
      </svg>
    `,
    tree: {
      id: "root", label: "Design Patterns in React", type: "root", content: "Standardized solutions to common software design problems in a React context.",
      children: [
        { id: "c1", label: "Why Patterns?", type: "concept", content: "Patterns provide a shared vocabulary and proven reliability.", children: [
           { id: "d1", label: "Maintainability", type: "detail", content: "Code becomes easier to read and update." },
           { id: "d2", label: "Scalability", type: "detail", content: "Architecture grows without collapsing." }
        ]},
        { id: "c2", label: "Categories", type: "concept", content: "Types of React patterns.", children: [
           { id: "e1", label: "Presentational vs Container", type: "example", content: "Separating logic from UI." },
           { id: "e2", label: "Compound Components", type: "example", content: "Components that work together (like Select and Option)." }
        ]}
      ]
    },
    quiz: [
      { question: "What is the primary goal of using design patterns?", options: ["To make code look complex", "To solve common problems with proven solutions", "To increase bundle size", "To use the latest syntax"], correctAnswer: 1 },
      { question: "Which pattern separates Logic from UI?", options: ["Provider Pattern", "Container/Presentational", "HOC", "Render Props"], correctAnswer: 1 },
      { question: "Are patterns specific to React only?", options: ["Yes", "No, they are universal concepts adapted for React", "Only for JavaScript", "Only for Frontend"], correctAnswer: 1 }
    ]
  },
  '1-2': { // HOCs (The original demo)
    svg: `
      <svg width="100%" height="100%" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#grad1)"/>
        
        <g transform="translate(400, 250)">
          <circle r="90" fill="none" stroke="#6366f1" stroke-width="2" stroke-dasharray="10,5"/>
          <circle r="80" fill="#6366f1" opacity="0.1"/>
          <text x="0" y="5" text-anchor="middle" font-family="system-ui" font-weight="bold" fill="#312e81" font-size="16">HOC Wrapper</text>
        </g>
        
        <path d="M400,160 L400,100" stroke="#cbd5e1" stroke-width="2" marker-end="url(#arrow)"/>
        <g transform="translate(400, 80)">
          <rect x="-80" y="-30" width="160" height="60" rx="10" fill="white" stroke="#94a3b8"/>
          <text x="0" y="5" text-anchor="middle" font-family="system-ui" fill="#475569" font-size="14">Input: Component</text>
        </g>

        <path d="M400,340 L400,400" stroke="#cbd5e1" stroke-width="2" marker-end="url(#arrow)"/>
        <g transform="translate(400, 430)">
          <rect x="-80" y="-30" width="160" height="60" rx="10" fill="white" stroke="#94a3b8"/>
          <text x="0" y="5" text-anchor="middle" font-family="system-ui" fill="#475569" font-size="14">Result: Enhanced Comp</text>
        </g>
        
        <g transform="translate(200, 250)">
          <text x="0" y="0" text-anchor="middle" font-family="monospace" fill="#64748b" font-size="12">Inject Props</text>
          <line x1="50" y1="0" x2="110" y2="0" stroke="#64748b" stroke-width="1"/>
        </g>
      </svg>
    `,
    tree: {
      id: "root", label: "Higher-Order Components (HOCs)", type: "root", content: "A function that takes a component and returns a new component.",
      children: [
        { id: "c1", label: "Core Concept", type: "concept", content: "Code reuse through component composition.", children: [
          { id: "d1", label: "Pure Function", type: "detail", content: "Does not modify the input component." },
          { id: "d2", label: "Props Proxy", type: "detail", content: "Manipulates props before passing them down." }
        ]},
        { id: "c2", label: "Use Cases", type: "concept", content: "When to use HOCs.", children: [
          { id: "e1", label: "Authentication", type: "example", content: "withAuth(ProfilePage)" },
          { id: "e2", label: "Logging", type: "example", content: "withLogger(Button)" }
        ]}
      ]
    },
    quiz: [
      { question: "What is a Higher-Order Component (HOC)?", options: ["A component that returns a function", "A function that takes a component and returns a new component", "A standard React Hook", "A component found at the top of the render tree"], correctAnswer: 1 },
      { question: "Which is NOT a common use case for HOCs?", options: ["Props Manipulation", "State Abstraction", "Render Hijacking", "Direct DOM Mutation"], correctAnswer: 3 },
      { question: "In `const Enhanced = withSubscription(CommentList)`, what is `withSubscription`?", options: ["The wrapped component", "The HOC", "The prop", "The state manager"], correctAnswer: 1 }
    ]
  },
  '1-4': { // Custom Hooks
     svg: `
      <svg width="100%" height="100%" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="500" fill="#f8fafc"/>
        <!-- Logic Extraction Metaphor -->
        <g transform="translate(250, 250)">
           <rect x="-100" y="-150" width="200" height="300" rx="10" fill="white" stroke="#cbd5e1" stroke-width="2"/>
           <text x="0" y="-120" text-anchor="middle" font-weight="bold" fill="#334155">Component A</text>
           <rect x="-80" y="-80" width="160" height="40" rx="4" fill="#fee2e2" stroke="#fca5a5"/>
           <text x="0" y="-55" text-anchor="middle" font-size="10" fill="#b91c1c">UI Logic</text>
           <!-- The Hole -->
           <path d="M -80 20 Q 0 20 80 20 L 80 100 Q 0 100 -80 100 Z" fill="#f1f5f9" stroke="#94a3b8" stroke-dasharray="4"/>
           <text x="0" y="65" text-anchor="middle" font-size="10" fill="#94a3b8">Logic Extracted</text>
        </g>
        
        <!-- The Hook -->
        <g transform="translate(550, 250)">
           <path d="M -60 -40 L 60 -40 L 60 40 L -60 40 Z" fill="#dbeafe" stroke="#3b82f6" stroke-width="3"/>
           <text x="0" y="5" text-anchor="middle" font-weight="bold" fill="#1e40af">useCustomHook()</text>
           <circle cx="0" cy="-60" r="10" fill="#3b82f6"/>
           <line x1="0" y1="-60" x2="0" y2="-40" stroke="#3b82f6" stroke-width="2"/>
        </g>
        
        <!-- Connection -->
        <path d="M 450 250 L 490 250" stroke="#3b82f6" stroke-width="2" marker-end="url(#arrow)"/>
      </svg>
     `,
     tree: {
       id: "root", label: "Custom Hooks", type: "root", content: "JavaScript functions that start with 'use' and can call other Hooks.",
       children: [
         { id: "c1", label: "Purpose", type: "concept", content: "To share stateful logic between components.", children: [
            { id: "d1", label: "Not UI Sharing", type: "detail", content: "Unlike HOCs/Render Props, Hooks share STATE logic, not UI." },
            { id: "d2", label: "Simplicity", type: "detail", content: "Avoids 'Wrapper Hell' in the DOM." }
         ]},
         { id: "c2", label: "Rules", type: "concept", content: "Rules of Hooks apply.", children: [
            { id: "e1", label: "Top Level Only", type: "detail", content: "Don't call inside loops or conditions." },
            { id: "e2", label: "React Functions Only", type: "detail", content: "Call from React components or other hooks." }
         ]}
       ]
     },
     quiz: [
       { question: "What must a custom hook name start with?", options: ["get", "use", "hook", "react"], correctAnswer: 1 },
       { question: "Do two components using the same hook share state?", options: ["Yes, global state", "No, state is isolated to each component", "Only if wrapped in a Provider", "Yes, if defined in App.js"], correctAnswer: 1 },
       { question: "Custom Hooks primarily allow you to reuse:", options: ["JSX", "CSS", "Stateful Logic", "Event Listeners only"], correctAnswer: 2 }
     ]
  }
};

// 2. NARRATIVE MECHANICS CONTENT
const STORY_CONTENT: Record<string, DemoModuleData> = {
  '99-1': { // Anatomy of Story
    svg: `
      <svg width="100%" height="100%" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
         <defs>
           <style>@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap'); .hand { font-family: 'Patrick Hand', cursive; }</style>
         </defs>
         <rect width="800" height="500" fill="#f8f5f2"/>
         
         <!-- Body Metaphor: Davinci style sketch -->
         <g transform="translate(400, 250)">
            <path d="M 0 -180 L 0 180" stroke="#4b5563" stroke-width="4" stroke-linecap="round"/> <!-- Spine -->
            <line x1="-120" y1="-100" x2="120" y2="-100" stroke="#4b5563" stroke-width="4" stroke-linecap="round"/> <!-- Shoulders -->
            <line x1="-100" y1="100" x2="100" y2="100" stroke="#4b5563" stroke-width="4" stroke-linecap="round"/> <!-- Hips -->
            
            <!-- Head: Premise -->
            <circle cx="0" cy="-200" r="50" fill="#fef9c3" stroke="#4b5563" stroke-width="3"/>
            <text x="0" y="-195" text-anchor="middle" font-size="20" class="hand">The Premise</text>
            <text x="0" y="-175" text-anchor="middle" font-size="12" class="hand" fill="#666">"Controlling Idea"</text>
            
            <!-- Heart: Theme -->
            <path d="M 0 -60 C -40 -100 -100 -40 0 40 C 100 -40 40 -100 0 -60" fill="#fecaca" stroke="#dc2626" stroke-width="3"/>
            <text x="0" y="-30" text-anchor="middle" font-size="16" fill="#7f1d1d" class="hand" font-weight="bold">THEME</text>
            
            <!-- Skeleton: Plot -->
            <rect x="-140" y="-120" width="80" height="300" rx="10" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="10,5"/> 
            <text x="-180" y="0" text-anchor="middle" fill="#3b82f6" font-size="18" class="hand" transform="rotate(-90 -180 0)">STRUCTURE</text>
            
            <!-- Nervous System: Character -->
            <path d="M 140 -120 Q 200 0 140 180" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"/> 
            <text x="180" y="30" text-anchor="middle" fill="#10b981" font-size="14" class="hand">Character Arc</text>
         </g>
         
         <text x="400" y="450" text-anchor="middle" class="hand" font-size="24" fill="#4b5563">"A story is an ORGANISM, not a machine."</text>
      </svg>
    `,
    tree: {
      id: "root", label: "The Anatomy of Story", type: "root", content: "A story is an organic system, not a machine.",
      children: [
        { id: "c1", label: "The Premise (Head)", type: "concept", content: "The controlling idea. The 'What If'.", children: [
           { id: "d1", label: "High Concept", type: "detail", content: "Easily communicable premise (e.g., Jurassic Park)." }
        ]},
        { id: "c2", label: "The Theme (Heart)", type: "concept", content: "The moral argument the story makes.", children: [
           { id: "d2", label: "Value Conflict", type: "detail", content: "Not Good vs Evil, but Good vs Good (e.g. Loyalty vs Truth)." }
        ]},
        { id: "c3", label: "Character (Blood)", type: "concept", content: "Structure is Character.", children: []}
      ]
    },
    quiz: [
       { question: "What represents the 'Heart' of a story anatomy?", options: ["The Plot", "The Theme/Moral Argument", "The Hero", "The Dialogue"], correctAnswer: 1 },
       { question: "A good premise is often described as:", options: ["Long and complex", "A 'What If' question", "A character list", "The ending"], correctAnswer: 1 },
       { question: "Structure is:", options: ["Character", "Formulas", "Page numbers", "Genre"], correctAnswer: 0 }
    ]
  },
  '99-2': { // Conflict & Suspense (The Hitchcock Bomb)
    svg: `
      <svg width="100%" height="100%" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap'); .hand { font-family: 'Patrick Hand', cursive; }</style>
        </defs>
        <rect width="800" height="500" fill="#1e1e24"/>
        
        <!-- The Table Scene -->
        <g transform="translate(400, 200)">
           <!-- Table -->
           <rect x="-200" y="0" width="400" height="20" fill="#8d6e63" stroke="#5d4037" stroke-width="2"/>
           <rect x="-180" y="20" width="20" height="150" fill="#8d6e63"/>
           <rect x="160" y="20" width="20" height="150" fill="#8d6e63"/>
           
           <!-- People -->
           <circle cx="-100" cy="-50" r="30" fill="#e0e7ff" stroke="white" stroke-width="2"/>
           <text x="-100" y="-80" text-anchor="middle" fill="white" class="hand" font-size="14">Talking about Baseball</text>
           
           <circle cx="100" cy="-50" r="30" fill="#e0e7ff" stroke="white" stroke-width="2"/>
           
           <!-- The BOMB -->
           <g transform="translate(0, 100)">
              <circle cx="0" cy="0" r="40" fill="#1e1e24" stroke="#ef4444" stroke-width="4"/>
              <path d="M 0 -40 L 20 -70" stroke="#fbbf24" stroke-width="3"/>
              <circle cx="20" cy="-70" r="5" fill="#fbbf24" class="animate-pulse"/>
              <text x="0" y="10" text-anchor="middle" fill="#ef4444" font-family="monospace" font-weight="bold" font-size="20">00:05</text>
           </g>
           
           <!-- Annotations -->
           <path d="M -150 -100 L -250 -150" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5,5"/>
           <text x="-260" y="-160" text-anchor="middle" fill="#94a3b8" class="hand" font-size="18">Surface Text</text>
           
           <path d="M 50 100 L 150 150" stroke="#ef4444" stroke-width="2"/>
           <text x="180" y="170" text-anchor="middle" fill="#ef4444" class="hand" font-size="18" font-weight="bold">SUSPENSE</text>
        </g>
        
        <text x="400" y="450" text-anchor="middle" fill="white" class="hand" font-size="20">"The audience knows, but the characters don't." - Hitchcock</text>
      </svg>
    `,
    tree: {
      id: "root", label: "Conflict vs Suspense", type: "root", content: "Conflict is the engine; Suspense is the fuel.",
      children: [
        { id: "c1", label: "Mystery vs Suspense", type: "concept", content: "Knowledge Hierarchy.", children: [
          { id: "d1", label: "Mystery", type: "detail", content: "Character knows more than Audience (Curiosity)." },
          { id: "d2", label: "Suspense", type: "detail", content: "Audience knows more than Character (Anxiety)." }
        ]},
        { id: "c2", label: "The Time Bomb", type: "concept", content: "Hitchcock's Rule.", children: [
           { id: "d3", label: "Boredom", type: "example", content: "Two people talking about baseball for 5 mins." },
           { id: "d4", label: "Terror", type: "example", content: "Same talk, but we see a bomb under the table." }
        ]}
      ]
    },
    quiz: [
      { question: "What is the key ingredient for Suspense?", options: ["A loud explosion", "Superior knowledge (The audience knows more)", "A hidden villain", "Fast editing"], correctAnswer: 1 },
      { question: "If the character knows more than the audience, it creates:", options: ["Suspense", "Mystery/Curiosity", "Boredom", "Horror"], correctAnswer: 1 },
      { question: "In the 'Bomb' metaphor, the conversation about baseball represents:", options: ["The subtext", "The surface text", "The climax", "The resolution"], correctAnswer: 1 }
    ]
  },
  '99-3': { // Will vs Environment (The Gap)
     svg: `
      <svg width="100%" height="100%" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap'); .hand { font-family: 'Patrick Hand', cursive; }</style>
        </defs>
        <rect width="800" height="500" fill="#f0f9ff"/>
        
        <!-- The Cliff Scene -->
        <path d="M 0 300 L 300 300 L 300 500 L 0 500 Z" fill="#334155"/> <!-- Left Cliff -->
        <path d="M 500 200 L 800 200 L 800 500 L 500 500 Z" fill="#334155"/> <!-- Right Cliff -->
        
        <!-- The GAP -->
        <text x="400" y="400" text-anchor="middle" class="hand" font-size="30" font-weight="bold" fill="#94a3b8">THE GAP</text>
        <text x="400" y="430" text-anchor="middle" class="hand" font-size="14" fill="#64748b">Expectation vs Reality</text>
        
        <!-- Character -->
        <g transform="translate(250, 280)">
           <circle cx="0" cy="-20" r="10" fill="none" stroke="black" stroke-width="2"/>
           <line x1="0" y1="-10" x2="0" y2="20" stroke="black" stroke-width="2"/>
           <line x1="0" y1="20" x2="-10" y2="40" stroke="black" stroke-width="2"/>
           <line x1="0" y1="20" x2="10" y2="40" stroke="black" stroke-width="2"/>
           <line x1="-10" y1="0" x2="10" y2="0" stroke="black" stroke-width="2"/>
           
           <!-- Thought Bubble -->
           <path d="M 10 -30 Q 30 -50 50 -30 Q 70 -30 70 -10 L 50 10 L 20 0 Z" fill="white" stroke="black"/>
           <text x="40" y="-15" text-anchor="middle" font-size="10" class="hand">"Easy Jump!"</text>
        </g>
        
        <!-- Goal -->
        <g transform="translate(600, 180)">
           <path d="M 0 0 L 10 -20 L 20 0 Z" fill="#fbbf24" stroke="#d97706"/>
           <text x="10" y="-30" text-anchor="middle" class="hand" font-weight="bold">GOAL</text>
        </g>
        
        <!-- Action Arrow -->
        <path d="M 280 280 Q 400 100 550 200" fill="none" stroke="#ef4444" stroke-width="3" stroke-dasharray="5,5"/>
        <text x="400" y="150" text-anchor="middle" fill="#ef4444" class="hand" font-size="18" font-weight="bold">RISK</text>
      </svg>
     `,
     tree: {
         id: "root", label: "The Gap", type: "root", content: "The fundamental substance of story is the gap between expectation and result.",
         children: [
             { id: "c1", label: "Subjective Expectation", type: "concept", content: "The character believes the world works a certain way.", children: []},
             { id: "c2", label: "Objective Reality", type: "concept", content: "The world pushes back with 'No'.", children: [
                 { id: "d1", label: "Surprise", type: "detail", content: "The reaction to the Gap." },
                 { id: "d2", label: "Adjustment", type: "detail", content: "Character must change strategy." }
             ]}
         ]
     },
     quiz: [
         { question: "What creates 'The Gap'?", options: ["Bad writing", "The difference between what a character expects and what actually happens", "A plot hole", "The ending"], correctAnswer: 1 },
         { question: "How must a character respond to The Gap?", options: ["Give up", "Ignore it", "Adjust their strategy / Change", "Complain"], correctAnswer: 2 },
         { question: "If there is no Gap, there is no:", options: ["Dialogue", "Setting", "Story/Conflict", "Music"], correctAnswer: 2 }
     ]
  },
  '99-4': { // The Cost of Ideals
    svg: `
      <svg width="100%" height="100%" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
         <defs>
           <style>@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap'); .hand { font-family: 'Patrick Hand', cursive; }</style>
         </defs>
         <rect width="800" height="500" fill="#271a1a"/>
         
         <!-- Merchant Scale Scene -->
         <g transform="translate(400, 400)">
            <!-- The Scale -->
            <path d="M 0 0 L 0 -280" stroke="#d4d4d8" stroke-width="4" stroke-linecap="round"/>
            <path d="M -220 -280 L 220 -280" stroke="#d4d4d8" stroke-width="4" stroke-linecap="round"/>
            
            <!-- Left Pan (Ideal) - HIGH UP -->
            <line x1="-220" y1="-280" x2="-220" y2="-150" stroke="#a1a1aa" stroke-width="2"/>
            <path d="M -260 -150 Q -220 -110 -180 -150" fill="#3f3f46" stroke="#a1a1aa" stroke-width="2"/>
            
            <!-- The Ideal Object -->
            <g transform="translate(-220, -180)">
               <polygon points="0,-30 10,-10 30,-10 15,5 20,25 0,15 -20,25 -15,5 -30,-10 -10,-10" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
               <text x="0" y="50" text-anchor="middle" fill="#fbbf24" class="hand" font-size="16">Justice</text>
            </g>
            
            <!-- Right Pan (Cost) - WEIGHED DOWN -->
            <line x1="220" y1="-280" x2="220" y2="-50" stroke="#a1a1aa" stroke-width="2"/>
            <path d="M 180 -50 Q 220 -10 260 -50" fill="#3f3f46" stroke="#a1a1aa" stroke-width="2"/>
            
            <!-- The Cost Objects -->
            <g transform="translate(220, -70)">
               <rect x="-15" y="0" width="30" height="20" fill="#ef4444" stroke="#b91c1c"/>
               <text x="0" y="40" text-anchor="middle" fill="#fca5a5" class="hand" font-size="16">Pain/Blood</text>
            </g>
            
            <text x="0" y="-320" text-anchor="middle" fill="#e4e4e7" class="hand" font-size="24">"Everything has a Price"</text>
         </g>
      </svg>
    `,
    tree: {
      id: "root", label: "The Cost of Ideals", type: "root", content: "Value is determined by what one is willing to sacrifice for it.",
      children: [
        { id: "c1", label: "Sacrifice", type: "concept", content: "The core mechanic of meaning generation.", children: [
          { id: "d1", label: "Physical Cost", type: "detail", content: "Health, Safety, Money." },
          { id: "d2", label: "Moral Cost", type: "detail", content: "Betraying a lesser value for a higher one." }
        ]},
        { id: "c2", label: "Tragedy", type: "concept", content: "When the cost pays off (or doesn't).", children: [
          { id: "e1", label: "Martyrdom", type: "example", content: "Death for the ideal." }
        ]}
      ]
    },
    quiz: [
       { question: "How is 'Value' defined in narrative mechanics?", options: ["By the market", "By what is sacrificed for it", "By dialogue", "By the villain"], correctAnswer: 1 },
       { question: "What is necessary for an Ideal to have weight?", options: ["A Cost/Sacrifice", "A monologue", "A happy ending", "A sidekick"], correctAnswer: 0 },
       { question: "A 'Moral Cost' involves:", options: ["Paying money", "Choosing between two goods", "Breaking the law", "Hurting feelings"], correctAnswer: 1 }
    ]
  }
};

// 3. JS HEAD FIRST CONTENT
const JS_CONTENT: Record<string, DemoModuleData> = {
  '88-1': {
    svg: `
      <svg width="100%" height="100%" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@700&display=swap');
            .handwritten { font-family: 'Comic Neue', 'Comic Sans MS', cursive; }
          </style>
          <marker id="pencil-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
             <path d="M0,0 L0,6 L9,3 z" fill="#334155" />
          </marker>
        </defs>
        <rect width="800" height="500" fill="#fdfbf7"/>
        
        <!-- CALL STACK (Barista) -->
        <g transform="translate(150, 150)">
           <path d="M -60 0 L -60 200 L 60 200 L 60 0" stroke="#334155" stroke-width="4" fill="none" stroke-linecap="round"/>
           <rect x="-50" y="150" width="100" height="40" fill="#fca5a5" stroke="#334155" stroke-width="2" rx="2" transform="rotate(-2)"/>
           <text x="0" y="175" text-anchor="middle" class="handwritten" font-size="14">main()</text>
           
           <rect x="-55" y="100" width="100" height="40" fill="#fdba74" stroke="#334155" stroke-width="2" rx="2" transform="rotate(1)"/>
           <text x="-5" y="125" text-anchor="middle" class="handwritten" font-size="14">print()</text>
           
           <text x="0" y="-20" text-anchor="middle" class="handwritten" font-size="18" font-weight="bold" fill="#475569">Call Stack (Barista)</text>
           <text x="0" y="240" text-anchor="middle" class="handwritten" font-size="12" fill="#64748b">"One drink at a time!"</text>
        </g>
        
        <!-- WEB APIs (Kitchen) -->
        <g transform="translate(450, 80)">
           <rect x="-80" y="-40" width="160" height="120" fill="#e0f2fe" stroke="#334155" stroke-width="3" rx="10" stroke-dasharray="5,5"/>
           <text x="0" y="-55" text-anchor="middle" class="handwritten" font-size="16" font-weight="bold" fill="#0369a1">Web APIs (Kitchen)</text>
           <circle cx="0" cy="20" r="30" fill="#fff" stroke="#334155" stroke-width="2"/>
           <path d="M 0 20 L 20 20" stroke="#334155" stroke-width="2"/>
           <path d="M 0 20 L 0 5" stroke="#334155" stroke-width="2"/>
           <text x="0" y="70" text-anchor="middle" class="handwritten" font-size="12">setTimeout()</text>
           
           <!-- Arrow to Queue -->
           <path d="M 80 20 Q 150 20 150 150" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="3,3" marker-end="url(#pencil-arrow)"/>
        </g>
        
        <!-- CALLBACK QUEUE (Line) -->
        <g transform="translate(550, 350)">
           <line x1="-100" y1="0" x2="100" y2="0" stroke="#334155" stroke-width="3" stroke-linecap="round"/>
           <circle cx="-60" cy="-20" r="15" fill="#bef264" stroke="#334155" stroke-width="2"/>
           <circle cx="-20" cy="-20" r="15" fill="#bef264" stroke="#334155" stroke-width="2"/>
           <circle cx="20" cy="-20" r="15" fill="#bef264" stroke="#334155" stroke-width="2"/>
           <text x="0" y="30" text-anchor="middle" class="handwritten" font-size="16" font-weight="bold" fill="#3f6212">Callback Queue (Line)</text>
        </g>
        
        <!-- EVENT LOOP (The Bouncer) -->
        <g transform="translate(350, 300)">
           <circle cx="0" cy="0" r="40" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
           <path d="M -20 0 A 20 20 0 0 1 20 0" stroke="#ca8a04" stroke-width="3" fill="none" marker-end="url(#pencil-arrow)"/>
           <path d="M 20 0 A 20 20 0 0 1 -20 0" stroke="#ca8a04" stroke-width="3" fill="none" marker-end="url(#pencil-arrow)"/>
           <text x="0" y="55" text-anchor="middle" class="handwritten" font-size="16" font-weight="bold">Event Loop</text>
           <text x="0" y="75" text-anchor="middle" class="handwritten" font-size="10">"Is Stack empty?"</text>
        </g>
        
        <!-- Connection Arrows -->
        <path d="M 460 330 L 220 330 L 220 350" fill="none" stroke="#334155" stroke-width="3" marker-end="url(#pencil-arrow)"/>
      </svg>
    `,
    tree: {
      id: "root", label: "The Event Loop", type: "root", content: "JavaScript's mechanism for handling async operations despite being single-threaded.",
      children: [
        { id: "c1", label: "The Call Stack", type: "concept", content: "LIFO (Last In, First Out). Think of it as a stack of plates.", children: [
          { id: "d1", label: "Single Threaded", type: "detail", content: "Can only do ONE thing at a time." }
        ]},
        { id: "c2", label: "The Callback Queue", type: "concept", content: "FIFO (First In, First Out). A line of people waiting.", children: [
          { id: "d2", label: "Waiting Room", type: "detail", content: "Where async callbacks wait for the stack to clear." }
        ]}
      ]
    },
    quiz: [
      { question: "Is JavaScript single-threaded or multi-threaded?", options: ["Multi-threaded", "Single-threaded", "Depends on the browser", "No threads"], correctAnswer: 1 },
      { question: "Which data structure represents the Call Stack?", options: ["FIFO (Queue)", "LIFO (Stack)", "Tree", "Graph"], correctAnswer: 1 },
      { question: "When does the Event Loop move tasks from Queue to Stack?", options: ["Every 1ms", "When the Stack is empty", "When the Queue is full", "Randomly"], correctAnswer: 1 }
    ]
  }
};


// --- MODULES DATA ---

const STORY_MODULES: CourseModule[] = [
  { title: 'The Anatomy of Story', duration: '10:00', keyTakeaways: [] },
  { title: 'Conflict & Suspense Mechanics', duration: '15:30', keyTakeaways: [] },
  { title: 'Will vs. Environment', duration: '12:00', keyTakeaways: [] },
  { title: 'The Cost of Ideals', duration: '20:00', keyTakeaways: [] },
].map((m, i) => ({ ...m, id: `99-${i+1}`, isCompleted: i === 0, isLocked: false }));

const REACT_MODULES: CourseModule[] = [
  { title: 'Introduction to Patterns', duration: '5:20', keyTakeaways: [] },
  { title: 'Higher-Order Components', duration: '12:45', keyTakeaways: [] },
  { title: 'Render Props', duration: '8:30', keyTakeaways: [] },
  { title: 'Custom Hooks', duration: '15:10', keyTakeaways: [] },
  { title: 'Compound Components', duration: '10:15', keyTakeaways: [] },
  { title: 'State Reducer Pattern', duration: '14:20', keyTakeaways: [] },
  { title: 'Provider Pattern', duration: '11:30', keyTakeaways: [] },
].map((m, i) => ({ ...m, id: `${i+1}`, isCompleted: i === 0, isLocked: false }));

const JS_MODULES: CourseModule[] = [
  { title: 'The Event Loop Visualized', duration: '8:00', keyTakeaways: [] },
  { title: 'Hoisting & Scope', duration: '10:00', keyTakeaways: [] },
  { title: 'Closures Explained', duration: '12:00', keyTakeaways: [] },
  { title: 'Promises vs Async/Await', duration: '15:00', keyTakeaways: [] },
].map((m, i) => ({ ...m, id: `88-${i+1}`, isCompleted: i === 0, isLocked: false }));


// --- SUB-COMPONENTS ---

const PlayerTreeNode: React.FC<{ node: RRTreeNode, level?: number }> = ({ node, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(level < 2);
    const hasChildren = node.children && node.children.length > 0;
  
    const typeColor = {
      root: 'text-indigo-900',
      concept: 'text-slate-800',
      detail: 'text-slate-600',
      example: 'text-emerald-700'
    }[node.type] || 'text-slate-700';
  
    return (
      <div className={`ml-${level * 4} mt-3 animate-fade-in`}>
        <div 
          className="flex items-start group relative cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="mr-2 mt-1 text-slate-400 group-hover:text-indigo-500 transition-colors">
             {hasChildren ? (
                isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
             ) : (
                <Circle size={8} className="fill-current mt-1" />
             )}
          </div>
          <div className="flex-1 pr-12">
             <h4 className={`font-semibold text-lg leading-tight group-hover:underline decoration-slate-300 underline-offset-4 ${typeColor}`}>
                {node.label}
             </h4>
             {isOpen && (
               <p className="text-base text-slate-500 mt-1 leading-relaxed border-l-2 border-slate-100 pl-3">{node.content}</p>
             )}
          </div>
          <button className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 hover:scale-110 shadow-sm border border-indigo-100">
            <Sparkles size={14} />
          </button>
        </div>
        {isOpen && hasChildren && node.children && (
          <div className="pl-2 border-l border-slate-200 ml-[11px] mt-1">
            {node.children.map((child, idx) => (
              <PlayerTreeNode key={child.id || idx} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
};

interface CoursePlayerProps {
  onBack: () => void;
  courseId?: string;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ onBack, courseId = '1' }) => {
  const isStoryCourse = courseId === '99';
  const isJSCourse = courseId === '88';
  
  const MODULE_DATA = isStoryCourse ? STORY_MODULES : isJSCourse ? JS_MODULES : REACT_MODULES;
  
  // Initialize State
  const [modules, setModules] = useState(MODULE_DATA);
  const [activeModuleId, setActiveModuleId] = useState(MODULE_DATA[0].id);
  const [showAi, setShowAi] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishedResult, setPolishedResult] = useState<{title:string, content:string, tags:string[]} | null>(null);
  const [bookmarkedModules, setBookmarkedModules] = useState<string[]>([]);
  
  // Quiz State
  const [quizStatus, setQuizStatus] = useState<'idle' | 'active' | 'completed'>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  // Derived Active Content
  const activeModule = modules.find(m => m.id === activeModuleId) || modules[0];
  
  // Load Content from Map or use Fallback
  const currentContent: DemoModuleData | null = useMemo(() => {
     // Check if we have demo content for this specific module ID
     let contentMap;
     if (isStoryCourse) contentMap = STORY_CONTENT;
     else if (isJSCourse) contentMap = JS_CONTENT;
     else contentMap = REACT_CONTENT;

     return contentMap[activeModuleId] || null;
  }, [activeModuleId, isStoryCourse, isJSCourse]);

  const isBookmarked = bookmarkedModules.includes(activeModuleId);

  // Update modules if courseId changes
  useEffect(() => {
     let newModules;
     if (courseId === '99') newModules = STORY_MODULES;
     else if (courseId === '88') newModules = JS_MODULES;
     else newModules = REACT_MODULES;

     setModules(newModules);
     setActiveModuleId(newModules[0].id);
  }, [courseId]);

  useEffect(() => {
    setQuizStatus('idle');
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setShowExplanation(false);
  }, [activeModuleId]);

  const toggleBookmark = () => {
    setBookmarkedModules(prev => {
        if (prev.includes(activeModuleId)) {
            return prev.filter(id => id !== activeModuleId);
        } else {
            return [...prev, activeModuleId];
        }
    });
  };

  const handlePolish = async () => {
    setIsPolishing(true);
    const result = await polishInsight(noteText || currentContent?.tree.content || "Learning notes"); 
    setPolishedResult(result);
    setIsPolishing(false);
  };

  const handlePublish = () => {
    alert("Insight published! You just earned +50 potential Knowledge Points.");
    setPolishedResult(null);
    setNoteText('');
    setShowNoteModal(false);
  };

  const handleQuizAnswer = (index: number) => {
    if (showExplanation || !currentContent) return;
    setSelectedOption(index);
    setShowExplanation(true);
    
    if (index === currentContent.quiz[currentQuestionIndex].correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!currentContent) return;
    if (currentQuestionIndex < currentContent.quiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizStatus('completed');
      const passed = quizScore >= (currentContent.quiz.length - 1);
      if (passed) {
        setModules(prev => {
           const currentIndex = prev.findIndex(m => m.id === activeModuleId);
           return prev.map((m, idx) => {
               if (m.id === activeModuleId) return { ...m, isCompleted: true };
               if (idx === currentIndex + 1) return { ...m, isLocked: false };
               return m;
           });
        });
      }
    }
  };

  const handleContinueLearning = () => {
      const currentIndex = modules.findIndex(m => m.id === activeModuleId);
      if (currentIndex !== -1 && currentIndex < modules.length - 1) {
          setActiveModuleId(modules[currentIndex + 1].id);
      }
  };

  const retryQuiz = () => {
    setQuizStatus('active');
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setShowExplanation(false);
  };
  
  const aiContextContent = currentContent ? currentContent.tree.content : `Content for ${activeModule.title}`;

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6 animate-fade-in">
      
      {/* Sidebar - Course Modules */}
      <div className="w-80 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col overflow-hidden shrink-0 hidden lg:flex shadow-sm">
        <div className="p-6 bg-white border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-lg">Course Content</h3>
            <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-2 font-medium">
                    <span>{Math.round((modules.filter(m => m.isCompleted).length / modules.length) * 100)}% Completed</span>
                    <span>{modules.filter(m => m.isCompleted).length}/{modules.length} Modules</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-700 ease-out" 
                        style={{ width: `${(modules.filter(m => m.isCompleted).length / modules.length) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {modules.map((module, index) => {
                const isActive = module.id === activeModuleId;
                const isModuleBookmarked = bookmarkedModules.includes(module.id);
                return (
                    <button
                        key={module.id}
                        onClick={() => !module.isLocked && setActiveModuleId(module.id)}
                        disabled={module.isLocked}
                        className={`w-full flex items-center p-3 text-left transition-all rounded-xl relative ${
                            isActive 
                                ? 'bg-white shadow-sm border border-indigo-100 z-10' 
                                : 'hover:bg-white/60 border border-transparent hover:border-slate-100'
                        } ${module.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isModuleBookmarked && (
                            <div className="absolute top-2 right-2">
                                <Bookmark size={10} className="text-yellow-500 fill-yellow-500" />
                            </div>
                        )}
                        <div className="mr-3 shrink-0">
                            {module.isCompleted ? (
                                <div className="bg-emerald-100 text-emerald-600 rounded-full p-1">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            ) : module.isLocked ? (
                                <div className="bg-slate-200 text-slate-400 rounded-full p-1">
                                    <Lock size={14} />
                                </div>
                            ) : (
                                <div className={`rounded-full p-1.5 ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-200 text-slate-500'}`}>
                                    <Play size={10} fill="currentColor" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>
                                {index + 1}. {module.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">{module.duration}</p>
                        </div>
                    </button>
                );
            })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        {/* Visual Header (Replaces Video) */}
        <div className="h-[45vh] bg-slate-900 relative flex flex-col shrink-0 group overflow-hidden">
            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center overflow-hidden">
                 {currentContent ? (
                     <div className="w-full h-full p-4 flex items-center justify-center">
                        <div className="w-full h-full max-w-4xl max-h-full aspect-video" dangerouslySetInnerHTML={{ __html: currentContent.svg }} />
                     </div>
                 ) : (
                     <div className="text-slate-400 flex flex-col items-center">
                        <Loader2 className="animate-spin mb-2" />
                        <span>Generating visuals for {activeModule.title}...</span>
                     </div>
                 )}
                 <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
            </div>
            
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
                <button onClick={onBack} className="flex items-center text-slate-600 hover:text-slate-900 transition-colors bg-white/80 hover:bg-white backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium border border-slate-200 shadow-sm">
                    <ChevronLeft size={16} className="mr-1" /> Back to Dashboard
                </button>
                <div className="flex space-x-2">
                     <button 
                        onClick={toggleBookmark}
                        className={`p-2 backdrop-blur-md rounded-full transition-colors shadow-sm ${isBookmarked ? 'text-yellow-500 bg-white' : 'text-slate-500 hover:text-slate-700 bg-white/80 hover:bg-white'}`}
                        title={isBookmarked ? "Remove Bookmark" : "Bookmark Module"}
                     >
                        <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
                     </button>
                </div>
            </div>
            
            <div className="p-6 z-20 mt-auto">
                <div className="mb-2">
                     <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block shadow-sm">
                        Module {modules.findIndex(m => m.id === activeModuleId) + 1}
                     </span>
                     <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">{activeModule.title}</h2>
                </div>
            </div>
        </div>

        {/* Knowledge Tree & Content Area */}
        <div className="flex-1 overflow-y-auto bg-white relative scroll-smooth">
          <div className="max-w-4xl mx-auto px-8 py-10 pb-32">
            
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-30 pt-2">
               <div>
                 <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Network size={20}/></span>
                    Knowledge Map
                 </h1>
               </div>
               
               <div className="flex space-x-3">
                 <button 
                    onClick={() => setShowAi(!showAi)}
                    className="flex items-center px-4 py-2 bg-white text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 font-medium transition-colors border border-slate-200 shadow-sm text-sm"
                 >
                    <Sparkles size={16} className="mr-2 text-indigo-500" />
                    Ask Tutor
                 </button>
                 <button 
                    onClick={() => setShowNoteModal(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm hover:shadow-indigo-500/30 text-sm"
                 >
                    <Share2 size={16} className="mr-2" />
                    Create Insight
                 </button>
               </div>
            </div>
            
            <div className="mb-16">
               <div className="animate-fade-in">
                 {currentContent ? (
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <PlayerTreeNode node={currentContent.tree} />
                     </div>
                 ) : (
                    <div className="text-slate-400 text-center py-20 flex flex-col items-center">
                        <Lock size={48} className="mb-4 text-slate-200" />
                        <p className="text-lg">Demo content not generated for this module yet.</p>
                        <p className="text-sm mt-2">Try modules 1, 2, or 4 for this demo.</p>
                    </div>
                 )}
               </div>
            </div>

            {/* Quiz Section */}
            <div className="border-t border-slate-100 pt-10">
              {currentContent && quizStatus === 'idle' && (
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-center shadow-xl text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all duration-700"></div>
                  <div className="relative z-10">
                      <div className="inline-flex p-3 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-inner">
                        <Award size={32} className="text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Ready to verify mastery?</h3>
                      <p className="text-indigo-100 mb-8 max-w-lg mx-auto leading-relaxed">Complete this short quiz to verify your understanding of {activeModule.title}.</p>
                      <button 
                        onClick={() => setQuizStatus('active')}
                        className="px-8 py-3 bg-white text-indigo-700 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg hover:scale-105 active:scale-95"
                      >
                        Start Knowledge Check
                      </button>
                  </div>
                </div>
              )}

              {currentContent && quizStatus === 'active' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-scale-up">
                   <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center space-x-2">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                              {currentQuestionIndex + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            / {currentContent.quiz.length} Questions
                          </span>
                      </div>
                      <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-300" style={{width: `${(quizScore / currentContent.quiz.length) * 100}%`}}></div>
                      </div>
                   </div>
                   
                   <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 leading-snug">
                     {currentContent.quiz[currentQuestionIndex].question}
                   </h3>

                   <div className="space-y-3 mb-8">
                     {currentContent.quiz[currentQuestionIndex].options.map((option, idx) => {
                       let buttonStyle = "border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600";
                       let icon = <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>;

                       if (showExplanation) {
                         if (idx === currentContent.quiz[currentQuestionIndex].correctAnswer) {
                           buttonStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 font-medium shadow-sm";
                           icon = <CheckCircle size={20} className="text-emerald-500 fill-emerald-100" />;
                         } else if (idx === selectedOption) {
                           buttonStyle = "bg-rose-50 border-rose-500 text-rose-800 shadow-sm";
                           icon = <XCircle size={20} className="text-rose-500 fill-rose-100" />;
                         } else {
                           buttonStyle = "border-slate-100 text-slate-400 opacity-50";
                         }
                       } else if (selectedOption === idx) {
                         buttonStyle = "border-indigo-600 bg-indigo-50 text-indigo-700 font-medium shadow-sm ring-1 ring-indigo-600";
                         icon = <div className="w-5 h-5 rounded-full border-[5px] border-indigo-600"></div>;
                       }

                       return (
                         <button
                           key={idx}
                           onClick={() => handleQuizAnswer(idx)}
                           disabled={showExplanation}
                           className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center group ${buttonStyle}`}
                         >
                           <span className="text-lg">{option}</span>
                           <div className="ml-3 shrink-0">
                               {icon}
                           </div>
                         </button>
                       );
                     })}
                   </div>

                   {showExplanation && (
                     <div className="flex justify-end animate-fade-in border-t border-slate-100 pt-6">
                       <button 
                         onClick={handleNextQuestion}
                         className="flex items-center px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all hover:translate-x-1 shadow-lg shadow-slate-300"
                       >
                         {currentQuestionIndex < currentContent.quiz.length - 1 ? 'Next Question' : 'See Results'}
                         <ArrowRight size={18} className="ml-2" />
                       </button>
                     </div>
                   )}
                </div>
              )}

              {currentContent && quizStatus === 'completed' && (
                <div className="text-center bg-white p-12 rounded-3xl border border-slate-200 shadow-xl animate-scale-up">
                   {quizScore >= currentContent.quiz.length - 1 ? (
                     <>
                        <div className="inline-block p-5 bg-emerald-100 text-emerald-600 rounded-full mb-6 animate-bounce shadow-sm">
                          <CheckCircle size={56} />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800 mb-3">Lesson Mastered!</h3>
                        <p className="text-slate-600 mb-8 text-lg">You scored <span className="font-bold text-emerald-600">{quizScore}/{currentContent.quiz.length}</span>.</p>
                        <div className="flex justify-center space-x-4">
                            <button 
                                onClick={onBack}
                                className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                            <button 
                                onClick={handleContinueLearning}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 flex items-center"
                            >
                                Continue Learning <ArrowRight size={18} className="ml-2" />
                            </button>
                        </div>
                     </>
                   ) : (
                     <>
                        <div className="inline-block p-5 bg-rose-100 text-rose-600 rounded-full mb-6 shadow-sm">
                          <XCircle size={56} />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800 mb-3">Almost There</h3>
                        <p className="text-slate-600 mb-8 text-lg">You scored <span className="font-bold text-rose-600">{quizScore}/{currentContent.quiz.length}</span>. Review the notes.</p>
                        <button 
                            onClick={retryQuiz}
                            className="flex items-center mx-auto px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-400/20"
                        >
                            <RotateCcw size={18} className="mr-2" />
                            Retry Quiz
                        </button>
                     </>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Sidebar Overlay */}
        <AiTutor 
          isOpen={showAi} 
          onClose={() => setShowAi(false)} 
          contextContent={aiContextContent} 
        />
      </div>

      {/* Share Insight Modal Overlay */}
      {showNoteModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Create a Knowledge Insight</h3>
                <p className="text-sm text-slate-500">Turn your learning into earning. AI will polish your draft.</p>
              </div>
              <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 border border-slate-200 p-2 rounded-full">
                <ChevronLeft size={20} className="rotate-180" /> 
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {!polishedResult ? (
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Draft Your Thoughts</label>
                    <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="e.g. Higher-Order Components seem complicated, but they are essentially just wrapper functions..."
                        className="w-full h-48 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none text-slate-700 bg-slate-50 placeholder:text-slate-400"
                    ></textarea>
                    <div className="flex justify-end">
                        <button 
                            onClick={handlePolish}
                            disabled={isPolishing}
                            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70"
                        >
                            {isPolishing ? <Loader2 size={20} className="animate-spin mr-2" /> : <Sparkles size={20} className="mr-2" />}
                            {isPolishing ? "AI is Polishing..." : "Polish with AI"}
                        </button>
                    </div>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center text-emerald-800">
                        <CheckCircle size={20} className="mr-2" />
                        AI has optimized your insight for maximum engagement!
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                        <input type="text" value={polishedResult.title} className="w-full text-xl font-bold text-slate-800 border-none focus:ring-0 p-0 bg-transparent" readOnly />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Content</label>
                        <div className="prose prose-sm p-5 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                            {polishedResult.content.split('\n').map((l, i) => <p key={i}>{l}</p>)}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {polishedResult.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100">#{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
              )}
            </div>

            {polishedResult && (
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-3">
                    <button 
                        onClick={() => setPolishedResult(null)}
                        className="px-5 py-2.5 text-slate-600 font-medium hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl transition-all"
                    >
                        Edit Again
                    </button>
                    <button 
                        onClick={handlePublish}
                        className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                    >
                        Publish & Earn
                    </button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
