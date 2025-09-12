import React, { useState, useRef, useEffect } from 'react';
import { CloudUpload, Trash2, Loader2, BookOpen, User, Bot, Download, AlertTriangle } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/button';
import { fetchWithTokenRefresh } from '../../utils/authService';
import { API_BASE_URL } from '../../utils/config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type Message = { role: 'user' | 'bot'; text: string };

const ChatWithPDF: React.FC = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);

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
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'An error occurred while uploading the PDF.',
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
          <div style="background-color: #f0f4ff; padding: 1rem; border-radius: 8px; border-left: 4px solid #4a90e2; font-family: sans-serif;">
            <h3 style="margin-top: 0; color: #4a90e2;">📘 Quick Revision Note:</h3>
            <div>
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
    } catch (error: any) {
      console.error('Error fetching response:', error);
      const errorMessage: Message = {
        role: 'bot',
        text: `**Error:** ${error.message || "Sorry, I couldn't fetch the answer."}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred while fetching the answer.',
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
      <div className="min-h-screen bg-[#1c1c1e] text-gray-200 flex flex-col items-center  p-4">
        <div className="max-w-2xl w-full bg-[#232326] text-gray-200 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <BookOpen className="mx-auto text-blue-600 w-12 h-12 mb-3" />
            <h1 className="text-3xl font-bold text-gray-200">Revision Buddy</h1>
            <p className="text-sm text-gray-400 mt-2">Upload a PDF to start quick revision or reference key concepts.</p>
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-4 border-dashed rounded-xl p-6 text-center transition-colors  ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-[#1c1c1e]'
            }`}
          >
            <CloudUpload className="mx-auto text-gray-500 w-10 h-10 mb-3" />
            <p className="text-sm font-medium text-gray-200 mb-2">Drag & drop your PDF here</p>
            <p className="text-xs text-gray-400 mb-4">or click to select (PDF only, max 50MB)</p>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition"
            >
              Choose File
            </label>
            {file && (
              <div className="mt-4 flex items-center justify-between bg-gray-100 rounded-lg p-3">
                <span className="text-sm text-gray-700 truncate max-w-[70%]">{file.name}</span>
                <button
                  onClick={handleClearFile}
                  className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            )}
          </div>
          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full mt-6 text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Start Revision'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e] text-gray-200 flex flex-col border border-gray-700 px-4 py-4">
      <header className="relative bg-[#1c1c1e] text-gray-200 shadow-sm h-16 flex items-center justify-between px-6">
        {/* Centered Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
          <BookOpen className="text-blue-600 w-6 h-6" />
          <h1 className="text-xl font-bold text-gray-200">Revision Buddy</h1>
        </div>

        {/* Right Buttons */}
        <div className="flex gap-2 ml-auto">
          <Button
            onClick={exportToPDF}
            className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export PDF
          </Button>
          <Button
            onClick={() => {
              setChatStarted(false);
              setMessages([]);
              setFile(null);
            }}
            className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 font-medium"
          >
            New PDF
          </Button>
        </div>
      </header>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 bg-[#1c1c1e] text-gray-200 border border-gray-700 rounded-lg">
        <div className="max-w-7xl mx-auto space-y-5">
          {messages.length === 0 && (
            <div className="text-center text-gray-200 mt-10">
              <p className="text-lg font-medium">Start your revision!</p>
              <p className="text-sm">Ask about key concepts, definitions, or specific topics from the uploaded PDF.</p>
              
              <div className="flex justify-center items-center mt-4">
                <AlertTriangle className="text-yellow-400 w-5 h-5 mr-2" />
                <p className="text-sm text-yellow-700">
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
                <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
              )}
              <div
                className={`p-4 rounded-lg max-w-xl shadow-md bot-message ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-gray-200  rounded-br-none'
                    : 'bg-gray-800 text-gray-200 border border-gray-200 rounded-bl-none'
                }`}
                dangerouslySetInnerHTML={{ __html: msg.text }}
              />
              {msg.role === 'user' && (
                <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3 ">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 " />
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" />
                Summarizing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <footer className="bg-[#1c1c1e] text-gray-200 shadow-t h-20 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about a concept, topic, or question..."
            className="flex-1 px-4 py-3 rounded-lg bg-[#232326] border text-gray-200 outline-none focus:ring-2 focus:ring-white text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-3 text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Ask'}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default ChatWithPDF;
