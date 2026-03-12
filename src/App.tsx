import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './stores/AuthContext';
import { ThemeProvider } from './stores/ThemeContext';
import { NavigationProvider } from './stores/NavigationContext';
import { CourseProvider } from './stores/CourseContext';
import { CommunityProvider } from './stores/CommunityContext';
import { MessagesProvider } from './stores/MessagesContext';
import { AppRoutes } from './router';

export default function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
