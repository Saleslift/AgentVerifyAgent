import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 text-center max-w-md mb-6">
        {message}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;