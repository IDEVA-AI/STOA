import { createContext, useState, useCallback } from 'react';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import type { Course, Module, Lesson } from '../types';
import * as api from '../services/api';

interface CourseContextType {
  courses: Course[];
  setCourses: Dispatch<SetStateAction<Course[]>>;
  selectedCourse: Course | null;
  courseContent: Module[];
  selectedLesson: Lesson | null;
  courseLoading: boolean;
  courseError: string | null;
  enterCourse: (course: Course) => void;
  exitCourse: () => void;
  selectLesson: (lesson: Lesson) => void;
  toggleLessonCompletion: (lessonId: number) => void;
  fetchCourses: () => Promise<Course[]>;
}

export const CourseContext = createContext<CourseContextType>(null!);

export function CourseProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseContent, setCourseContent] = useState<Module[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    const data = await api.getCourses();
    setCourses(data);
    return data;
  }, []);

  const enterCourse = useCallback(async (course: Course) => {
    console.log('Entering course:', course.id);
    setSelectedCourse(course);
    setSelectedLesson(null);
    setCourseLoading(true);
    setCourseError(null);
    try {
      const data = await api.getCourseContent(course.id);
      setCourseContent(data);

      const firstModuleWithLessons = data.find((m: Module) => m.lessons && m.lessons.length > 0);
      if (firstModuleWithLessons) {
        setSelectedLesson(firstModuleWithLessons.lessons![0]);
      } else {
        setCourseError('Este curso ainda não possui aulas cadastradas.');
      }
    } catch (error) {
      console.error('Error fetching course content:', error);
      setCourseError('Ocorreu um erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setCourseLoading(false);
    }
  }, []);

  const exitCourse = useCallback(() => {
    setSelectedCourse(null);
    setSelectedLesson(null);
    setCourseError(null);
  }, []);

  const selectLesson = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
  }, []);

  const toggleLessonCompletion = useCallback((lessonId: number) => {
    setCourseContent(prev => prev.map(module => ({
      ...module,
      lessons: module.lessons?.map(lesson =>
        lesson.id === lessonId ? { ...lesson, completed: !lesson.completed } : lesson
      )
    })));

    setSelectedLesson(prev => prev && prev.id === lessonId ? { ...prev, completed: !prev.completed } : prev);

    setSelectedCourse(prev => {
      if (!prev) return prev;
      setCourses(courses => courses.map(c => {
        if (c.id !== prev.id) return c;
        // We need current courseContent for progress calculation
        return c; // Progress will be recalculated via effect if needed
      }));
      return prev;
    });
  }, []);

  return (
    <CourseContext.Provider value={{
      courses, setCourses, selectedCourse, courseContent, selectedLesson,
      courseLoading, courseError,
      enterCourse, exitCourse, selectLesson, toggleLessonCompletion, fetchCourses
    }}>
      {children}
    </CourseContext.Provider>
  );
}
