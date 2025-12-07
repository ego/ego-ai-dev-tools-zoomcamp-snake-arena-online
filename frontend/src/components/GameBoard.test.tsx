import React from 'react';
import { render } from '@testing-library/react';
import GameBoard from './GameBoard';

test('GameBoard renders without crashing', () => {
  render(<GameBoard />);
});