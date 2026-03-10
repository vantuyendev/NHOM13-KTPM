import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DocumentUploadModal from '../DocumentUploadModal';

describe('DocumentUploadModal', () => {
  it('shows cloud warning and Cloud URL input when file is larger than 20MB', () => {
    render(
      <DocumentUploadModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const fileInput = screen.getByLabelText(/select file/i) as HTMLInputElement;

    const largeFile = new File(['x'], 'large.bin', { type: 'application/octet-stream' });
    Object.defineProperty(largeFile, 'size', { value: 21 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(screen.getByText(/please use cloud storage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cloud url/i)).toBeInTheDocument();
  });
});
