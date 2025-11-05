import { render, screen, fireEvent, within } from '@testing-library/react';
import { PublishForm } from './PublishForm';
import { expect, test, vi } from 'vitest';

test('PublishForm resets loading state on back button click', async () => {
  const mockAccessToken = 'mock-access-token';
  const mockOnClose = vi.fn();
  const mockOnPublished = vi.fn();

  render(
    <PublishForm
      accessToken={mockAccessToken}
      onClose={mockOnClose}
      onPublished={mockOnPublished}
    />
  );

  // 1. Select "Offre de service" to advance to the next step
  fireEvent.click(screen.getByText('Offre de service'));

  // 2. Fill the form
  fireEvent.change(screen.getByLabelText('Titre'), {
    target: { value: 'Test Title' },
  });
  fireEvent.change(screen.getByLabelText('Description'), {
    target: { value: 'Test Description' },
  });
  fireEvent.click(screen.getByText('Sélectionnez un quartier'));
  fireEvent.click(
    within(screen.getByRole('listbox')).getByText('Centre-Ville')
  );

  // 3. Mock the fetch request to simulate an error
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'An error occurred' }),
    })
  );

  // 4. Submit the form to trigger the error and set loading to true
  fireEvent.click(screen.getByText('Publier'));

  // 5. Wait for the error message to be displayed
  await screen.findByText('An error occurred');

  // 6. Click the back button
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));

  // 7. Select "Offre de service" again
  fireEvent.click(screen.getByText('Offre de service'));

  // 8. Assert that the "Publier" button is not disabled
  expect(screen.getByText('Publier')).not.toBeDisabled();
});
