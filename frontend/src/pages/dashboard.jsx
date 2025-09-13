import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from '../components/dashboard/Sidebar.jsx';
import { TopBar } from '../components/dashboard/TopBar.jsx';
import { OverviewSection } from '../components/dashboard/OverviewSection.jsx';
import { NotesSection } from '../components/dashboard/NotesSection.jsx';
import { GitHubSection } from '../components/dashboard/GitHubSection.jsx';
import { PlacementSection } from '../components/dashboard/PlacementSection.jsx';
import { ChatSection } from '../components/dashboard/ChatSection.jsx';

export default function Dashboard() {
  const [location, navigate] = useLocation();
  
  // Extract section from URL or use default
  const getCurrentSectionFromURL = ()=> {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section') ;
    
    // Validate the section
    const validSections= ['overview', 'notes', 'github', 'placement', 'chat'];
    if (section && validSections.includes(section)) {
      return section;
    }
    
    // Fallback to localStorage
    const savedSection = localStorage.getItem('dashboard_section') ;
    if (savedSection && validSections.includes(savedSection)) {
      return savedSection;
    }
    
    return 'overview';
  };

  const [currentSection, setCurrentSection] = useState(getCurrentSectionFromURL);

  // Update URL when section changes
  const handleSectionChange = (section) => {
    setCurrentSection(section);
    
    // Save to localStorage
    localStorage.setItem('dashboard_section', section);
    
    // Update URL without full page reload
    const newURL = `${window.location.pathname}?section=${section}`;
    window.history.pushState({}, '', newURL);
  };

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const sectionFromURL = getCurrentSectionFromURL();
      setCurrentSection(sectionFromURL);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initialize URL on first load
  useEffect(() => {
    const sectionFromURL = getCurrentSectionFromURL();
    if (currentSection !== sectionFromURL) {
      setCurrentSection(sectionFromURL);
    }
    
    // Ensure URL reflects current section
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('section') !== currentSection) {
      const newURL = `${window.location.pathname}?section=${currentSection}`;
      window.history.replaceState({}, '', newURL);
    }
  }, []);

  const sectionConfig = {
    overview: { title: 'Dashboard Overview', subtitle: 'Welcome back! Here\'s your study progress.' },
    notes: { title: 'My Notes', subtitle: 'Manage and search through your study materials.' },
    github: { title: 'GitHub Projects', subtitle: 'Analyze and understand your code repositories.' },
    placement: { title: 'Placement Prep', subtitle: 'Practice questions and interview preparation.' },
    chat: { title: 'AI Assistant', subtitle: 'Get instant help with your studies and projects.' }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'overview':
        return <OverviewSection />;
      case 'notes':
        return <NotesSection />;
      case 'github':
        return <GitHubSection />;
      case 'placement':
        return <PlacementSection />;
      case 'chat':
        return <ChatSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Sidebar currentSection={currentSection} onSectionChange={handleSectionChange} />
      
      <div className="ml-64 min-h-screen flex flex-col">
        <TopBar 
          title={sectionConfig[currentSection].title}
          subtitle={sectionConfig[currentSection].subtitle}
        />
        
        <main className={currentSection === 'chat' ? 'flex-1 overflow-hidden' : 'p-6'}>
          <div className={currentSection === 'chat' ? 'h-full' : 'section-content'}>
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}

