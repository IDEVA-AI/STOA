import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useParams } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, MessageSquare, ShieldCheck } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useNavigation } from './hooks/useNavigation';
import { useCourses } from './hooks/useCourses';
import { useCommunity } from './hooks/useCommunity';
import { useTheme } from './hooks/useTheme';
import { useWorkspace } from './hooks/useWorkspace';
import WorkspaceOnboarding from './components/workspace/WorkspaceOnboarding';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import CommunityPage from './pages/CommunityPage';
import AdminPage from './pages/AdminPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import LessonPlayerPage from './pages/LessonPlayerPage';
import DesignSystemPage from './pages/DesignSystemPage';
import BlockEditorPage from './pages/BlockEditorPage';
import SchedulingPage from './pages/SchedulingPage';
import AnnouncementGate from './components/AnnouncementGate';
import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-pulse text-warm-gray text-sm mono-label">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

function Layout() {
  const { isAuthenticated, logout } = useAuth();
  const { activeTab, setActiveTab, adminSection, setAdminSection } = useNavigation();
  const { selectedCourse, courseContent, selectedLesson, courseError, exitCourse, selectLesson, toggleLessonCompletion, fetchCourses } = useCourses();
  const { fetchPosts } = useCommunity();
  const { theme, setTheme, spec, palette, setPalette } = useTheme();
  const { workspaces, isLoading: wsLoading } = useWorkspace();

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([fetchCourses(), fetchPosts()]).catch(console.error);
    }
  }, [isAuthenticated, fetchCourses, fetchPosts]);

  // Show loading while workspaces are being fetched
  if (wsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-pulse text-warm-gray text-sm mono-label">Carregando...</div>
      </div>
    );
  }

  // No workspaces: show onboarding
  if (workspaces.length === 0) {
    return <WorkspaceOnboarding />;
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
        spec={spec}
        palette={palette}
        setPalette={setPalette}
        onLogout={logout}
      />

      <main className="flex-1 overflow-y-auto relative bg-bg transition-colors duration-500">
        <Header />

        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto pb-24 lg:pb-10">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <Outlet />
            </AnimatePresence>
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-line flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {[
          { id: 'dashboard' as const, icon: LayoutDashboard, label: 'Painel' },
          { id: 'courses' as const, icon: BookOpen, label: 'Cursos' },
          { id: 'community' as const, icon: Users, label: 'Social' },
          { id: 'messages' as const, icon: MessageSquare, label: 'Chat' },
          { id: 'admin' as const, icon: ShieldCheck, label: 'Admin' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === id ? 'text-gold' : 'text-warm-gray hover:text-text'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium tracking-tight">{label}</span>
          </button>
        ))}
      </nav>

      <AnnouncementGate />
    </div>
  );
}

function LoginPage() {
  const { isAuthenticated, isLoading, authMode, setAuthMode, login, register } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-pulse text-warm-gray text-sm mono-label">Carregando...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <AuthPage authMode={authMode} setAuthMode={setAuthMode} onLogin={login} onRegister={register} />;
}

function DashboardRoute() {
  const { courses, enterCourse } = useCourses();
  const { posts } = useCommunity();
  const { setActiveTab } = useNavigation();

  return <DashboardPage courses={courses} posts={posts} onEnterCourse={enterCourse} setActiveTab={setActiveTab} />;
}

function CoursesRoute() {
  const { courses, enterCourse } = useCourses();

  return <CoursesPage courses={courses} onEnterCourse={enterCourse} />;
}

function CommunityRoute() {
  return <CommunityPage />;
}

function CommunityByIdRoute() {
  const { communityId } = useParams<{ communityId: string }>();

  return <CommunityPage communityId={communityId ? Number(communityId) : undefined} />;
}

function AdminRoute() {
  const { adminSection } = useNavigation();

  return <AdminPage adminSection={adminSection} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/admin/editor/:lessonId" element={<BlockEditorPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardRoute />} />
          <Route path="/cursos" element={<CoursesRoute />} />
          <Route path="/cursos/:courseId/aula/:lessonId" element={<CoursesRoute />} />
          <Route path="/comunidade" element={<CommunityRoute />} />
          <Route path="/comunidade/:communityId" element={<CommunityByIdRoute />} />
          <Route path="/mensagens" element={<MessagesPage />} />
          <Route path="/agenda" element={<SchedulingPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/admin/:section" element={<AdminRoute />} />
          <Route path="/design-system" element={<DesignSystemPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
