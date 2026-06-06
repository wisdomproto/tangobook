import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

describe('Tabs', () => {
  it('renders the active tab content by default (defaultValue)', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
        <TabsContent value="b">Content B</TabsContent>
      </Tabs>
    );
    expect(screen.getByText('Content A')).toBeInTheDocument();
    expect(screen.queryByText('Content B')).not.toBeInTheDocument();
  });

  it('clicking a TabsTrigger shows its TabsContent and hides others', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
        <TabsContent value="b">Content B</TabsContent>
      </Tabs>
    );
    // Initially A is visible, B is not
    expect(screen.getByText('Content A')).toBeInTheDocument();
    expect(screen.queryByText('Content B')).not.toBeInTheDocument();

    // Click Tab B
    await user.click(screen.getByText('Tab B'));

    // Now B is visible, A is not
    expect(screen.getByText('Content B')).toBeInTheDocument();
    expect(screen.queryByText('Content A')).not.toBeInTheDocument();
  });

  it('sets data-active on the active trigger', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
        <TabsContent value="b">Content B</TabsContent>
      </Tabs>
    );

    const triggerA = screen.getByText('Tab A');
    const triggerB = screen.getByText('Tab B');

    // A starts as active
    expect(triggerA).toHaveAttribute('data-active');
    expect(triggerB).not.toHaveAttribute('data-active');

    // Click B
    await user.click(triggerB);
    expect(triggerB).toHaveAttribute('data-active');
    expect(triggerA).not.toHaveAttribute('data-active');
  });

  it('supports controlled value + onValueChange', async () => {
    const user = userEvent.setup();
    let currentValue = 'a';
    const onValueChange = (v: string) => {
      currentValue = v;
    };

    const { rerender } = render(
      <Tabs value="a" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
        <TabsContent value="b">Content B</TabsContent>
      </Tabs>
    );

    await user.click(screen.getByText('Tab B'));
    expect(currentValue).toBe('b');

    // Rerender with new controlled value
    rerender(
      <Tabs value="b" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
        <TabsContent value="b">Content B</TabsContent>
      </Tabs>
    );
    expect(screen.getByText('Content B')).toBeInTheDocument();
    expect(screen.queryByText('Content A')).not.toBeInTheDocument();
  });

  it('Tabs root has data-slot="tabs"', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
      </Tabs>
    );
    // The root element
    const root = screen.getByText('Content A').closest('[data-slot="tabs"]');
    expect(root).toBeInTheDocument();
  });

  it('TabsList supports line variant via data-variant', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList variant="line">
          <TabsTrigger value="a">Tab A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
      </Tabs>
    );
    const list = screen.getByText('Tab A').closest('[data-slot="tabs-list"]');
    expect(list).toHaveAttribute('data-variant', 'line');
  });
});
