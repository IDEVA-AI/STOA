import { useContext } from 'react';
import { CourseContext } from '../stores/CourseContext';

export function useCourses() {
  return useContext(CourseContext);
}
