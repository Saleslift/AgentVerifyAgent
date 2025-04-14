import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PropertyCard from './PropertyCard';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the navigate function
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe('PropertyCard', () => {
  const mockProperty = {
    id: '123',
    title: 'Test Property',
    description: 'A test property',
    type: 'Apartment',
    contractType: 'Sale',
    price: 1000000,
    location: 'Test Location',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1000,
    highlight: 'Great view',
    images: ['https://example.com/image.jpg'],
    agentId: 'agent123',
    shared: false
  };

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
            <PropertyCard 
              property={mockProperty} 
              {...props} 
            />
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders property title correctly', () => {
    renderComponent();
    expect(screen.getByText('Test Property')).toBeInTheDocument();
  });

  it('renders property details correctly', () => {
    renderComponent();
    expect(screen.getByText('Apartment')).toBeInTheDocument();
    expect(screen.getByText('2 bed')).toBeInTheDocument();
    expect(screen.getByText('2 bath')).toBeInTheDocument();
    expect(screen.getByText('1000 sqft')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });

  it('calls onAddToListings when add button is clicked', () => {
    const onAddToListings = vi.fn();
    renderComponent({ 
      source: 'marketplace',
      onAddToListings 
    });
    
    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);
    
    expect(onAddToListings).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    renderComponent({ onEdit });
    
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    renderComponent({ onDelete });
    
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows origin tag when showOriginTag is true', () => {
    renderComponent({ 
      showOriginTag: true,
      source: 'direct'
    });
    
    expect(screen.getByText('My Property')).toBeInTheDocument();
  });

  it('shows marketplace tag when source is marketplace', () => {
    renderComponent({ 
      showOriginTag: true,
      source: 'marketplace'
    });
    
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
  });
});