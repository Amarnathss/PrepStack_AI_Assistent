import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/api';
import { Github, Lock, Star, RefreshCw, Check, Code, Zap } from 'lucide-react';

export function GitHubSection() {
  const [githubInput, setGithubInput] = useState('');
  const [inputType, setInputType] = useState('username');
  const [showInput, setShowInput] = useState(false);
  const [hasConnected, setHasConnected] = useState(false);
  const [connectedUsername, setConnectedUsername] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load GitHub connection state from localStorage on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('github_username');
    const savedConnectionState = localStorage.getItem('github_connected');
    
    if (savedUsername && savedConnectionState === 'true') {
      setConnectedUsername(savedUsername);
      setHasConnected(true);
    }
  }, []);

  const { data: repos, isLoading: reposLoading } = useQuery({
    queryKey: ['/api/github/repos'],
    retry: false,
  });

  // Set connection state based on existing repos
  useEffect(() => {
    if (repos && Array.isArray(repos) && repos.length > 0) {
      setHasConnected(true);
    }
  }, [repos]);

  const connectMutation = useMutation({
    mutationFn: async (input) => {
      if (input.type === 'username') {
        return apiRequest('POST', '/api/github/connect-username', { username: input.value });
      } else {
        return apiRequest('POST', '/api/github/connect', { token: input.value });
      }
    },
    onSuccess: (response) => {
      // Extract username from input
      let username = githubInput;
      if (githubInput.includes('github.com/')) {
        const match = githubInput.match(/github\.com\/([^\/\?]+)/);
        username = match ? match[1] : githubInput;
      }
      
      // Save to localStorage
      localStorage.setItem('github_username', username);
      localStorage.setItem('github_connected', 'true');
      
      queryClient.invalidateQueries({ queryKey: ['/api/github/repos'] });
      setShowInput(false);
      setGithubInput('');
      setHasConnected(true);
      setConnectedUsername(username);
      
      toast({
        title: "GitHub connected successfully",
        description: `Connected to ${username}'s repositories`,
      });
    },
    onError: (error) => {
      toast({
        title: "GitHub connection failed",
        description: error instanceof Error ? error.message : "Please check your input and try again",
        variant: "destructive",
      });
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async (repoId) => {
      return apiRequest('POST', `/api/github/analyze/${repoId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/github/repos'] });
      toast({
        title: "Repository analyzed successfully",
        description: "Analysis results are now available.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  });

  const handleConnect = () => {
    if (!githubInput.trim()) {
      toast({
        title: `${inputType === 'username' ? 'Username' : 'Token'} required`,
        description: `Please enter your GitHub ${inputType === 'username' ? 'username' : 'personal access token'}`,
        variant: "destructive",
      });
      return;
    }
    connectMutation.mutate({ type: inputType, value: githubInput });
  };

  const getLanguageColor = (language) => {
    const colors = {
      'JavaScript': 'bg-yellow-400',
      'Python': 'bg-blue-400',
      'TypeScript': 'bg-blue-500',
      'Java': 'bg-orange-400',
      'C++': 'bg-pink-400',
      'Go': 'bg-cyan-400',
      'Rust': 'bg-orange-600',
    };
    return colors[language] || 'bg-gray-400';
  };

  const isConnected = hasConnected && repos && Array.isArray(repos);

  return (
    <div className="space-y-6">
      {/* GitHub Connection Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-gray-900 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                <Github className="text-white text-xl" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">GitHub Integration</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isConnected ? 'Connected to your GitHub account' : 'Connect your GitHub account to analyze repositories'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isConnected ? (
                <>
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                    <Check className="mr-1" size={12} />
                    Connected
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      // Clear localStorage
                      localStorage.removeItem('github_username');
                      localStorage.removeItem('github_connected');
                      
                      setHasConnected(false);
                      setConnectedUsername(null);
                      setShowInput(true);
                    }}
                    title="Disconnect GitHub"
                  >
                    <RefreshCw size={16} />
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setShowInput(!showInput)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Connect GitHub
                </Button>
              )}
            </div>
          </div>

          {/* GitHub Input */}
          {showInput && (
            <div className="mt-4 p-4 border border-gray-200 dark:border-border rounded-lg bg-gray-50 dark:bg-background">
              <div className="space-y-3">
                {/* Input Type Toggle */}
                <div className="flex space-x-2 mb-3">
                  <Button
                    variant={inputType === 'username' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputType('username')}
                  >
                    Username
                  </Button>
                  <Button
                    variant={inputType === 'token' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputType('token')}
                  >
                    Token
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {inputType === 'username' ? 'GitHub Username or URL' : 'GitHub Personal Access Token'}
                  </label>
                  <Input
                    type={inputType === 'token' ? 'password' : 'text'}
                    value={githubInput}
                    onChange={(e) => setGithubInput(e.target.value)}
                    placeholder={inputType === 'username' ? 'username or https://github.com/username' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {inputType === 'username' 
                      ? 'Enter your GitHub username or paste your profile URL to fetch public repositories'
                      : 'Generate a token at GitHub → Settings → Developer settings → Personal access tokens (for private repos)'
                    }
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleConnect}
                    disabled={connectMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {connectMutation.isPending ? 'Connecting...' : 'Connect'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowInput(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repository Analysis */}
      {isConnected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Repository List */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Public Repositories</h3>
              
              {reposLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border border-gray-200 dark:border-border rounded-lg p-4 animate-pulse">
                      <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : Array.isArray(repos) && repos.length === 0 ? (
                <div className="text-center py-8">
                  <Github className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500 dark:text-gray-400">No repositories found</p>
                  <p className="text-xs text-gray-400 mt-2">Make sure your GitHub profile has public repositories</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(repos) && repos.map((repo) => (
                    <div key={repo.id} className="border border-gray-200 dark:border-border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-background transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                            <Github className="text-gray-400 mr-2 text-sm" size={14} />
                            {repo.repoName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {repo.description || 'No description available'}
                          </p>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            {repo.language && (
                              <span className="flex items-center">
                                <div className={`w-2 h-2 ${getLanguageColor(repo.language)} rounded-full mr-1`}></div>
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Star size={12} className="mr-1" />
                              {repo.stars || 0}
                            </span>
                            <span>Public</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => analyzeMutation.mutate(repo.id)}
                          disabled={analyzeMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="ml-4"
                        >
                          {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Code Analysis Results */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Analysis</h3>
              
              <div className="space-y-4">
                {Array.isArray(repos) && repos.filter((repo) => repo.analysis).length === 0 ? (
                  <div className="text-center py-8">
                    <Code className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500 dark:text-gray-400">No analysis available</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Click "Analyze" on a repository to get started</p>
                  </div>
                ) : (
                  Array.isArray(repos) && repos.filter((repo) => repo.analysis).map((repo) => (
                    <div key={repo.id} className="bg-gray-50 dark:bg-background rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{repo.repoName.split('/')[1]}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Analyzed {new Date(repo.lastAnalyzed).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {repo.analysis?.summary}
                      </p>
                      
                      {repo.analysis?.technologies && (
                        <div className="space-y-2">
                          <div className="text-xs">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Technologies:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {repo.analysis.technologies.map((tech) => (
                                <Badge key={tech} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


