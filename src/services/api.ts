import { Course, Module, Post } from '../types';

export async function getCourses(): Promise<Course[]> {
  const res = await fetch('/api/courses');
  return res.json();
}

export async function getCourseContent(courseId: number): Promise<Module[]> {
  const res = await fetch(`/api/courses/${courseId}/content`);
  if (!res.ok) throw new Error('Falha ao carregar o conteudo do curso.');
  return res.json();
}

export async function getFeed(): Promise<Post[]> {
  const res = await fetch('/api/feed');
  return res.json();
}

export async function createPost(content: string, userId: number = 1): Promise<{ id: number }> {
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, userId })
  });
  if (!res.ok) throw new Error('Falha ao criar post.');
  return res.json();
}
