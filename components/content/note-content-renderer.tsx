"use client";

import UnfurledLink from './unfurled-link';

interface NoteContentRendererProps {
  content: string;
}

export default function NoteContentRenderer({ content }: NoteContentRendererProps) {
  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
  
  // Split content by URLs
  const parts = content.split(urlRegex);
  
  return (
    <div className="prose max-w-none">
      {parts.map((part, index) => {
        // If this part matches a URL pattern, render the UnfurledLink component
        if (urlRegex.test(part)) {
          return (
            <div key={index}>
              <UnfurledLink url={part} />
            </div>
          );
        }
        
        // Otherwise, split by newlines and render paragraphs
        const lines = part.split('\n');
        return lines.map((line, lineIndex) => {
          if (line.trim() === '') {
            return <br key={`${index}-${lineIndex}`} />;
          }
          return <p key={`${index}-${lineIndex}`}>{line}</p>;
        });
      })}
    </div>
  );
}