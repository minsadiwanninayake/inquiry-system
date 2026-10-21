import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import InquiryForm from './InquiryForm';
import { api, ApiError } from '@/lib/api';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return { ...actual, api: vi.fn() };
});

describe('InquiryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows field errors and does not call the API when the form is empty', async () => {
    const user = userEvent.setup();
    render(<InquiryForm onCreated={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /save inquiry/i }));

    expect(screen.getByText('Customer name is required')).toBeInTheDocument();
    expect(screen.getByText('Subject is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(api).not.toHaveBeenCalled();
  });

  it('keeps typed text and shows a message when the server rejects a duplicate', async () => {
    const user = userEvent.setup();
    vi.mocked(api).mockRejectedValueOnce(
      new ApiError(409, 'DUPLICATE', 'This inquiry was already submitted a moment ago')
    );
    render(<InquiryForm onCreated={vi.fn()} />);

    await user.type(screen.getByLabelText('Customer name'), 'Nimal Silva');
    await user.type(screen.getByLabelText(/contact/i), 'nimal@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Delivery delay');
    await user.type(screen.getByLabelText('Description'), 'Order not received');
    await user.click(screen.getByRole('button', { name: /save inquiry/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('already submitted');
    expect(screen.getByLabelText('Customer name')).toHaveValue('Nimal Silva');
  });
});