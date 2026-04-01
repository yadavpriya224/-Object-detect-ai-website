import React from 'react';
import { Copy, Terminal } from 'lucide-react';

interface CodeBlockProps {
  title: string;
  language: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ title, language, code }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 my-6 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-zinc-300">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 uppercase">
            {language}
          </span>
        </div>
        <button 
          onClick={handleCopy}
          className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
          title="Copy code"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-sm leading-relaxed text-zinc-300">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};