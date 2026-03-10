import { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { AuthProvider } from './stores/AuthContext';
import { ThemeProvider } from './stores/ThemeContext';
import { NavigationProvider } from './stores/NavigationContext';
import { CourseProvider } from './stores/CourseContext';
import { CommunityProvider } from './stores/CommunityContext';
import { useAuth } from './hooks/useAuth';
import { useNavigation } from './hooks/useNavigation';
import { useCourses } from './hooks/useCourses';
import { useCommunity } from './hooks/useCommunity';
import { useTheme } from './hooks/useTheme';
import AuthPage from './pages/AuthPage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import CommunityPage from './pages/CommunityPage';
import AdminPage from './pages/AdminPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import LessonPlayerPage from './pages/LessonPlayerPage';
import DesignSystemPage from './pages/DesignSystemPage';

function AppContent() {
  const { isAuthenticated, authMode, setAuthMode, login, logout } = useAuth();
  const { activeTab, setActiveTab, adminSection, setAdminSection } = useNavigation();
  const { courses, setCourses, selectedCourse, courseContent, selectedLesson, courseError, enterCourse, exitCourse, selectLesson, toggleLessonCompletion, fetchCourses } = useCourses();
  const { posts, setPosts, newPost, setNewPost, submitPost, fetchPosts } = useCommunity();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([fetchCourses(), fetchPosts()]).catch(console.error);
    }
  }, [isAuthenticated, fetchCourses, fetchPosts]);

  if (!isAuthenticated) {
    return <AuthPage authMode={authMode} setAuthMode={setAuthMode} onAuthenticate={login} />;
  }

  if (selectedCourse) {
    return (
      <LessonPlayerPage
        selectedCourse={selectedCourse}
        courseContent={courseContent}
        selectedLesson={selectedLesson}
        courseError={courseError}
        onBack={exitCourse}
        onSelectLesson={selectLesson}
        onToggleLessonCompletion={toggleLessonCompletion}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans transition-colors duration-500 bg-bg text-text">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminSection={adminSection}
        setAdminSection={setAdminSection}
        theme={theme}
        setTheme={setTheme}
        onLogout={logout}
      />

      <main className="flex-1 overflow-y-auto relative bg-bg transition-colors duration-500">
        <Header setActiveTab={setActiveTab} />


        <div className="p-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <DashboardPage courses={courses} posts={posts} onEnterCourse={enterCourse} setActiveTab={setActiveTab} />
            )}
            {activeTab === 'courses' && (
              <CoursesPage courses={courses} onEnterCourse={enterCourse} />
            )}
            {activeTab === 'community' && (
              <CommunityPage posts={posts} newPost={newPost} setNewPost={setNewPost} onPostSubmit={submitPost} />
            )}
            {activeTab === 'admin' && <AdminPage adminSection={adminSection} />}
            {activeTab === 'messages' && <MessagesPage />}
            {activeTab === 'profile' && <ProfilePage />}
            {activeTab === 'design-system' && <DesignSystemPage />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationProvider>
          <CourseProvider>
            <CommunityProvider>
              <AppContent />
            </CommunityProvider>
          </CourseProvider>
        </NavigationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
