import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../select';

function TestSelect({
  value,
  onValueChange,
  defaultValue,
  placeholder = 'Pick one',
}: {
  value?: string;
  onValueChange?: (v: string) => void;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} defaultValue={defaultValue}>
      <SelectTrigger aria-label="color">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="red">Red</SelectItem>
        <SelectItem value="green">Green</SelectItem>
        <SelectItem value="blue">Blue</SelectItem>
      </SelectContent>
    </Select>
  );
}

describe('Select', () => {
  it('does not show options initially', () => {
    render(<TestSelect />);
    expect(screen.queryByText('Red')).not.toBeInTheDocument();
  });

  it('shows placeholder when no value selected', () => {
    render(<TestSelect placeholder="Pick a color" />);
    expect(screen.getByText('Pick a color')).toBeInTheDocument();
  });

  it('opens listbox when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Green')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
  });

  it('calls onValueChange with selected value when item clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TestSelect onValueChange={onValueChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Green'));

    expect(onValueChange).toHaveBeenCalledWith('green');
  });

  it('closes popover after item selection', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText('Red')).toBeInTheDocument();

    await user.click(screen.getByText('Red'));
    expect(screen.queryByText('Green')).not.toBeInTheDocument();
  });

  it('shows selected value in trigger (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Blue'));

    // Trigger should now display "Blue"
    expect(screen.getByRole('combobox')).toHaveTextContent('Blue');
  });

  it('reflects controlled value', () => {
    render(<TestSelect value="green" onValueChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Green');
  });

  it('shows checkmark indicator on selected item when opened (controlled)', async () => {
    const user = userEvent.setup();
    render(<TestSelect value="red" onValueChange={() => {}} />);

    await user.click(screen.getByRole('combobox'));
    // The selected item should have data-selected or a check indicator
    const selectedItem = document.querySelector('[data-slot="select-item"][data-selected="true"]');
    expect(selectedItem).toBeInTheDocument();
    expect(selectedItem).toHaveTextContent('Red');
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText('Red')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByText('Red')).not.toBeInTheDocument();
  });

  it('has data-slot="select-content" when open', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);

    await user.click(screen.getByRole('combobox'));
    expect(document.querySelector('[data-slot="select-content"]')).toBeInTheDocument();
  });

  it('shows check icon for already selected item in open list', async () => {
    const user = userEvent.setup();
    render(<TestSelect defaultValue="green" />);

    await user.click(screen.getByRole('combobox'));
    // check that "green" item is marked selected
    const greenItem = document.querySelector('[data-slot="select-item"][data-selected="true"]');
    expect(greenItem).toBeInTheDocument();
    expect(greenItem).toHaveTextContent('Green');
  });
});
