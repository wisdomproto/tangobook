import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../dialog';

// Helper: wraps in a controlled Dialog
function ControlledDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children?: import('react').ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children ?? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Title</DialogTitle>
            <DialogDescription>Test description</DialogDescription>
          </DialogHeader>
          <DialogFooter>Footer</DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

describe('Dialog', () => {
  it('renders dialog content when open=true', () => {
    render(<ControlledDialog open onOpenChange={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('does NOT render dialog content when open=false', () => {
    render(<ControlledDialog open={false} onOpenChange={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('calls onOpenChange(false) when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ControlledDialog open onOpenChange={onOpenChange} />);

    // The backdrop has data-slot="dialog-overlay"
    const backdrop = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement;
    expect(backdrop).toBeInTheDocument();
    await user.click(backdrop);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ControlledDialog open onOpenChange={onOpenChange} />);

    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) when the built-in close button (X) is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ControlledDialog open onOpenChange={onOpenChange} />);

    // DialogContent renders an X close button by default
    const closeBtn = screen.getByRole('button', { name: /close/i });
    await user.click(closeBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) via DialogClose child', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Hi</DialogTitle>
          <DialogClose asChild>
            <button>Cancel</button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    );
    await user.click(screen.getByText('Cancel'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('DialogTrigger opens dialog when clicked', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Triggered</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByText('Open'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Triggered')).toBeInTheDocument();
  });

  it('dialog content has aria-modal and role="dialog"', () => {
    render(<ControlledDialog open onOpenChange={() => {}} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has data-slot="dialog-content" on popup', () => {
    render(<ControlledDialog open onOpenChange={() => {}} />);
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeInTheDocument();
  });
});
