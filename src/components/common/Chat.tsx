import React, { useState, useRef, useEffect } from 'react';
import { CloudUpload, Trash2, Loader2, BookOpen, User, Bot, Download, AlertTriangle } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/button';
import { fetchWithTokenRefresh } from '../../utils/authService';
import { API_BASE_URL } from '../../utils/config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTheme } from '@/context/ThemeContext';

type Message = { role: 'user' | 'bot'; text: string };

interface ChatProps {
  role?: string;
}

const ChatWithPDF: React.FC<ChatProps> = ({ role }) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const { theme } = useTheme();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File',
          description: 'Only PDF files are supported.',
        });
      }
    }
  };

  const handleClearFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await fetchWithTokenRefresh(`${API_BASE_URL}/upload-pdf/`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setChatStarted(true);
        toast({
          title: 'Success',
          description: 'PDF uploaded and ready for revision!',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'An error occurred while uploading the PDF.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetchWithTokenRefresh(`${API_BASE_URL}/ask-question/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const formattedAnswer = `
          <div style="background-color: ${theme === 'dark' ? 'hsl(var(--card))' : '#f0f4ff'}; padding: 1rem; border-radius: 8px; border-left: 4px solid hsl(var(--primary)); font-family: sans-serif;">
            <h3 style="margin-top: 0; color: hsl(var(--primary));">📘 Quick Revision Note:</h3>
            <div style="color: ${theme === 'dark' ? 'hsl(var(--card-foreground))' : '#000'}">
              ${data.answer
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>')
                .split('. ')
                .filter(sentence => sentence)
                .join('.<br>')}.
            </div>
          </div>
        `;


        const botMessage: Message = { role: 'bot', text: formattedAnswer };
        setMessages((prev) => [...prev, botMessage]);
      }
      else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch response');
      }
    } catch (error) {
      console.error('Error fetching response:', error);
      const errorMessage: Message = {
        role: 'bot',
        text: `**Error:** ${error instanceof Error ? error.message : "Sorry, I couldn't fetch the answer."}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred while fetching the answer.',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (chatContainerRef.current) {
      const input = chatContainerRef.current;

      html2canvas(input).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save('chat-export.pdf');
      });
    }
  };

  if (!chatStarted) {
    return (
      <div className={`min-h-screen flex flex-col items-center p-4 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`max-w-2xl w-full rounded-2xl shadow-xl p-8 ${theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
          <div className="text-center mb-6">
            <BookOpen className={`mx-auto w-12 h-12 mb-3 ${theme === 'dark' ? 'text-primary' : 'text-blue-600'}`} />
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Revision Buddy</h1>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Upload a PDF to start quick revision or reference key concepts.</p>
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-4 border-dashed rounded-xl p-6 text-center transition-colors ${
              dragActive 
                ? theme === 'dark' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-blue-400 bg-blue-50' 
                : theme === 'dark' 
                  ? 'border-border bg-card' 
                  : 'border-gray-300 bg-white'
            }`}
          >
            <CloudUpload className={`mx-auto w-10 h-10 mb-3 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`} />
            <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Drag & drop your PDF here</p>
            <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>or click to select (PDF only, max 50MB)</p>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer inline-block px-4 py-2 rounded-lg text-sm font-medium transition ${
                theme === 'dark' 
                  ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Choose File
            </label>
            {file && (
              <div className={`mt-4 flex items-center justify-between rounded-lg p-3 ${
                theme === 'dark' ? 'bg-muted' : 'bg-gray-100'
              }`}>
                <span className={`truncate max-w-[70%] text-sm ${
                  theme === 'dark' ? 'text-foreground' : 'text-gray-700'
                }`}>
                  {file.name}
                </span>
                <button
                  onClick={handleClearFile}
                  className={`flex items-center gap-1 text-sm ${
                    theme === 'dark' 
                      ? 'text-destructive hover:text-destructive/80' 
                      : 'text-red-600 hover:text-red-800'
                  }`}
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            )}
          </div>
          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`w-full mt-6 font-semibold py-3 rounded-lg transition disabled:opacity-50 bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] ${theme === 'dark' ? 'shadow-lg shadow-[#a259ff]/20' : 'shadow-md'}`}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Start Revision'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col px-4 py-4 ${
      theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'
    }`}>
      <header className={`relative shadow-sm h-16 flex items-center justify-between px-6 ${
        theme === 'dark' ? 'bg-background text-foreground border-b border-border' : 'bg-white text-gray-900 border-b border-gray-200'
      }`}>
        {/* Centered Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
          <BookOpen className={`w-6 h-6 ${theme === 'dark' ? 'text-primary' : 'text-blue-600'}`} />
          <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Revision Buddy</h1>
        </div>

        {/* Right Buttons */}
        <div className="flex gap-2 ml-auto">
          <Button
            onClick={exportToPDF}
            className={`font-medium flex items-center gap-2 ${
              theme === 'dark' 
                ? 'text-foreground bg-muted hover:bg-accent border-border' 
                : 'text-gray-900 bg-gray-200 hover:bg-gray-300 border-gray-300'
            }`}
          >
            <Download className="w-4 h-4" /> Export PDF
          </Button>
          <Button
            onClick={() => {
              setChatStarted(false);
              setMessages([]);
              setFile(null);
            }}
            className={`font-medium ${
              theme === 'dark' 
                ? 'text-foreground bg-muted hover:bg-accent border-border' 
                : 'text-gray-900 bg-gray-200 hover:bg-gray-300 border-gray-300'
            }`}
          >
            New PDF
          </Button>
        </div>
      </header>

      <div 
        ref={chatContainerRef} 
        className={`flex-1 overflow-y-auto p-6 rounded-lg ${
          theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-5">
          {messages.length === 0 && (
            <div className={`text-center mt-10 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
              <p className={`text-lg font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Start your revision!</p>
              <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Ask about key concepts, definitions, or specific topics from the uploaded PDF.</p>
              
              <div className={`flex justify-center items-center mt-4 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'}`}>
                <AlertTriangle className="w-5 h-5 mr-2" />
                <p className={`text-sm ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'}`}>
                  <strong>Warning:</strong> Your messages will be erased after you close the chat.
                </p>
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}
            >
              {msg.role === 'bot' && (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-muted text-foreground' : 'bg-gray-200 text-gray-900'
                }`}>
                  <Bot className="w-6 h-6" />
                </div>
              )}
              <div
                className={`p-4 rounded-lg max-w-xl shadow-md bot-message ${
                  msg.role === 'user'
                    ? theme === 'dark' 
                      ? 'bg-primary text-primary-foreground rounded-br-none' 
                      : 'bg-blue-600 text-white rounded-br-none'
                    : theme === 'dark' 
                      ? 'bg-muted text-foreground border-border rounded-bl-none' 
                      : 'bg-gray-100 text-gray-900 border-gray-200 rounded-bl-none'
                }`}
                dangerouslySetInnerHTML={{ __html: msg.text }}
              />
              {msg.role === 'user' && (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-muted text-foreground' : 'bg-gray-200 text-gray-900'
                }`}>
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                theme === 'dark' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-600'
              }`}>
                <Bot className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-2 text-sm ${
                theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'
              }`}>
                <Loader2 className="animate-spin h-5 w-5" />
                Summarizing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <footer className={`shadow-t h-20 flex items-center px-6 ${
        theme === 'dark' ? 'bg-background text-foreground border-t border-border' : 'bg-white text-gray-900 border-t border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto w-full flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about a concept, topic, or question..."
            className={`flex-1 px-4 py-3 rounded-lg outline-none text-sm focus:ring-2 ${
              theme === 'dark' 
                ? 'bg-background text-foreground border-border focus:ring-primary' 
                : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'
            }`}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className={`px-6 py-3 font-semibold rounded-lg transition disabled:opacity-50 ${
              theme === 'dark' 
                ? 'text-foreground bg-muted hover:bg-accent border-border' 
                : 'text-gray-900 bg-gray-200 hover:bg-gray-300 border-gray-300'
            }`}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Ask'}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default ChatWithPDF;