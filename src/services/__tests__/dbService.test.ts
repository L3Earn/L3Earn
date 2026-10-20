import { dbService } from '../../../services/dbService';
import { Course, LearningPathData } from '../../../types';

// Mock the supabase service：客户端由入口层注入，这里直接替换 getter
jest.mock('../../../services/supabase', () => ({
  getSupabaseClient: jest.fn(),
  isSupabaseConfigured: jest.fn(() => false),
  configureSupabase: jest.fn(),
}));

const supaModule = require('../../../services/supabase');
const mockSupabase = {
  from: jest.fn(),
  auth: { getUser: jest.fn() },
};
supaModule.getSupabaseClient.mockReturnValue(mockSupabase);

describe('dbService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCourses', () => {
    it('should return courses from Supabase when configured', async () => {
      // Arrange
      const mockCourses: Course[] = [
        {
          id: '1',
          title: 'Test Course',
          author: 'Test Author',
          thumbnail: 'test.jpg',
          progress: 0,
          totalModules: 5,
          earningsPotential: 'High',
          category: 'Tech',
          description: 'Test Description'
        }
      ];

      const { isSupabaseConfigured } = require('../../../services/supabase');
      isSupabaseConfigured.mockReturnValue(true);
      
      const mockSelect = jest.fn().mockResolvedValue({
        data: mockCourses,
        error: null
      });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      // Act
      const result = await dbService.getCourses();

      // Assert
      expect(result).toEqual(mockCourses);
      expect(mockSupabase.from).toHaveBeenCalledWith('courses');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should fallback to mock data when Supabase fails', async () => {
      // Arrange
      const { isSupabaseConfigured } = require('../../../services/supabase');
      isSupabaseConfigured.mockReturnValue(true);
      
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      // Act
      const result = await dbService.getCourses();

      // Assert
      expect(result).toHaveLength(10); // Mock courses count
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
    });

    it('should fallback to mock data when Supabase not configured', async () => {
      // Arrange
      const { isSupabaseConfigured } = require('../../../services/supabase');
      isSupabaseConfigured.mockReturnValue(false);

      // Act
      const result = await dbService.getCourses();

      // Assert
      expect(result).toHaveLength(10);
      expect(result[0]).toHaveProperty('id', '88');
    });
  });

  describe('saveLearningPath', () => {
    it('should save learning path to Supabase when configured and user exists', async () => {
      // Arrange
      const mockPathData: LearningPathData = {
        roadmapTitle: 'Test Path',
        marketAnalysis: {
          topOpportunities: ['Test Job'],
          valueProposition: 'Test Value',
          keyLeverageSkill: 'Test Skill',
          salaryRange: '$100k-$150k'
        },
        nodes: []
      };

      const { isSupabaseConfigured } = require('../../../services/supabase');
      isSupabaseConfigured.mockReturnValue(true);
      
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      // Act
      const result = await dbService.saveLearningPath('user-123', mockPathData);

      // Assert
      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('learning_paths');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        title: 'Test Path',
        path_data: mockPathData
      });
    });

    it('should return false when Supabase insert fails', async () => {
      // Arrange
      const mockPathData: LearningPathData = {
        roadmapTitle: 'Test Path',
        marketAnalysis: {
          topOpportunities: ['Test Job'],
          valueProposition: 'Test Value',
          keyLeverageSkill: 'Test Skill',
          salaryRange: '$100k-$150k'
        },
        nodes: []
      };

      const { isSupabaseConfigured } = require('../../../services/supabase');
      isSupabaseConfigured.mockReturnValue(true);
      
      const mockInsert = jest.fn().mockResolvedValue({ error: new Error('Insert failed') });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      // Act
      const result = await dbService.saveLearningPath('user-123', mockPathData);

      // Assert
      expect(result).toBe(false);
    });

    it('should mock save when Supabase not configured', async () => {
      // Arrange
      const mockPathData: LearningPathData = {
        roadmapTitle: 'Test Path',
        marketAnalysis: {
          topOpportunities: ['Test Job'],
          valueProposition: 'Test Value',
          keyLeverageSkill: 'Test Skill',
          salaryRange: '$100k-$150k'
        },
        nodes: []
      };

      const { isSupabaseConfigured } = require('../../../services/supabase');
      isSupabaseConfigured.mockReturnValue(false);

      // Act
      const result = await dbService.saveLearningPath(undefined, mockPathData);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from Supabase when configured', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const { isSupabaseConfigured } = require('../../../services/supabase');
      isSupabaseConfigured.mockReturnValue(true);
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Act
      const result = await dbService.getCurrentUser();

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    });

    it('should return null when Supabase not configured', async () => {
      // Arrange
      const { isSupabaseConfigured } = require('../../../services/supabase');
      isSupabaseConfigured.mockReturnValue(false);

      // Act
      const result = await dbService.getCurrentUser();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('signIn', () => {
    it('should show alert when Supabase configured', async () => {
      // Arrange
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation();
      const { isSupabaseConfigured } = require('../../../services/supabase');
      isSupabaseConfigured.mockReturnValue(true);

      // Act
      await dbService.signIn();

      // Assert
      expect(mockAlert).toHaveBeenCalledWith('Supabase configured! Implement signInWithOAuth here.');
      
      mockAlert.mockRestore();
    });

    it('should show alert when Supabase not configured', async () => {
      // Arrange
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation();
      const { isSupabaseConfigured } = require('../../../services/supabase');
      isSupabaseConfigured.mockReturnValue(false);

      // Act
      await dbService.signIn();

      // Assert
      expect(mockAlert).toHaveBeenCalledWith('Supabase keys missing. Using Mock Auth mode.');
      
      mockAlert.mockRestore();
    });
  });
});