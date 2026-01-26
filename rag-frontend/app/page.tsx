'use client'

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useRef, useEffect } from 'react';

export default function Page() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [input, setInput] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async () => {
    if (!files) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const response = await fetch("http://localhost:8000/ingest", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      alert(`Upload successful! Processed ${data.chunks} chunks.`);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };
;

  // --- UI LAYOUT ---
  return (
    <div className="flex h-screen w-full bg-[#234C6A]">
      
      {/* LEFT HALF: UPLOAD SECTION */}
      <div className="w-1/2 flex flex-col justify-center items-center bg-[#1B3C53] border-r border-gray-200 p-12">
        <div className="w-full max-w-md space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight text-[#D2C1B6]">Knowledge Base</h1>
                <p className="mt-2 text-gray-50">Upload your PDF for context-based answers.</p>
            </div>

            <div className="mt-8">
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl">
                    <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600 justify-center">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-[#D2C1B6] rounded-md font-medium text-black hover:text-gray-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                <span>Select a PDF</span>
                                <input 
                                    id="file-upload" 
                                    name="file-upload" 
                                    type="file" 
                                    accept=".pdf"
                                    className="sr-only" 
                                    onChange={(e) => setFiles(e.target.files)} 
                                />
                            </label>
                        </div>
                        <p className="text-xs text-gray-300">PDF up to 10MB</p>
                        {files && files[0] && (
                            <p className="text-sm font-semibold text-lime-600 mt-2">
                                Selected: {files[0].name}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <button 
                onClick={handleUpload} 
                disabled={uploading || !files}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#D2C1B6] hover:bg-[#afa198] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            >
                {uploading ? (
                    <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Ingesting PDF...
                    </span>
                ) : 'Upload and Process'}
            </button>
        </div>
      </div>

      {/* RIGHT HALF: CHAT SECTION */}
      <div className="w-1/2 flex flex-col h-full bg-[#1B3C53]">
        
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <p>No messages yet.</p>
                    <p className="text-sm">Upload a document for personal answers.</p>
                </div>
            )}
            
            {messages.map(message => (
            <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
                    message.role === 'user' 
                    ? 'bg-[#D2C1B6] text-black rounded-br-none border border-white' 
                    : 'bg-[#456882] text-white border border-[#D2C1B6] rounded-bl-none'
                }`}>
                    <div className="flex flex-col text-sm leading-relaxed">
                        {message.parts ? (
                            message.parts.map((part, index) => {
                            if (part.type === 'text') {
                                return <span key={index}>{part.text}</span>;
                            }
                            return null;
                            })
                        ) : (
                            <span>{message.parts}</span> // Fallback for safety
                        )}
                    </div>
                </div>
            </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#456882] border-t border-gray-200">
            <form 
                onSubmit={e => {
                    e.preventDefault();
                    if (input.trim()) {
                        messages
                        sendMessage({text: input});
                        setInput('');
                    }
                }} 
                className="relative flex items-center"
            >
                <input
                    className="w-full border-gray-300 bg-black-50 border rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask a question about your PDF..."
                />
                <button 
                    type="submit" 
                    className="absolute right-2 p-2 bg-[#D2C1B6] text-black rounded-full hover:bg-[#afa198] transition-colors shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}