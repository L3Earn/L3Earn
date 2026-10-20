
import { supabase, isSupabaseConfigured } from './supabase';
import { Course, LearningPathData } from '../types';

// Fallback Mock Data (moved from App.tsx)
const MOCK_COURSES: Course[] = [
    { id: '88', title: 'Head First JS: The Event Loop', author: 'Visual Learner', thumbnail: 'https://picsum.photos/seed/js/300/200', progress: 0, totalModules: 4, earningsPotential: 'High', category: 'Tech', description: 'Understand the Call Stack, Web APIs, and the Callback Queue via visual metaphors.' },
    { id: '99', title: 'Narrative Mechanics: Conflict & Suspense', author: 'Story Architect', thumbnail: 'https://picsum.photos/seed/story/300/200', progress: 35, totalModules: 4, earningsPotential: 'Very High', category: 'Design', description: 'Deep dive into the structural biology of stories based on advanced narrative theory.' },
    { id: '1', title: 'Advanced React Patterns', author: 'Sarah Drasner', thumbnail: 'https://picsum.photos/seed/react/300/200', progress: 60, totalModules: 7, earningsPotential: 'High', category: 'Tech', description: 'Master HOCs, Render Props, and Custom Hooks.' },
    { id: '2', title: 'DeFi Investment Strategies', author: 'CoinBureau', thumbnail: 'https://picsum.photos/seed/defi/300/200', progress: 10, totalModules: 8, earningsPotential: 'Med', category: 'Finance', description: 'Safe yield farming and liquidity provision.' },
    { id: '3', title: 'Sustainable Architecture', author: 'Bjarke Ingels', thumbnail: 'https://picsum.photos/seed/arch/300/200', progress: 0, totalModules: 20, earningsPotential: 'High', category: 'Design', description: 'Building specifically for a net-zero future.' },
    { id: '4', title: 'Generative AI for Marketing', author: 'Rachel Woods', thumbnail: 'https://picsum.photos/seed/ai/300/200', progress: 0, totalModules: 6, earningsPotential: 'High', category: 'Tech', description: 'Automate content creation workflows.' },
    { id: '5', title: 'Bio-hacking & Longevity', author: 'Andrew Huberman', thumbnail: 'https://picsum.photos/seed/health/300/200', progress: 0, totalModules: 15, earningsPotential: 'Low', category: 'Science', description: 'Optimizing sleep, focus, and health.' },
    { id: '6', title: 'UX Design Systems', author: 'Figma Team', thumbnail: 'https://picsum.photos/seed/ux/300/200', progress: 0, totalModules: 10, earningsPotential: 'Med', category: 'Design', description: 'Scaling design across large organizations.' },
    { id: '7', title: 'WebGL & 3D Web', author: 'Bruno Simon', thumbnail: 'https://picsum.photos/seed/3d/300/200', progress: 0, totalModules: 18, earningsPotential: 'High', category: 'Tech', description: 'Create immersive 3D experiences with Three.js.' },
    { id: '8', title: 'Indie Game Marketing', author: 'Gamedev Unlocked', thumbnail: 'https://picsum.photos/seed/game/300/200', progress: 0, totalModules: 8, earningsPotential: 'Med', category: 'Tech', description: 'How to market your indie game on Steam.' },
];

export const dbService = {
  /**
   * Fetch all courses.
   * Logic: Try Supabase -> Fallback to Mock
   */
  getCourses: async (): Promise<Course[]> => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('courses').select('*');
      if (!error && data && data.length > 0) {
        // Map DB snake_case to CamelCase if necessary, or ensure Types match
        // Assuming DB matches Type for simplicity
        return data as any as Course[];
      }
    }
    // Fallback
    return new Promise(resolve => setTimeout(() => resolve(MOCK_COURSES), 500)); 
  },

  /**
   * Save a generated learning path.
   */
  saveLearningPath: async (userId: string | undefined, pathData: LearningPathData) => {
    if (isSupabaseConfigured() && supabase && userId) {
      const { error } = await supabase.from('learning_paths').insert({
        user_id: userId,
        title: pathData.roadmapTitle,
        path_data: pathData
      });
      if (error) console.error("Error saving path:", error);
      return !error;
    }
    // Simulate save
    console.log("Mock Save Path:", pathData);
    return true;
  },

  /**
   * Get Current User (if logged in)
   */
  getCurrentUser: async () => {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase.auth.getUser();
      return data.user;
    }
    return null;
  },

  /**
   * Login (Mock function for demo if no Supabase, or real auth trigger)
   */
  signIn: async () => {
      if (isSupabaseConfigured() && supabase) {
          // In a real app, triggering OAuth
          // await supabase.auth.signInWithOAuth({ provider: 'google' });
          alert("Supabase configured! Implement signInWithOAuth here.");
      } else {
          alert("Supabase keys missing. Using Mock Auth mode.");
      }
  }
};
