import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { io } from 'socket.io-client';

// Mock the socket.io client
jest.mock('socket.io-client', () => {
  return {
    io: jest.fn(() => ({
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    })),
  };
});

describe('Dashboard Component', () => {
  test('renders correctly', () => {
    render(<Dashboard />, { wrapper: MemoryRouter });

    expect(screen.getByText('Conflict Monitoring System Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Keywords From Occurrence')).toBeInTheDocument();
  });

  test('navigates to CountrySelect on Change Country button click', () => {
    const { getByText } = render(<Dashboard />, { wrapper: MemoryRouter });

    fireEvent.click(getByText('Change Country'));
    expect(window.location.pathname).toBe('/CountrySelect');
  });

  test('navigates to Login on Logout button click', () => {
    const { getByText } = render(<Dashboard />, { wrapper: MemoryRouter });

    fireEvent.click(getByText('Logout'));
    expect(window.location.pathname).toBe('/Login');
  });

  test('downloads report on Download Report button click', () => {
    const { getByText } = render(<Dashboard />, { wrapper: MemoryRouter });

    const createElementSpy = jest.spyOn(document, 'createElement');
    fireEvent.click(getByText('Download Report'));
    expect(createElementSpy).toHaveBeenCalledWith('a');
  });

  test('connects and disconnects socket based on buttonStatus', () => {
    const { io } = require('socket.io-client');
    const mockSocket = io();

    render(<Dashboard />, { wrapper: MemoryRouter });

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
  });

  test('updates predictions and history on predict event', async () => {
    const mockData = {
      data: {
        final_prediction_disorder: 'Demonstrations',
        confidence_disorder: 0.9,
        final_prediction_event: 'Protests',
        confidence_event: 0.85,
        top_keywords: [{ text: 'protest', value: 10 }],
      },
    };

    const { io } = require('socket.io-client');
    const mockSocket = io();

    render(<Dashboard />, { wrapper: MemoryRouter });

    // Mock the socket.on('predict') call
    const predictCallback = mockSocket.on.mock.calls.find(call => call[0] === 'predict')[1];
    await waitFor(() => predictCallback(mockData));

    expect(screen.getByText('Demonstrations')).toBeInTheDocument();
    expect(screen.getByText('Protests')).toBeInTheDocument();
  });
});
