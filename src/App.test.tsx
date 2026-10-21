import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders Veil app', () => {
    render(<App />);
    expect(screen.getAllByText(/veil/i).length).toBeGreaterThan(0);
  });
});
