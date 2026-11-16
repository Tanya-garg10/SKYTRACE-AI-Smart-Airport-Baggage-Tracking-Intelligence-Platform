import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Parse inline markdown elements: **bold**, *italic*, `code`
  const renderInline = (text: string): React.ReactNode[] => {
    // Regex matches: **bold**, *italic*, `code`
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={index} className="font-semibold text-[#F3F5F7]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={index} className="italic text-[#A8B6C7]">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded bg-[#0A101D] text-[#54D6E8] font-mono text-[11px] border border-[#A8B6C7]/15"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      renderedElements.push(
        <ul key={`ul-${renderedElements.length}`} className="my-1.5 space-y-1 list-disc list-inside">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    // Empty lines act as paragraph breaks
    if (!trimmed) {
      flushList();
      renderedElements.push(<div key={`empty-${lineIndex}`} className="h-2" />);
      return;
    }

    // Bullet list items (* or -)
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      currentList.push(
        <li key={`li-${lineIndex}`} className="text-[#E2E8F0] leading-relaxed">
          {renderInline(bulletMatch[1])}
        </li>
      );
      return;
    }

    // Numbered list items (1. 2.)
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberMatch) {
      flushList();
      renderedElements.push(
        <div key={`num-${lineIndex}`} className="flex gap-2 my-1 text-[#E2E8F0] leading-relaxed">
          <span className="font-mono text-[#54D6E8] font-medium">{numberMatch[1]}.</span>
          <div className="flex-1">{renderInline(numberMatch[2])}</div>
        </div>
      );
      return;
    }

    // Heading 3 or 4 (### or ####)
    if (trimmed.startsWith('### ')) {
      flushList();
      renderedElements.push(
        <h4 key={`h3-${lineIndex}`} className="font-semibold text-sm text-[#54D6E8] mt-2 mb-1">
          {renderInline(trimmed.replace(/^###\s+/, ''))}
        </h4>
      );
      return;
    }

    // Standard paragraph line
    flushList();
    renderedElements.push(
      <p key={`p-${lineIndex}`} className="text-[#E2E8F0] leading-relaxed">
        {renderInline(line)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-1.5 text-xs ${className}`}>{renderedElements}</div>;
}
