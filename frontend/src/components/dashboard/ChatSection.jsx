import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/api';
import { 
  Bot, 
  Send, 
  Paperclip, 
  Circle,
  User,
  FileText,
  Github,
  Code,
  Bookmark,
  Trash2
} from 'lucide-react';

export function ChatSection() {
  const [messageInput, setMessageInput] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chat sessions
  const { data: sessions } = useQuery({
    queryKey: ['/api/chat/sessions'],
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  // Auto-create session if none exists
  useEffect(() => {
    const sessionsArray = Array.isArray(sessions) ? sessions : [];
    if (sessionsArray.length === 0 && !currentSessionId) {
      createSessionMutation.mutate();
    } else if (sessionsArray.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessionsArray[0].id);
    }
  }, [sessions]);

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/chat/sessions');
      return await res.json();
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      setCurrentSessionId(newSession.id);
    },
  });

  // Delete all sessions mutation
  const deleteAllSessionsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', '/api/chat/sessions');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      setCurrentSessionId(null);
      toast({
        title: "Chats cleared",
        description: "All chat sessions have been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete chat sessions.",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, message }) => {
      const res = await apiRequest('POST', `/api/chat/${sessionId}/message`, { message });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      setMessageInput('');
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sessionsArray = Array.isArray(sessions) ? sessions : [];
  const currentSession = sessionsArray.find((s) => s.id === currentSessionId);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    if (!currentSessionId) {
      // Create a new session first
      createSessionMutation.mutate();
      return;
    }
    
    sendMessageMutation.mutate({
      sessionId: currentSessionId,
      message: messageInput.trim(),
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChats = () => {
    deleteAllSessionsMutation.mutate();
  };

  const getSourceIcon = (type) => {
    switch (type) {
      case 'note':
        return <FileText size={12} />;
      case 'github':
        return <Github size={12} />;
      case 'question':
        return <Bookmark size={12} />;
      default:
        return <Code size={12} />;
    }
  };

  const getSourceColor = (type) => {
    switch (type) {
      case 'note':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400';
      case 'github':
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400';
      case 'question':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400';
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-border bg-background">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-accent/10 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                <Bot className="text-accent" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Study Assistant</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Powered by Groq • Context-aware</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Context Indicators */}
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs">
                  {(stats )?.totalNotes || 0} Notes
                </Badge>
                <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400 text-xs">
                  {(stats )?.totalRepos || 0} GitHub Repos
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 text-xs">
                  {(stats )?.totalQuestions || 0} Questions
                </Badge>
              </div>

              <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                <Circle className="mr-1 fill-current" size={8} />
                Online
              </Badge>

              {sessionsArray.length > 0 && (
                <Button
                  onClick={handleClearChats}
                  disabled={deleteAllSessionsMutation.isPending}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} className="mr-1" />
                  Clear Chats
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages - Scrollable Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="p-6 space-y-6">
            {!currentSession || currentSession.messages.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="text-center">
                  <Bot className="mx-auto text-gray-400 mb-6" size={48} />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Welcome to AI Study Assistant
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">
                    Ask questions about your notes, GitHub projects, or placement preparation. 
                    I have access to your uploaded content and can help you study effectively.
                  </p>
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    Start typing below to begin your conversation
                  </div>
                </div>
              </div>
            ) : (
              <>
                {currentSession.messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl p-4 ${
                      message.role === 'user' 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}>
                      <div className="flex items-start space-x-3">
                        {message.role === 'assistant' && (
                          <Bot className="text-accent flex-shrink-0 mt-1" size={18} />
                        )}
                        {message.role === 'user' && (
                          <User className="text-white flex-shrink-0 mt-1" size={18} />
                        )}
                        <div className="flex-1">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                          </div>
                          
                          {/* Sources */}
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Sources ({message.sources.length}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {message.sources.map((source, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="secondary" 
                                    className={`${getSourceColor(source.type)} text-xs flex items-center`}
                                  >
                                    {getSourceIcon(source.type)}
                                    <span className="ml-1 truncate max-w-[150px]">
                                      {source.title}
                                    </span>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 max-w-[85%]">
                      <div className="flex items-center space-x-3">
                        <Bot className="text-accent" size={18} />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-border bg-background">
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Ask about your notes, GitHub projects, or placement questions..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sendMessageMutation.isPending}
                className="w-full pl-4 pr-12 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent rounded-lg"
              />
              <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary">
                <Paperclip size={14} />
              </Button>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sendMessageMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white p-2.5 rounded-lg transition-colors"
              size="icon"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


