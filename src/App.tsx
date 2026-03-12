import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './stores/AuthContext';
import { ThemeProvider } from './stores/ThemeContext';
import { NavigationProvider } from './stores/NavigationContext';
import { CourseProvider } from './stores/CourseContext';
import { CommunityProvider } from './stores/CommunityContext';
import { MessagesProvider } from './stores/MessagesContext';
import { WorkspaceProvider } from './stores/WorkspaceContext';
import { AppRoutes } from './router';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WorkspaceProvider>
          <ThemeProvider>
            <BrowserRouter>
              <NavigationProvider>
                <CourseProvider>
                  <CommunityProvider>
                    <MessagesProvider>
                      <AppRoutes />
                    </MessagesProvider>
                  </CommunityProvider>
                </CourseProvider>
              </NavigationProvider>
            </BrowserRouter>
          </ThemeProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
