import { render, screen, act } from '@testing-library/react';
import { Feed } from './Feed';
import { expect, test, vi } from 'vitest';

vi.useFakeTimers();

test('Feed does not automatically refresh', async () => {
  const mockAccessToken = 'mock-access-token';
  const mockCurrentUserId = 'mock-user-id';
  const mockOnStartConversation = vi.fn();

  const mockFetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ announcements: [] }),
    })
  );

  global.fetch = mockFetch;

  render(
    <Feed
      accessToken={mockAccessToken}
      currentUserId={mockCurrentUserId}
      onStartConversation={mockOnStartConversation}
    />
  );

  // The initial fetch should be called once
  expect(mockFetch).toHaveBeenCalledTimes(1);

  // Fast-forward time by 10 seconds
  act(() => {
    vi.advanceTimersByTime(10000);
  });

  // The fetch function should still have been called only once
  expect(mockFetch).toHaveBeenCalledTimes(1);
});
