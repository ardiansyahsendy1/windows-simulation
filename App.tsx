
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';

// --- TYPE DEFINITIONS ---
interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface WindowInstance {
  id: string;
  appId: string;
  title: string;
  // Fix: Correctly type the icon to allow passing className prop.
  icon: React.ReactElement<{ className?: string }>;
  position: Position;
  size: Size;
  minSize: Size;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  isFocused: boolean;
  prevPosition?: Position;
  prevSize?: Size;
}

interface AppDefinition {
  id: string;
  name: string;
  // Fix: Correctly type the icon to allow passing className prop.
  icon: React.ReactElement<{ className?: string }>;
  component: React.FC;
  defaultSize: Size;
  minSize: Size;
}

// --- SVG ICONS ---
const NotepadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

const CalculatorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008zm3-6h.008v.008H11.25v-.008zm0 3h.008v.008H11.25v-.008zm0 3h.008v.008H11.25v-.008zm3-6h.008v.008H14.25v-.008zm0 3h.008v.008H14.25v-.008zM4.5 12.75h15m-15 3h15M7.5 18h9M3.375 10.5h17.25c.621 0 1.125-.504 1.125-1.125v-3.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v3.75c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const BrowserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 3a9 9 0 014.133 16.867M3.133 7.867A9.001 9.001 0 0112 3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 019-9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 01-9-9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 019 9" />
    </svg>
);


const GeminiIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.25c-5.376 0-9.75 4.374-9.75 9.75s4.374 9.75 9.75 9.75 9.75-4.374 9.75-9.75S17.376 2.25 12 2.25ZM9.663 15.837a.75.75 0 0 1-1.06 0l-1.062-1.06a.75.75 0 0 1 0-1.061l3.187-3.187a.75.75 0 0 1 1.061 0l1.06 1.06a.75.75 0 0 1 0 1.061l-3.186 3.187Zm4.674-4.674a.75.75 0 0 1-1.06 0L12.215 10.1a.75.75 0 0 1 0-1.06l1.06-1.061a.75.75 0 0 1 1.061 0l3.187 3.187a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.061 0l-1.062-1.06Z" />
  </svg>
);

const StartIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 16 16">
        <path d="M6.577 8.577H2.25V4.25h4.327v4.327zm0 5.173H2.25V9.423h4.327v4.327zm5.173 0H7.423V9.423h4.327v4.327zm0-5.173H7.423V4.25h4.327v4.327z" />
    </svg>
);

// --- APPLICATION COMPONENTS ---

const NotepadApp: React.FC = () => {
  return (
    <textarea
      className="w-full h-full p-2 bg-white text-black resize-none focus:outline-none"
      placeholder="Start typing..."
    />
  );
};

