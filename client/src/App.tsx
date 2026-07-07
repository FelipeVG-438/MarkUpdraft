import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  BookOpen, 
  Code, 
  Sun, 
  Moon, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { PRESETS } from './presets';
import type { Preset } from './presets';
import { MarkdownPreview } from './components/MarkdownPreview';
import { marked } from 'marked';

interface SelectionInfo {
  text: string;
  start: number;
  end: number;
  isFullDoc: boolean;
  label: string;
}

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('markupdraft-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Editor states
  const [markdown, setMarkdown] = useState<string>(PRESETS[0].content);
  const [history, setHistory] = useState<string[]>([]);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  
  // Selection tracking
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo>({
    text: '',
    start: 0,
    end: 0,
    isFullDoc: true,
    label: 'Full Document Selected (Default)'
  });

  // Mode and loading states
  const [mode, setMode] = useState<'original' | 'summarize' | 'explain' | 'expand'>('original');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Preview tab: 'preview' | 'html' | 'raw'
  const [previewTab, setPreviewTab] = useState<'preview' | 'html' | 'raw'>('preview');
  
  // Copy state feedback
  const [copiedType, setCopiedType] = useState<'markdown' | 'html' | null>(null);

  // References
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Apply theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('markupdraft-theme', theme);
  }, [theme]);

  // Select first preset on init to update selection info
  useEffect(() => {
    if (textareaRef.current) {
      // Initialize selection info
      const val = textareaRef.current.value;
      const bounds = getActiveParagraphBounds(val, 0);
      setSelectionInfo({
        text: bounds.text,
        start: bounds.start,
        end: bounds.end,
        isFullDoc: bounds.text === val,
        label: bounds.text 
          ? `Cursor in Paragraph (about ${bounds.text.split(/\s+/).filter(Boolean).length} words)`
          : 'Editor Empty'
      });
    }
  }, []);

  // Helper to extract paragraph bounds based on cursor index
  const getActiveParagraphBounds = (text: string, cursorIndex: number) => {
    if (!text.trim()) return { start: 0, end: 0, text: '' };
    
    const paragraphs = text.split('\n\n');
    let currentPos = 0;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const pText = paragraphs[i];
      const pStart = currentPos;
      const pEnd = currentPos + pText.length;
      
      // paragraph index range (allowing for double newline gap)
      if (cursorIndex >= pStart && cursorIndex <= pEnd + 2) {
        return { 
          start: pStart, 
          end: Math.min(pEnd, text.length), 
          text: pText 
        };
      }
      currentPos = pEnd + 2;
    }
    
    return { start: 0, end: text.length, text };
  };

  // Textarea selection/cursor change handler
  const handleSelectionChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selectedText = textarea.value.substring(start, end);
      setSelectionInfo({
        text: selectedText,
        start,
        end,
        isFullDoc: false,
        label: `Selection: ${selectedText.split(/\s+/).filter(Boolean).length} words selected`
      });
    } else {
      const bounds = getActiveParagraphBounds(textarea.value, start);
      setSelectionInfo({
        text: bounds.text,
        start: bounds.start,
        end: bounds.end,
        isFullDoc: bounds.text === textarea.value,
        label: bounds.text.trim()
          ? `Active Block: Paragraph (approx. ${bounds.text.split(/\s+/).filter(Boolean).length} words)`
          : 'Editor Empty'
      });
    }
  };

  // Preset loader
  const handleLoadPreset = (preset: Preset) => {
    setHistory(prev => [...prev, markdown]);
    setMarkdown(preset.content);
    setExplanations({});
    setError(null);
    
    // Focus and reset cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(0, 0);
        const bounds = getActiveParagraphBounds(preset.content, 0);
        setSelectionInfo({
          text: bounds.text,
          start: bounds.start,
          end: bounds.end,
          isFullDoc: bounds.text === preset.content,
          label: `Active Block: Paragraph (approx. ${bounds.text.split(/\s+/).filter(Boolean).length} words)`
        });
      }
    }, 50);
  };

  // Undo action
  const handleUndo = () => {
    if (history.length === 0) return;
    const prevMarkdown = history[history.length - 1];
    setMarkdown(prevMarkdown);
    setHistory(prev => prev.slice(0, -1));
    setError(null);
  };

  // Clear text
  const handleClear = () => {
    setHistory(prev => [...prev, markdown]);
    setMarkdown('');
    setExplanations({});
    setSelectionInfo({
      text: '',
      start: 0,
      end: 0,
      isFullDoc: true,
      label: 'Editor Empty'
    });
    setError(null);
  };

  // Clipboard copy utilities
  const handleCopyText = async (type: 'markdown' | 'html') => {
    try {
      let textToCopy = '';
      if (type === 'markdown') {
        textToCopy = markdown;
      } else {
        textToCopy = String(marked.parse(markdown));
      }
      
      await navigator.clipboard.writeText(textToCopy);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Main transform trigger
  const handleTransform = async () => {
    // Determine the content block to process
    const textToProcess = selectionInfo.text.trim();
    if (!textToProcess) {
      setError('Please enter some text in the editor, or position your cursor inside a paragraph first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Save previous state to history
    setHistory(prev => [...prev, markdown]);

    try {
      const response = await fetch('http://localhost:3001/api/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToProcess,
          mode: mode
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Server transformation failed.');
      }

      if (mode === 'explain') {
        // JSON Extraction returns object mapping directly
        const payload = await response.json();
        if (payload && typeof payload === 'object') {
          setExplanations(prev => ({
            ...prev,
            ...payload
          }));
        } else {
          throw new Error('Invalid JSON schema returned by server.');
        }
        setIsLoading(false);
      } else {
        // SSE streams text chunks
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error('Response stream not readable.');

        let accumulated = '';
        const beforeText = markdown.substring(0, selectionInfo.start);
        const afterText = markdown.substring(selectionInfo.end);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                break;
              }
              // Add spaces/newlines formatting
              accumulated += data;
              
              // Incrementally update editor text
              const newMarkdown = beforeText + accumulated + afterText;
              setMarkdown(newMarkdown);
            }
          }
        }
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected connection error occurred.');
      setIsLoading(false);
    }
  };

  // Word and character stats
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const charCount = markdown.length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 glass shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 dark:bg-indigo-500 p-2 rounded-xl text-white shadow-md shadow-indigo-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                MarkUpdraft
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Token-Optimized AI Document Enhancer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              Gemini Online
            </span>

            {/* Dark mode switcher */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="h-4 w-4 text-slate-600" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        
        {/* Error Boundary Display */}
        {error && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 text-red-700 dark:text-red-400 flex items-start gap-3 shadow-sm animate-fade-in">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-sm">Processing Error</h3>
              <p className="text-xs mt-1 opacity-90">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-xs font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Workspace Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[calc(100vh-14rem)]">
          
          {/* LEFT: Editor Pane */}
          <div className="lg:col-span-5 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            
            {/* Editor Header Bar */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-semibold">Markdown Editor</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  title="Undo last change"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleClear}
                  disabled={!markdown}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  title="Clear document"
                >
                  <Trash2 className="h-4 w-4 text-red-500/80" />
                </button>
              </div>
            </div>

            {/* Presets and Status info */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-wrap gap-2 items-center justify-between">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                {selectionInfo.label}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                <span>{wordCount} w</span>
                <span>•</span>
                <span>{charCount} c</span>
              </div>
            </div>

            {/* Main Edit Textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onSelect={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                onMouseUp={handleSelectionChange}
                className="w-full h-full min-h-[450px] lg:min-h-0 p-6 resize-none bg-transparent outline-none font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 border-0 focus:ring-0"
                placeholder="Type or paste your markdown here... Select text or position the cursor inside a paragraph to trigger token-optimized transformations."
              />
            </div>
            
            {/* Quick Presets Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                Sample Sandbox Presets
              </span>
              <div className="flex flex-col gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleLoadPreset(preset)}
                    className="w-full text-left p-2 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-850 hover:shadow-sm transition-all duration-200 flex flex-col"
                  >
                    <span className="font-bold text-slate-700 dark:text-slate-350">{preset.name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* CENTER: AI Control Center */}
          <div className="lg:col-span-2 flex flex-col justify-center items-center gap-4 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-inner">
            <div className="w-full text-center">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                TRANSFORM MODE
              </h2>
            </div>
            
            {/* Mode selection buttons */}
            <div className="flex flex-col w-full gap-2">
              <button
                onClick={() => setMode('original')}
                className={`w-full p-3 rounded-xl border text-xs font-semibold text-left transition-all duration-200 flex flex-col gap-1 ${
                  mode === 'original'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>1. Original (Hybrid)</span>
                <span className={`text-[10px] ${mode === 'original' ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                  Local cleanup + grammatical smoothing
                </span>
              </button>

              <button
                onClick={() => setMode('summarize')}
                className={`w-full p-3 rounded-xl border text-xs font-semibold text-left transition-all duration-200 flex flex-col gap-1 ${
                  mode === 'summarize'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>2. Summarize (Streamed)</span>
                <span className={`text-[10px] ${mode === 'summarize' ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                  Scannable, visual bullet outlines
                </span>
              </button>

              <button
                onClick={() => setMode('explain')}
                className={`w-full p-3 rounded-xl border text-xs font-semibold text-left transition-all duration-200 flex flex-col gap-1 ${
                  mode === 'explain'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>3. Explain (JSON Extraction)</span>
                <span className={`text-[10px] ${mode === 'explain' ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                  Identify terms & load active tooltips
                </span>
              </button>

              <button
                onClick={() => setMode('expand')}
                className={`w-full p-3 rounded-xl border text-xs font-semibold text-left transition-all duration-200 flex flex-col gap-1 ${
                  mode === 'expand'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>4. Expand (Streamed)</span>
                <span className={`text-[10px] ${mode === 'expand' ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                  Elaborate and complete rough drafts
                </span>
              </button>
            </div>

            {/* Transform Execution Button */}
            <button
              onClick={handleTransform}
              disabled={isLoading || !selectionInfo.text}
              className={`w-full mt-2 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 text-white shadow-md ${
                isLoading || !selectionInfo.text
                  ? 'bg-slate-450 dark:bg-slate-800 cursor-not-allowed opacity-50 shadow-none'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="flex gap-1 items-center">
                    <span className="h-2 w-2 bg-white rounded-full dot-pulse"></span>
                    <span className="h-2 w-2 bg-white rounded-full dot-pulse dot-pulse-delay-1"></span>
                    <span className="h-2 w-2 bg-white rounded-full dot-pulse dot-pulse-delay-2"></span>
                  </div>
                  <span>Streaming...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Draft Transform</span>
                </>
              )}
            </button>

            {/* Selection scope hint */}
            <div className="text-center mt-2 px-1">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-normal">
                {selectionInfo.isFullDoc 
                  ? 'Targeting full editor workspace.' 
                  : 'Targeting active highlighted section.'
                }
              </span>
            </div>
          </div>

          {/* RIGHT: Preview Pane */}
          <div className="lg:col-span-5 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            
            {/* Preview Header / Tabs */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 p-0.5 bg-slate-200/60 dark:bg-slate-800 rounded-lg">
                <button
                  onClick={() => setPreviewTab('preview')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    previewTab === 'preview'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    Preview
                  </span>
                </button>
                <button
                  onClick={() => setPreviewTab('html')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    previewTab === 'html'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Code className="h-3.5 w-3.5" />
                    HTML View
                  </span>
                </button>
                <button
                  onClick={() => setPreviewTab('raw')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    previewTab === 'raw'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Markdown
                  </span>
                </button>
              </div>

              {/* Utility Copy Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopyText('markdown')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold flex items-center gap-1.5 transition-all text-slate-600 dark:text-slate-300"
                  title="Copy Raw Markdown"
                >
                  {copiedType === 'markdown' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>Markdown</span>
                </button>
                <button
                  onClick={() => handleCopyText('html')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold flex items-center gap-1.5 transition-all text-slate-600 dark:text-slate-300"
                  title="Copy Compiled HTML"
                >
                  {copiedType === 'html' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>HTML</span>
                </button>
              </div>
            </div>

            {/* Explanation items header */}
            {Object.keys(explanations).length > 0 && previewTab === 'preview' && (
              <div className="px-4 py-2 border-b border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-950/10 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {Object.keys(explanations).length} technical explanations loaded. Hover highlighted terms to inspect.
                </span>
              </div>
            )}

            {/* Display Body according to tab */}
            <div className="flex-1 p-6 overflow-y-auto min-h-[450px] lg:min-h-0 bg-transparent">
              {previewTab === 'preview' && (
                <MarkdownPreview 
                  markdown={markdown || '*Editor empty. Write something to see preview.*'} 
                  explanations={explanations} 
                />
              )}
              {previewTab === 'html' && (
                <pre className="text-xs font-mono whitespace-pre-wrap select-all text-slate-700 dark:text-slate-300 leading-relaxed">
                  {markdown ? marked.parse(markdown) : '<!-- Write something to see compiled HTML -->'}
                </pre>
              )}
              {previewTab === 'raw' && (
                <pre className="text-xs font-mono whitespace-pre-wrap select-all text-slate-700 dark:text-slate-300 leading-relaxed">
                  {markdown || '/* Editor empty. Write something to see raw Markdown. */'}
                </pre>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 dark:text-slate-650">
          MarkUpdraft &copy; 2026. Made with Google Antigravity & Gemini.
        </div>
      </footer>

    </div>
  );
}
