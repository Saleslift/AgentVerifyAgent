import React from 'react';
import { Youtube, Facebook, Instagram, Linkedin, BookText as TikTok, Twitter } from 'lucide-react';

interface SocialMediaLinksProps {
  youtube?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  x?: string;
}

export default function SocialMediaLinks({
  youtube,
  facebook,
  instagram,
  linkedin,
  tiktok,
  x
}: SocialMediaLinksProps) {
  const hasSocialLinks = youtube || facebook || instagram || linkedin || tiktok || x;

  if (!hasSocialLinks) return null;

  return (
    <div className="flex flex-wrap gap-6">
      {youtube && (
        <a
          href={youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-primary-300 transition-colors"
          title="YouTube"
        >
          <Youtube className="h-9 w-9 stroke-[1.5]" />
        </a>
      )}
      {facebook && (
        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-primary-300 transition-colors"
          title="Facebook"
        >
          <Facebook className="h-9 w-9 stroke-[1.5]" />
        </a>
      )}
      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-primary-300 transition-colors"
          title="Instagram"
        >
          <Instagram className="h-9 w-9 stroke-[1.5]" />
        </a>
      )}
      {linkedin && (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-primary-300 transition-colors"
          title="LinkedIn"
        >
          <Linkedin className="h-9 w-9 stroke-[1.5]" />
        </a>
      )}
      {tiktok && (
        <a
          href={tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-primary-300 transition-colors"
          title="TikTok"
        >
          <TikTok className="h-9 w-9 stroke-[1.5]" />
        </a>
      )}
      {x && (
        <a
          href={x}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-primary-300 transition-colors"
          title="X (Twitter)"
        >
          <Twitter className="h-9 w-9 stroke-[1.5]" />
        </a>
      )}
    </div>
  );
}