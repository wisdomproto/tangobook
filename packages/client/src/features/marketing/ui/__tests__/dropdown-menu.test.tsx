import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../dropdown-menu';

function TestDropdown({
  onSelect,
  onOpenChange,
}: {
  onSelect?: (label: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button>Open Menu</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => onSelect?.('Item 1')}>Item 1</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onSelect?.('Item 2')}>Item 2</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('DropdownMenu', () => {
  it('does not show menu initially', () => {
    render(<TestDropdown />);
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('opens menu when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<TestDropdown />);

    await user.click(screen.getByText('Open Menu'));
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('closes menu and fires onSelect when an item is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TestDropdown onSelect={onSelect} />);

    await user.click(screen.getByText('Open Menu'));
    expect(screen.getByText('Item 1')).toBeInTheDocument();

    await user.click(screen.getByText('Item 1'));
    expect(onSelect).toHaveBeenCalledWith('Item 1');
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('closes menu on outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <TestDropdown />
      </div>
    );

    await user.click(screen.getByText('Open Menu'));
    expect(screen.getByText('Item 1')).toBeInTheDocument();

    await user.click(screen.getByTestId('outside'));
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('closes menu on Escape key', async () => {
    const user = userEvent.setup();
    render(<TestDropdown />);

    await user.click(screen.getByText('Open Menu'));
    expect(screen.getByText('Item 1')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('calls onOpenChange with true when opened', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<TestDropdown onOpenChange={onOpenChange} />);

    await user.click(screen.getByText('Open Menu'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('calls onOpenChange with false when closed via item click', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<TestDropdown onOpenChange={onOpenChange} />);

    await user.click(screen.getByText('Open Menu'));
    onOpenChange.mockClear();

    await user.click(screen.getByText('Item 1'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders separator', async () => {
    const user = userEvent.setup();
    render(<TestDropdown />);
    await user.click(screen.getByText('Open Menu'));

    const separator = document.querySelector('[data-slot="dropdown-menu-separator"]');
    expect(separator).toBeInTheDocument();
  });

  it('has data-slot="dropdown-menu-content"', async () => {
    const user = userEvent.setup();
    render(<TestDropdown />);
    await user.click(screen.getByText('Open Menu'));

    expect(document.querySelector('[data-slot="dropdown-menu-content"]')).toBeInTheDocument();
  });
});