const CalculatorApp: React.FC = () => {
    const [display, setDisplay] = useState('0');
    const [firstOperand, setFirstOperand] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);

    const handleDigitClick = (digit: string) => {
        if (waitingForSecondOperand) {
            setDisplay(digit);
            setWaitingForSecondOperand(false);
        } else {
            setDisplay(display === '0' ? digit : display + digit);
        }
    };
    
    const handleOperatorClick = (nextOperator: string) => {
        const inputValue = parseFloat(display);

        if (operator && !waitingForSecondOperand) {
            const result = calculate(firstOperand!, inputValue, operator);
            setDisplay(String(result));
            setFirstOperand(result);
        } else {
            setFirstOperand(inputValue);
        }

        setWaitingForSecondOperand(true);
        setOperator(nextOperator);
    };

    const calculate = (first: number, second: number, op: string): number => {
        switch (op) {
            case '+': return first + second;
            case '-': return first - second;
            case '*': return first * second;
            case '/': return first / second;
            default: return second;
        }
    };
    
    const handleEqualsClick = () => {
        const inputValue = parseFloat(display);
        if (operator && firstOperand !== null) {
            const result = calculate(firstOperand, inputValue, operator);
            setDisplay(String(result));
            setFirstOperand(null);
            setOperator(null);
            setWaitingForSecondOperand(false);
        }
    };

    const handleClearClick = () => {
        setDisplay('0');
        setFirstOperand(null);
        setOperator(null);
        setWaitingForSecondOperand(false);
    };

    const buttons = [
        'C', '+/-', '%', '/',
        '7', '8', '9', '*',
        '4', '5', '6', '-',
        '1', '2', '3', '+',
        '0', '.', '='
    ];

    const handleClick = (btn: string) => {
        if (btn >= '0' && btn <= '9' || btn === '.') {
            handleDigitClick(btn);
        } else if (['+', '-', '*', '/'].includes(btn)) {
            handleOperatorClick(btn);
        } else if (btn === '=') {
            handleEqualsClick();
        } else if (btn === 'C') {
            handleClearClick();
        }
    };

    return (
        <div className="bg-gray-800 h-full flex flex-col p-2 gap-2">
            <div className="bg-gray-900 text-white text-right text-4xl p-4 rounded">{display}</div>
            <div className="grid grid-cols-4 gap-2 flex-grow">
                {buttons.map((btn) => (
                    <button
                        key={btn}
                        onClick={() => handleClick(btn)}
                        className={`text-2xl rounded text-white ${btn === '0' ? 'col-span-2' : ''} ${['/', '*', '-', '+', '='].includes(btn) ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                    >
                        {btn}
                    </button>
                ))}
            </div>
        </div>
    );
};

const BrowserApp: React.FC = () => {
  const [url, setUrl] = useState('https://www.google.com/webhp?igu=1');
  const [inputValue, setInputValue] = useState('https://www.google.com');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = inputValue;
    if (!/^https?:\/\//i.test(inputValue)) {
      finalUrl = `https://www.google.com/search?q=${encodeURIComponent(inputValue)}`;
    }
    // Append a parameter to suggest to Google not to send X-Frame-Options header
    const urlObj = new URL(finalUrl);
    if(urlObj.hostname.includes("google.com")){
        urlObj.searchParams.set("igu", "1");
        setUrl(urlObj.toString());
    } else {
        setUrl(finalUrl);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-200">
      <div className="p-2 bg-gray-300 flex items-center gap-2">
        <form onSubmit={handleSearch} className="flex-grow">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-2 py-1 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>
      <iframe
        src={url}
        className="w-full h-full border-0"
        title="Browser"
        sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
      ></iframe>
    </div>
  );
};


const GeminiChatApp: React.FC = () => {
  const [history, setHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
        chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [history]);
  
  const startChat = useCallback(() => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: [],
        });
    } catch (error) {
        console.error("Failed to initialize Gemini:", error);
        setHistory([{ role: 'model', text: 'Error: Could not initialize AI. Is the API key set correctly?' }]);
    }
  }, []);

  useEffect(() => {
    startChat();
  }, [startChat]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatRef.current) return;

    const userMessage = { role: 'user' as const, text: input };
    setHistory(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatRef.current.sendMessage({ message: input });
      const modelResponse = { role: 'model' as const, text: result.text };
      setHistory(prev => [...prev, modelResponse]);
    } catch (error) {
      console.error("Gemini API error:", error);
      const errorMessage = { role: 'model' as const, text: "Sorry, I encountered an error. Please try again." };
      setHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-800 text-white">
      <div ref={chatHistoryRef} className="flex-grow p-4 overflow-y-auto space-y-4">
        {history.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg bg-gray-600 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
            </div>
        )}
      </div>
      <div className="p-2 border-t border-gray-700 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-grow bg-gray-700 p-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 px-4 py-2 rounded-r-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
};


// --- UI SHELL COMPONENTS ---

interface WindowComponentProps {
  instance: WindowInstance;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onDrag: (id: string, pos: Position) => void;
  onResize: (id: string, size: Size, pos: Position) => void;
  children: React.ReactNode;
}

