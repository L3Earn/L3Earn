import React from 'react';
import { render, screen } from '@testing-library/react';
import { Dashboard } from '../../../components/Dashboard';

jest.mock('recharts', () => ({
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

describe('Dashboard Component', () => {
  const defaultProps = {
    state: {
      form: { role: '', goal: '', interests: '' },
      path: null,
      isGenerating: false,
    },
    onFormChange: jest.fn(),
    onGenerate: jest.fn(),
    onReset: jest.fn(),
    onNavigateToTree: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('Adapt or Become Obsolete')).toBeInTheDocument();
  });
});
