import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReconciliationServiceInput from './ReconciliationServiceInput';

describe('ReconciliationServiceInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('validates endpoint after debounce and notifies parent with parsed service', async () => {
    const onChange = vi.fn();
    const endpoint = 'https://example.org/reconcile';
    const manifest = {
      name: 'Example service',
      identifierSpace: 'https://example.org/entity/',
      schemaSpace: 'https://example.org/schema/',
      view: {
        url: 'https://example.org/entity/{{id}}',
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(manifest),
    });

    render(
      <ReconciliationServiceInput
        initialService={{ endpoint: '' }}
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText(/endpoint:/i);
    fireEvent.change(input, { target: { value: endpoint } });

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(endpoint);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    const serviceArg = onChange.mock.calls[0][0];
    expect(serviceArg).toBeTruthy();
    expect(serviceArg.endpoint).toBe(endpoint);
    expect(serviceArg.manifest).toEqual(manifest);
  });

  it('shows validation message and clears parent value when endpoint fetch fails', async () => {
    const onChange = vi.fn();
    const endpoint = 'http://bad.example/reconcile';

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <ReconciliationServiceInput
        initialService={{ endpoint: '' }}
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText(/endpoint:/i);
    fireEvent.change(input, { target: { value: endpoint } });

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText(/the endpoint must return a json document describing the service, accessible via cors/i)).toBeInTheDocument();
      expect(onChange).toHaveBeenCalledWith(undefined, undefined);
    });
  });
});
