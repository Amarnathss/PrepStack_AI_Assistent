import { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm.jsx';
import { GraduationCap } from 'lucide-react';

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg px-4">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="text-primary text-2xl" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Personal Placement Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400">RAG-Powered Study Dashboard</p>
        </div>
        
        <LoginForm />
        
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-border">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Secure JWT Authentication • Private Access Only
          </p>
        </div>
      </div>
    </div>
  );
}

