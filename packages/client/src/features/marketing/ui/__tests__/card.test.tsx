import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '../card';

describe('Card', () => {
  it('renders Card with children', () => {
    render(<Card>Card body</Card>);
    expect(screen.getByText('Card body')).toBeInTheDocument();
  });

  it('Card has data-slot="card"', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument();
  });

  it('Card has bg-card class', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.querySelector('[data-slot="card"]')?.className).toContain('bg-card');
  });

  it('renders CardHeader with children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('CardHeader has data-slot="card-header"', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    expect(container.querySelector('[data-slot="card-header"]')).toBeInTheDocument();
  });

  it('renders CardTitle with children', () => {
    render(<CardTitle>Title text</CardTitle>);
    expect(screen.getByText('Title text')).toBeInTheDocument();
  });

  it('CardTitle has data-slot="card-title"', () => {
    const { container } = render(<CardTitle>Title</CardTitle>);
    expect(container.querySelector('[data-slot="card-title"]')).toBeInTheDocument();
  });

  it('renders CardDescription', () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('CardDescription has text-muted-foreground class', () => {
    const { container } = render(<CardDescription>Desc</CardDescription>);
    expect(container.querySelector('[data-slot="card-description"]')?.className).toContain(
      'text-muted-foreground'
    );
  });

  it('renders CardAction', () => {
    render(<CardAction>Action</CardAction>);
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders CardContent with children', () => {
    render(<CardContent>Content text</CardContent>);
    expect(screen.getByText('Content text')).toBeInTheDocument();
  });

  it('renders CardFooter with children', () => {
    render(<CardFooter>Footer text</CardFooter>);
    expect(screen.getByText('Footer text')).toBeInTheDocument();
  });

  it('CardFooter has data-slot="card-footer"', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    expect(container.querySelector('[data-slot="card-footer"]')).toBeInTheDocument();
  });

  it('renders full card composition', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>My Title</CardTitle>
          <CardDescription>My description</CardDescription>
        </CardHeader>
        <CardContent>My content</CardContent>
        <CardFooter>My footer</CardFooter>
      </Card>
    );
    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('My description')).toBeInTheDocument();
    expect(screen.getByText('My content')).toBeInTheDocument();
    expect(screen.getByText('My footer')).toBeInTheDocument();
  });

  it('Card accepts custom className', () => {
    const { container } = render(<Card className="custom-card">Content</Card>);
    expect(container.querySelector('[data-slot="card"]')?.className).toContain('custom-card');
  });

  it('Card size sm applies data-size=sm', () => {
    const { container } = render(<Card size="sm">Small</Card>);
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument();
  });
});
