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
  Play,
  Upload,
  ChevronDown
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
  const [originalMarkdown, setOriginalMarkdown] = useState<string>(PRESETS[0].content);
  const [history, setHistory] = useState<string[]>([]);
  
  // Selection tracking
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo>({
    text: '',
    start: 0,
    end: 0,
    isFullDoc: true,
    label: 'Full Document Selected (Default)'
  });

  // Mode and loading states
  const [mode, setMode] = useState<'original' | 'summarize' | 'expand'>('original');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
  
  // Preview tab: 'original' | 'preview' | 'html' | 'raw'
  const [previewTab, setPreviewTab] = useState<'original' | 'preview' | 'html' | 'raw'>('preview');
  
  // Copy state feedback
  const [copiedType, setCopiedType] = useState<'markdown' | 'html' | null>(null);

  // References
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setOriginalMarkdown(preset.content);
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
    setOriginalMarkdown('');
    setSelectionInfo({
      text: '',
      start: 0,
      end: 0,
      isFullDoc: true,
      label: 'Editor Empty'
    });
    setError(null);
  };

  // Local markdown file loader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text !== undefined) {
        setMarkdown(text);
        setOriginalMarkdown(text);
        setHistory(prev => [...prev, markdown]);
        setError(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
    setOriginalMarkdown(markdown); // Snapshot original markdown before AI starts streaming updates

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

      // SSE streams text chunks
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('Response stream not readable.');

      let accumulated = '';
      const beforeText = markdown.substring(0, selectionInfo.start);
      const afterText = markdown.substring(selectionInfo.end);

      let buffer = ''; // Buffer for incomplete network lines

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        // Save the last element (which is either empty or incomplete) back to the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          if (trimmedLine.startsWith('data: ')) {
            const rawData = trimmedLine.slice(6).trim();
            if (rawData === '[DONE]') {
              break;
            }
            if (rawData.startsWith('[ERROR]')) {
              throw new Error(rawData.slice(7).trim());
            }

            try {
              const payload = JSON.parse(rawData);
              if (payload && typeof payload.text === 'string') {
                accumulated += payload.text;
                
                // Incrementally update editor text
                const newMarkdown = beforeText + accumulated + afterText;
                setMarkdown(newMarkdown);
              }
            } catch (jsonErr) {
              console.warn('Failed to parse SSE JSON payload:', jsonErr);
            }
          }
        }
      }
      setIsLoading(false);
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
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".md,.txt,.markdown"
        className="hidden"
      />

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

        {/* TOP: Options and Control Center */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              AI Enhance Mode:
            </span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
              <button
                onClick={() => setMode('original')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'original'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Original (Hybrid)
              </button>
              <button
                onClick={() => setMode('summarize')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'summarize'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Summarize
              </button>
              <button
                onClick={() => setMode('expand')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'expand'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Expand
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Presets Custom Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold flex items-center gap-1.5 transition-all text-slate-700 dark:text-slate-350 shadow-sm"
              >
                <BookOpen className="h-4 w-4" />
                <span>Load Preset</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showPresetsDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showPresetsDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowPresetsDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-20 py-2 animate-fade-in">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          handleLoadPreset(preset);
                          setShowPresetsDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors flex flex-col gap-0.5"
                      >
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-205">{preset.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{preset.description}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Load File Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold flex items-center gap-1.5 transition-all text-slate-700 dark:text-slate-350 shadow-sm"
              title="Upload Local Markdown File"
            >
              <Upload className="h-4 w-4" />
              <span>Load File</span>
            </button>

            {/* Transform Execution Button */}
            <button
              onClick={handleTransform}
              disabled={isLoading || !selectionInfo.text}
              className={`py-2 px-4 rounded-xl font-semibold text-xs transition-all duration-300 flex items-center justify-center gap-1.5 text-white shadow-md ${
                isLoading || !selectionInfo.text
                  ? 'bg-slate-450 dark:bg-slate-800 cursor-not-allowed opacity-50 shadow-none'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 bg-white rounded-full dot-pulse"></span>
                    <span className="h-1.5 w-1.5 bg-white rounded-full dot-pulse dot-pulse-delay-1"></span>
                    <span className="h-1.5 w-1.5 bg-white rounded-full dot-pulse dot-pulse-delay-2"></span>
                  </div>
                  <span>Streaming...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Transform {selectionInfo.isFullDoc ? 'Draft' : 'Selection'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* BOTTOM: Workspace Panels (Editor / Preview 50-50 Split) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* LEFT: Editor Pane */}
          <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden lg:h-[calc(100vh-280px)] transition-colors">
            
            {/* Editor Header Bar */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-semibold">Markdown Editor</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-880 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  title="Undo last change"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleClear}
                  disabled={!markdown}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-880 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  title="Clear document"
                >
                  <Trash2 className="h-4 w-4 text-red-500/80" />
                </button>
              </div>
            </div>

            {/* Presets and Status info */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-wrap gap-2 items-center justify-between transition-colors">
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
            <div className="flex-1 relative bg-transparent min-h-[450px] lg:min-h-0">
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onSelect={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                onMouseUp={handleSelectionChange}
                className="absolute inset-0 w-full h-full p-6 resize-none bg-transparent outline-none font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 border-0 focus:ring-0 overflow-y-auto"
                placeholder="Type or paste your markdown here... Select text or position the cursor inside a paragraph to trigger token-optimized transformations."
              />
            </div>
            
          </div>

          {/* RIGHT: Preview Pane */}
          <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden lg:h-[calc(100vh-280px)] transition-colors">
            
            {/* Preview Header / Tabs */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 transition-colors">
              <div className="flex items-center gap-1.5 p-0.5 bg-slate-200/60 dark:bg-slate-800 rounded-lg">
                <button
                  onClick={() => setPreviewTab('original')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    previewTab === 'original'
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Original
                </button>
                <button
                  onClick={() => setPreviewTab('preview')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    previewTab === 'preview'
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Preview
                </button>
                <button
                  onClick={() => setPreviewTab('html')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    previewTab === 'html'
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  HTML
                </button>
                <button
                  onClick={() => setPreviewTab('raw')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    previewTab === 'raw'
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Raw
                </button>
              </div>

              {/* Utility Copy Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopyText('markdown')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold flex items-center gap-1.5 transition-all text-slate-650 dark:text-slate-350 shadow-sm"
                  title="Copy Raw Markdown"
                >
                  {copiedType === 'markdown' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>Markdown</span>
                </button>
                <button
                  onClick={() => handleCopyText('html')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold flex items-center gap-1.5 transition-all text-slate-650 dark:text-slate-350 shadow-sm"
                  title="Copy Compiled HTML"
                >
                  {copiedType === 'html' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>HTML</span>
                </button>
              </div>
            </div>

            {/* Display Body according to tab */}
            <div className="flex-1 p-6 overflow-y-auto bg-transparent relative">
              {previewTab === 'original' && (
                <MarkdownPreview 
                  markdown={originalMarkdown || '*No document loaded to preview.*'} 
                />
              )}
              {previewTab === 'preview' && (
                <MarkdownPreview 
                  markdown={markdown || '*Editor empty. Write something to see preview.*'} 
                />
              )}
              {previewTab === 'html' && (
                <pre className="text-xs font-mono whitespace-pre-wrap select-all text-slate-750 dark:text-slate-250 leading-relaxed p-2">
                  {markdown ? marked.parse(markdown) : '<!-- Write something to see compiled HTML -->'}
                </pre>
              )}
              {previewTab === 'raw' && (
                <pre className="text-xs font-mono whitespace-pre-wrap select-all text-slate-750 dark:text-slate-250 leading-relaxed p-2">
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
