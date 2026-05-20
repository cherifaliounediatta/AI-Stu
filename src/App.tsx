import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Cpu,
  Layers,
  Terminal,
  Check,
  AlertCircle,
  ArrowRight,
  Edit3,
  Trash2,
  RefreshCw,
  Send,
  Code,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface HealthData {
  status: string;
  env: {
    hasApiKey: boolean;
    nodeEnv: string;
  };
}

export default function App() {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [showSystemConfig, setShowSystemConfig] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash');
  const [isGenerating, setIsGenerating] = useState(false);

  // Scratchpad state
  const [scratchpad, setScratchpad] = useState(() => {
    return localStorage.getItem('ai_studio_scratchpad') || 
      '// AI Studio Scratchpad\n// Use this space to sketch ideas, structure code, or save useful prompts.\n// Stays securely saved in your browser storage!\n\n- Build high-contrast layouts\n- Leverage custom server.ts for Gemini API\n- Explore interactive tools!';
  });

  // Health and backend status state
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompt cards
  const suggestedPrompts = [
    {
      title: "Explore Tailwind v4",
      desc: "What's new in the modern v4 utility engine?",
      prompt: "Explain the key standout features and installation benefits of Tailwind CSS v4 in short, simple bullet points."
    },
    {
      title: "Single-Screen Ideas",
      desc: "Get elegant micro-app ideas to build.",
      prompt: "Brainstorm 3 cohesive, micro-sized single-screen app concepts that can be masterfully designed with React + Tailwind."
    },
    {
      title: "UI Design Principles",
      desc: "Learn core aesthetic styling guidelines.",
      prompt: "Give me 5 essential design layout rules for building high-contrast, beautiful developer dashboards that look highly premium."
    }
  ];

  // Save scratchpad
  useEffect(() => {
    localStorage.setItem('ai_studio_scratchpad', scratchpad);
  }, [scratchpad]);

  // Check health on mount
  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        setHealth(null);
      }
    } catch (err) {
      console.error('Error checking API health:', err);
      setHealth(null);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear Chat History
  const clearChat = () => {
    setMessages([]);
  };

  // Submit Prompt
  const handleSubmitPrompt = async (textToSend: string) => {
    if (!textToSend.trim() || isGenerating) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    try {
      // Gather dialogue context from state
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: textToSend,
          systemInstruction: systemInstruction.trim() || undefined,
          model: selectedModel,
          history: chatHistory,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: `⚠️ **Server Integration Error:**\n\n${data.error || 'Failed to generate a response.'}\n\n*Note: Please make sure you have loaded a Gemini API Key in the **Secrets** panel.*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `⚠️ **Network Connection Failed:**\n\nCould not reach the server endpoint. Ensure your backend server is fully responsive on development port 3000.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Absolute background accent */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-gradient-to-tr from-cyan-500/5 via-blue-500/5 to-transparent rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md relative z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/15">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-md font-semibold tracking-wide text-slate-200">
                AI Studio
              </h1>
              <p className="text-xs text-slate-400 font-mono">Developer Sandbox</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={checkHealth}
              disabled={isCheckingHealth}
              className="p-2 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              title="Refresh Health Check"
            >
              <RefreshCw className={`w-4 h-4 ${isCheckingHealth ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-900 bg-slate-950 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Port: 3000 Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* LEFT COLUMN: Dashboard / Environment Status & Scratchpad (4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Environment Status Card */}
          <div className="bg-slate-900/40 border border-slate-900 backdrop-blur-md rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-400" />
                <h3 className="font-medium text-sm text-slate-300">Environment Status</h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400">v1.0.0</span>
            </div>

            {/* Health Indicators */}
            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-400 block mb-1">API Integration State</span>
                <AnimatePresence mode="wait">
                  {isCheckingHealth ? (
                    <motion.div
                      key="checking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-slate-400 flex items-center gap-2 font-mono py-1"
                    >
                      <div className="w-2 h-2 rounded-full bg-amber-500/50 animate-pulse" />
                      Checking API secret binding...
                    </motion.div>
                  ) : health?.env.hasApiKey ? (
                    <motion.div
                      key="connected"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Gemini API Connection Secured
                    </motion.div>
                  ) : (
                    <motion.div
                      key="notactive"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-semibold mb-1">GEMINI_API_KEY Not Loaded</p>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            Open <strong className="text-amber-300">Settings &gt; Secrets</strong> in the interface panel, add your key, and restart. Client-side queries are routed securely via our unified Express server as required.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Technologies list */}
              <div className="pt-2 border-t border-slate-800/40">
                <span className="text-xs text-slate-400 block mb-2">Available Workspace Libraries</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'React 19',
                    '@google/genai-sdk',
                    'Tailwind V4',
                    'Framer Motion',
                    'Express-Proxy',
                    'Lucide CSS icons'
                  ].map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Scratchpad */}
          <div className="bg-slate-900/40 border border-slate-900 backdrop-blur-md rounded-xl p-5 shadow-lg flex-1 flex flex-col gap-3 min-h-[250px]">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-slate-400" />
                <h3 className="font-medium text-sm text-slate-300">Workspace Scratchpad</h3>
              </div>
              <button
                onClick={() => setScratchpad('')}
                className="text-slate-500 hover:text-slate-300 text-xs underline cursor-pointer"
                title="Clear Notes"
              >
                Clear
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-1">
              Store scratch variables, prompt frameworks, or drafts below. Updates are synced automatically to localStorage.
            </p>

            <textarea
              className="flex-1 w-full bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed transition-colors focus:ring-1 focus:ring-indigo-500/20"
              value={scratchpad}
              onChange={(e) => setScratchpad(e.target.value)}
              placeholder="Start drafting coordinates or note layouts..."
            />
          </div>

        </section>

        {/* RIGHT COLUMN: Full GPT/Gemini AI API Chat Sandbox Console (8 cols) */}
        <section className="lg:col-span-8 flex flex-col bg-slate-900/20 border border-slate-900 backdrop-blur-md rounded-2xl p-6 min-h-[500px] shadow-xl relative overflow-hidden">
          
          {/* Subtle design header within sandbox */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4 mb-4">
            
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              <div>
                <h2 className="text-md font-semibold text-slate-200">Server-Side Sandbox</h2>
                <p className="text-xs text-slate-400">Secure gateway to experimental Google GenAI models</p>
              </div>
            </div>

            {/* Model & System Prompt Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              <div className="flex flex-col">
                <select
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500/50 font-mono transition-colors"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (Standard)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
                </select>
              </div>

              <button
                onClick={() => setShowSystemConfig(!showSystemConfig)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  showSystemConfig 
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 font-semibold' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                System Instruction {systemInstruction.trim() ? '•' : ''}
              </button>

              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-xs bg-slate-950 hover:bg-red-550/10 border border-slate-850 hover:border-red-500/20 text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>
          </div>

          {/* System Instructions Panel */}
          <AnimatePresence>
            {showSystemConfig && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mb-4"
              >
                <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl flex flex-col gap-2">
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    Set Custom System Instruction / Persona
                  </span>
                  <p className="text-[11px] text-slate-400 leading-normal mb-1">
                    Guide the behavior of the model permanently during the conversation (e.g. "Summarize briefly in a warm, friendly voice").
                  </p>
                  <input
                    type="text"
                    value={systemInstruction}
                    onChange={(e) => setSystemInstruction(e.target.value)}
                    placeholder="Enter instructions (e.g., You are a strict JavaScript compiler, point out bugs with humorous snark)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conversation Area */}
          <div className="flex-1 overflow-y-auto mb-4 min-h-[300px] border border-slate-900 bg-slate-950/40 rounded-xl p-4 flex flex-col gap-4 scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-800">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 max-w-lg mx-auto">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full mb-4">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300 mb-1.5">Your Sandbox Sandbox is Active</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Test prompt patterns, check performance, or review markdown rendering outputs. Select a pre-configured prompt category below to begin or draft your own.
                </p>

                {/* Suggested prompt chips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  {suggestedPrompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(item.prompt);
                        handleSubmitPrompt(item.prompt);
                      }}
                      className="text-left p-3 rounded-xl border border-slate-850 hover:border-indigo-500/30 bg-slate-900/20 hover:bg-slate-900/50 transition-all cursor-pointer group"
                    >
                      <span className="text-indigo-400 font-medium text-[11px] block group-hover:text-indigo-300 transition-colors mb-0.5">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-light block leading-relaxed line-clamp-2">
                        {item.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] tracking-wide text-slate-500 font-mono">
                      <span>{msg.role === 'user' ? 'DEVELOPER' : 'GEMINI MODEL'}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-4.5 text-xs leading-relaxed transition-all shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-indigo-500/10 text-indigo-100 border border-indigo-500/20 rounded-tr-none'
                          : 'bg-slate-900/80 text-slate-200 border border-slate-800 rounded-tl-none font-sans whitespace-pre-wrap'
                      }`}
                    >
                      {msg.role === 'model' ? (
                        <div className="prose prose-invert prose-xs max-w-full">
                          {/* Rich Text Representation - Standard formatted line parsing */}
                          {msg.content.split('\n').map((line, lIdx) => {
                            // Render simple headings
                            if (line.startsWith('### ')) {
                              return <h4 key={lIdx} className="text-slate-100 font-bold border-b border-slate-800/60 pb-1 mt-3 mb-1.5 text-xs font-mono">{line.replace('### ', '')}</h4>;
                            }
                            if (line.startsWith('## ')) {
                              return <h3 key={lIdx} className="text-slate-100 font-bold border-b border-slate-800/60 pb-1.5 mt-4 mb-2 text-sm font-mono">{line.replace('## ', '')}</h3>;
                            }
                            // Bold text formatting
                            let lineContent: ReactNode = line;
                            if (line.includes('**')) {
                              const regex = /\*\*(.*?)\*\*/g;
                              const parts = [];
                              let lastIdx = 0;
                              let match;
                              while ((match = regex.exec(line)) !== null) {
                                if (match.index > lastIdx) {
                                  parts.push(line.substring(lastIdx, match.index));
                                }
                                parts.push(<strong key={match.index} className="text-indigo-400 font-bold">{match[1]}</strong>);
                                lastIdx = regex.lastIndex;
                              }
                              if (lastIdx < line.length) {
                                parts.push(line.substring(lastIdx));
                              }
                              lineContent = parts.length > 0 ? parts : line;
                            }
                            // Lists
                            if (line.startsWith('- ') || line.startsWith('* ')) {
                              return (
                                <div key={lIdx} className="flex gap-2 pl-2 my-1">
                                  <span className="text-indigo-500">•</span>
                                  <span>{typeof lineContent === 'string' ? line.substring(2) : lineContent}</span>
                                </div>
                              );
                            }
                            return <p key={lIdx} className="min-h-[1em] mb-1.5 text-slate-300 leading-relaxed font-sans">{lineContent}</p>;
                          })}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                
                {isGenerating && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] tracking-wide text-slate-500 font-mono">
                      <span>GEMINI MODEL</span>
                      <span>•</span>
                      <span>Thinking...</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="ml-1 text-slate-400 font-mono text-[10px]">Assembling token output...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Form Content */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitPrompt(input);
            }}
            className="flex items-center gap-2 relative mt-auto"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isGenerating ? "Gemini is generating code..." : "Ask Gemini about coding, style guidelines, or draft templates..."}
              disabled={isGenerating}
              className="flex-1 bg-slate-950 border border-slate-850 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all pr-12 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="absolute right-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all absolute-center cursor-pointer disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed shadow shadow-indigo-500/20"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950/40 relative z-10 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 text-center sm:text-left">
          <p>© 2026 AI Studio. Clean container-hosted development environments.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Developer Mode Active
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
