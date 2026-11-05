import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { COLOR_MATCHING_POOL, ColorMatchingGame } from './games/1-colors/ColorMatchingGame';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('ColorMatchingGame generated sprites', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('maps every current pool item to a generated sprite asset', () => {
    expect(COLOR_MATCHING_POOL).toHaveLength(20);
    expect(COLOR_MATCHING_POOL.every((item) => item.assetSrc.startsWith('/assets/images/color-match-'))).toBe(true);
    expect(COLOR_MATCHING_POOL.map((item) => item.assetSrc)).toContain('/assets/images/color-match-red-ladybug-v2.png');
    expect(COLOR_MATCHING_POOL.map((item) => item.assetSrc)).not.toContain('/assets/images/color-match-orange-fruit.png');
    expect(COLOR_MATCHING_POOL.map((item) => item.assetSrc)).not.toContain('/assets/images/color-match-purple-grapes.png');
  });

  it('renders selected pool items as accessible sprite images', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<ColorMatchingGame />);

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(4);
    });

    expect(screen.getAllByRole('img').map((image) => image.getAttribute('src'))).toEqual([
      '/assets/images/color-match-red-strawberry.png',
      '/assets/images/color-match-red-apple.png',
      '/assets/images/color-match-red-tomato.png',
      '/assets/images/color-match-red-car.png',
    ]);
  });

  it('falls back to the original emoji when a sprite fails to load', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<ColorMatchingGame />);

    const firstImage = await screen.findByAltText('red strawberry');
    fireEvent.error(firstImage);

    await waitFor(() => {
      expect(screen.queryByAltText('red strawberry')).not.toBeInTheDocument();
      expect(screen.getByText('🍓')).toBeInTheDocument();
    });
  });
});