const WindowComponent: React.FC<WindowComponentProps> = ({
  instance, onClose, onMinimize, onMaximize, onFocus, onDrag, onResize, children
}) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ isDragging: false, offset: { x: 0, y: 0 } });
  const resizeRef = useRef({ isResizing: false, direction: '', startPos: { x: 0, y: 0 }, startSize: { width: 0, height: 0 }, startWindowPos: {x: 0, y: 0} });

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (instance.isMaximized) return;
    onFocus(instance.id);
    dragRef.current = {
      isDragging: true,
      offset: {
        x: e.clientX - instance.position.x,
        y: e.clientY - instance.position.y,
      },
    };
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current.isDragging) return;
    let newX = e.clientX - dragRef.current.offset.x;
    let newY = e.clientY - dragRef.current.offset.y;

    // Clamp position to be within viewport
    const taskbarHeight = 40;
    newX = Math.max(0, Math.min(newX, window.innerWidth - instance.size.width));
    newY = Math.max(0, Math.min(newY, window.innerHeight - instance.size.height - taskbarHeight));

    onDrag(instance.id, { x: newX, y: newY });
  }, [instance.id, instance.size.width, instance.size.height, onDrag]);

  const handleDragEnd = useCallback(() => {
    dragRef.current.isDragging = false;
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  }, [handleDragMove]);

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, direction: string) => {
    e.stopPropagation();
    onFocus(instance.id);
    resizeRef.current = {
      isResizing: true,
      direction,
      startPos: { x: e.clientX, y: e.clientY },
      startSize: { ...instance.size },
      startWindowPos: { ...instance.position }
    };
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizeRef.current.isResizing) return;
    
    const dx = e.clientX - resizeRef.current.startPos.x;
    const dy = e.clientY - resizeRef.current.startPos.y;
    
    let newWidth = resizeRef.current.startSize.width;
    let newHeight = resizeRef.current.startSize.height;
    let newX = resizeRef.current.startWindowPos.x;
    let newY = resizeRef.current.startWindowPos.y;

    if (resizeRef.current.direction.includes('e')) newWidth += dx;
    if (resizeRef.current.direction.includes('s')) newHeight += dy;
    if (resizeRef.current.direction.includes('w')) {
        newWidth -= dx;
        newX += dx;
    }
    if (resizeRef.current.direction.includes('n')) {
        newHeight -= dy;
        newY += dy;
    }
    
    newWidth = Math.max(instance.minSize.width, newWidth);
    newHeight = Math.max(instance.minSize.height, newHeight);

    onResize(instance.id, { width: newWidth, height: newHeight }, { x: newX, y: newY });
  }, [instance.id, instance.minSize.width, instance.minSize.height, onResize]);

  const handleResizeEnd = useCallback(() => {
    resizeRef.current.isResizing = false;
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

  const resizeHandles = [
    { direction: 'n', cursor: 'ns-resize', className: 'top-0 left-1/2 -translate-x-1/2 h-1 w-full' },
    { direction: 's', cursor: 'ns-resize', className: 'bottom-0 left-1/2 -translate-x-1/2 h-1 w-full' },
    { direction: 'e', cursor: 'ew-resize', className: 'right-0 top-1/2 -translate-y-1/2 w-1 h-full' },
    { direction: 'w', cursor: 'ew-resize', className: 'left-0 top-1/2 -translate-y-1/2 w-1 h-full' },
    { direction: 'nw', cursor: 'nwse-resize', className: 'top-0 left-0 h-2 w-2' },
    { direction: 'ne', cursor: 'nesw-resize', className: 'top-0 right-0 h-2 w-2' },
    { direction: 'sw', cursor: 'nesw-resize', className: 'bottom-0 left-0 h-2 w-2' },
    { direction: 'se', cursor: 'nwse-resize', className: 'bottom-0 right-0 h-2 w-2' },
  ];

  return (
    <div
      ref={windowRef}
      className={`absolute flex flex-col bg-gray-700 border border-gray-500/50 rounded-lg shadow-2xl transition-all duration-100 ease-out ${instance.isMinimized ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100'} ${instance.isFocused ? 'shadow-blue-500/50' : 'shadow-black/50'}`}
      style={{
        top: instance.isMaximized ? 0 : instance.position.y,
        left: instance.isMaximized ? 0 : instance.position.x,
        width: instance.isMaximized ? '100vw' : instance.size.width,
        height: instance.isMaximized ? 'calc(100vh - 40px)' : instance.size.height,
        zIndex: instance.zIndex,
      }}
      onMouseDown={() => onFocus(instance.id)}
    >
      <div
        className="flex items-center h-8 bg-gray-800 text-white px-2 rounded-t-lg select-none"
        onMouseDown={handleDragStart}
        onDoubleClick={() => onMaximize(instance.id)}
      >
        <div className="flex items-center gap-2 flex-grow">
            {React.cloneElement(instance.icon, { className: "w-4 h-4" })}
            <span className="text-sm">{instance.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onMinimize(instance.id)} className="w-5 h-5 flex justify-center items-center hover:bg-gray-600 rounded">_</button>
          <button onClick={() => onMaximize(instance.id)} className="w-5 h-5 flex justify-center items-center hover:bg-gray-600 rounded">
            {instance.isMaximized ? '❐' : '□'}
          </button>
          <button onClick={() => onClose(instance.id)} className="w-5 h-5 flex justify-center items-center hover:bg-red-500 rounded">×</button>
        </div>
      </div>
      <div className="flex-grow overflow-hidden bg-gray-200">
        {children}
      </div>
      {!instance.isMaximized && resizeHandles.map(handle => (
        <div
          key={handle.direction}
          className={`absolute ${handle.className}`}
          style={{ cursor: handle.cursor }}
          onMouseDown={(e) => handleResizeStart(e, handle.direction)}
        />
      ))}
    </div>
  );
};

interface TaskbarProps {
  windows: WindowInstance[];
  onTaskbarClick: (id: string) => void;
  onStartClick: () => void;
}

const Taskbar: React.FC<TaskbarProps> = ({ windows, onTaskbarClick, onStartClick }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000 * 60); // Update every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gray-800/80 backdrop-blur-md flex items-center px-2 z-50 text-white">
      <button onClick={onStartClick} className="p-2 hover:bg-white/20 rounded">
        <StartIcon className="w-5 h-5" />
      </button>
      <div className="h-full border-l border-white/20 mx-2"></div>
      <div className="flex-grow flex items-center gap-1">
        {windows.map(win => (
          <button
            key={win.id}
            onClick={() => onTaskbarClick(win.id)}
            className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-white/20 h-8 max-w-xs transition-colors ${win.isFocused ? 'bg-white/20' : 'bg-white/10'}`}
          >
            {React.cloneElement(win.icon, { className: "w-4 h-4" })}
            <span className="text-sm truncate">{win.title}</span>
          </button>
        ))}
      </div>
      <div className="text-sm text-right px-2">
        <div>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div>{time.toLocaleDateString()}</div>
      </div>
    </div>
  );
};

interface StartMenuProps {
  isOpen: boolean;
  onAppClick: (appId: string) => void;
}

const StartMenu: React.FC<StartMenuProps> = ({ isOpen, onAppClick }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-10 left-0 w-80 h-96 bg-gray-800/80 backdrop-blur-md rounded-lg p-4 z-50 text-white shadow-lg">
      <div className="grid grid-cols-4 gap-4">
        {APPLICATIONS.map(app => (
          <button
            key={app.id}
            onClick={() => onAppClick(app.id)}
            className="flex flex-col items-center justify-center p-2 rounded hover:bg-white/20 text-center"
          >
            {React.cloneElement(app.icon, { className: "w-8 h-8 mb-1" })}
            <span className="text-xs">{app.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// --- APP CONSTANTS ---
const APPLICATIONS: AppDefinition[] = [
  { id: 'notepad', name: 'Notepad', icon: <NotepadIcon />, component: NotepadApp, defaultSize: { width: 500, height: 400 }, minSize: { width: 250, height: 200 } },
  { id: 'calculator', name: 'Calculator', icon: <CalculatorIcon />, component: CalculatorApp, defaultSize: { width: 300, height: 450 }, minSize: { width: 250, height: 350 } },
  { id: 'browser', name: 'Browser', icon: <BrowserIcon />, component: BrowserApp, defaultSize: { width: 800, height: 600 }, minSize: { width: 400, height: 300 } },
  { id: 'gemini', name: 'Gemini Chat', icon: <GeminiIcon />, component: GeminiChatApp, defaultSize: { width: 600, height: 700 }, minSize: { width: 350, height: 400 } },
];

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [isStartMenuOpen, setStartMenuOpen] = useState(false);
  const nextZIndex = useRef(10);
  const desktopRef = useRef<HTMLDivElement>(null);

  const openApp = (appId: string) => {
    const appDef = APPLICATIONS.find(app => app.id === appId);
    if (!appDef) return;

    const newWindow: WindowInstance = {
      id: `${appId}-${Date.now()}`,
      appId: appDef.id,
      title: appDef.name,
      icon: appDef.icon,
      position: { x: 50 + Math.random() * 200, y: 50 + Math.random() * 100 },
      size: appDef.defaultSize,
      minSize: appDef.minSize,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex.current++,
      isFocused: true,
    };

    setWindows(prev =>
      prev.map(w => ({ ...w, isFocused: false })).concat(newWindow)
    );
    setStartMenuOpen(false);
  };

  const closeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };
  
  const focusWindow = (id: string) => {
    setWindows(prev =>
      prev.map(w =>
        w.id === id
          ? { ...w, isFocused: true, isMinimized: false, zIndex: nextZIndex.current++ }
          : { ...w, isFocused: false }
      )
    );
  };

  const minimizeWindow = (id: string) => {
    setWindows(prev =>
      prev.map(w =>
        w.id === id ? { ...w, isMinimized: true, isFocused: false } : w
      )
    );
  };

  const maximizeWindow = (id: string) => {
    setWindows(prev =>
      prev.map(w => {
        if (w.id === id) {
            if (w.isMaximized) {
                return { ...w, isMaximized: false, position: w.prevPosition || w.position, size: w.prevSize || w.size };
            } else {
                return { ...w, isMaximized: true, prevPosition: w.position, prevSize: w.size };
            }
        }
        return w;
      })
    );
  };

  const handleTaskbarClick = (id: string) => {
    const win = windows.find(w => w.id === id);
    if (!win) return;
    if (win.isMinimized) {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: false, isFocused: true, zIndex: nextZIndex.current++ } : { ...w, isFocused: false }));
    } else {
        if (win.isFocused) {
            minimizeWindow(id);
        } else {
            focusWindow(id);
        }
    }
  };

  const handleDrag = (id: string, position: Position) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, position } : w));
  };

  const handleResize = (id: string, size: Size, position: Position) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, size, position } : w));
  };

  const handleDesktopClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === desktopRef.current) {
        setWindows(prev => prev.map(w => ({ ...w, isFocused: false })));
        setStartMenuOpen(false);
    }
  };

  return (
    <div 
        ref={desktopRef}
        className="w-screen h-screen overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url('https://picsum.photos/1920/1080?blur=1')` }}
        onClick={handleDesktopClick}
    >
      {windows.map(win => {
        const App = APPLICATIONS.find(app => app.id === win.appId)?.component;
        return (
          <WindowComponent
            key={win.id}
            instance={win}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            onMaximize={maximizeWindow}
            onFocus={focusWindow}
            onDrag={handleDrag}
            onResize={handleResize}
          >
            {App ? <App /> : <div>App not found</div>}
          </WindowComponent>
        );
      })}
      
      <StartMenu isOpen={isStartMenuOpen} onAppClick={openApp} />
      <Taskbar windows={windows} onTaskbarClick={handleTaskbarClick} onStartClick={() => setStartMenuOpen(p => !p)} />
    </div>
  );
};

export default App;
