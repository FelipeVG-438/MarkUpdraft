import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Tooltip } from './Tooltip';

interface MarkdownPreviewProps {
  markdown: string;
  explanations: Record<string, string>;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ markdown, explanations }) => {
  // Sort terms by length in descending order to avoid matching substrings of longer terms first
  const sortedTerms = Object.keys(explanations).sort((a, b) => b.length - a.length);

  const highlightText = (text: string): React.ReactNode => {
    if (!text || sortedTerms.length === 0) return text;

    let parts: React.ReactNode[] = [text];

    for (const term of sortedTerms) {
      const nextParts: React.ReactNode[] = [];
      for (const part of parts) {
        if (typeof part !== 'string') {
          nextParts.push(part);
          continue;
        }

        // Case-sensitive exact match check
        const index = part.indexOf(term);
        if (index === -1) {
          nextParts.push(part);
          continue;
        }

        let remaining = part;
        while (remaining.indexOf(term) !== -1) {
          const idx = remaining.indexOf(term);
          const before = remaining.substring(0, idx);
          const matched = remaining.substring(idx, idx + term.length);
          remaining = remaining.substring(idx + term.length);

          if (before) nextParts.push(before);
          nextParts.push(
            <Tooltip key={`${term}-${idx}`} term={matched} definition={explanations[term]}>
              {matched}
            </Tooltip>
          );
        }
        if (remaining) nextParts.push(remaining);
      }
      parts = nextParts;
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  const processChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string') {
        return highlightText(child);
      }
      if (React.isValidElement(child)) {
        // If it's a code block or link, do not highlight inside it
        if (child.type === 'code' || child.type === 'pre' || child.type === 'a') {
          return child;
        }
        // Recursively highlight children if they exist
        const props = child.props as any;
        if (props && props.children) {
          // Clone and process child's children
          return React.cloneElement(child as React.ReactElement<any>, {
            children: processChildren(props.children),
          });
        }
      }
      return child;
    });
  };

  // Custom renderers to intercept text rendering under standard elements
  const customRenderers = {
    p: ({ children }: any) => <p>{processChildren(children)}</p>,
    li: ({ children }: any) => <li>{processChildren(children)}</li>,
    h1: ({ children }: any) => <h1>{processChildren(children)}</h1>,
    h2: ({ children }: any) => <h2>{processChildren(children)}</h2>,
    h3: ({ children }: any) => <h3>{processChildren(children)}</h3>,
    h4: ({ children }: any) => <h4>{processChildren(children)}</h4>,
    h5: ({ children }: any) => <h5>{processChildren(children)}</h5>,
    h6: ({ children }: any) => <h6>{processChildren(children)}</h6>,
    td: ({ children }: any) => <td>{processChildren(children)}</td>,
    th: ({ children }: any) => <th>{processChildren(children)}</th>,
  };

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-indigo-600 prose-a:dark:text-indigo-400 prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-800 prose-img:rounded-xl">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]} 
        components={customRenderers as any}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};
