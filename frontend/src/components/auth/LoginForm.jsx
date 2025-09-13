import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';
import { LogIn, UserPlus } from 'lucide-react';

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast({
          title: "Login successful",
          description: "Welcome back to your study dashboard!",
        });
      } else {
        await register(email, password, name);
        toast({
          title: "Registration successful",
          description: "Your account has been created!",
        });
      }
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isLogin && (
        <div>
          <Label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-background text-gray-900 dark:text-white transition-colors"
            placeholder="Enter your full name"
            required={!isLogin}
          />
        </div>
      )}
      
      <div>
        <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-background text-gray-900 dark:text-white transition-colors"
          placeholder="Enter your email"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-background text-gray-900 dark:text-white transition-colors"
          placeholder="Enter your password"
          required
        />
      </div>
      
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
      >
        {loading ? (
          "Processing..."
        ) : (
          <>
            {isLogin ? <LogIn className="mr-2" size={16} /> : <UserPlus className="mr-2" size={16} />}
            {isLogin ? "Sign In" : "Sign Up"}
          </>
        )}
      </Button>
      
      <button
        type="button"
        onClick={() => setIsLogin(!isLogin)}
        className="w-full text-sm text-primary hover:text-primary/80 transition-colors"
      >
        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}


