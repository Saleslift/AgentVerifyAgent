import React from 'react';

interface AgentMediaDisplayProps {
  videoUrl?: string;
  imageUrl: string;
  altText: string;
}

const AgentMediaDisplay: React.FC<AgentMediaDisplayProps> = ({ videoUrl, imageUrl, altText }) => {
  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden mx-auto h-full min-h-[400px]">
      {videoUrl ? (
        <video
          src={videoUrl}
          controls={true}
          className="w-full h-full object-cover"
          loading="lazy"
          autoPlay
        />
      ) : (
        <img
          src={imageUrl}
          alt={altText}
          className="w-full h-full object-cover"
          loading="eager"
        />
      )}
    </div>
  );
};

export default AgentMediaDisplay;
