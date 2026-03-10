import React, { createContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Post } from '../types';
import * as api from '../services/api';

interface CommunityContextType {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  newPost: string;
  setNewPost: (value: string) => void;
  submitPost: (e: React.FormEvent) => Promise<void>;
  fetchPosts: () => Promise<Post[]>;
}

export const CommunityContext = createContext<CommunityContextType>(null!);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');

  const fetchPosts = useCallback(async () => {
    const data = await api.getFeed();
    setPosts(data);
    return data;
  }, []);

  const submitPost = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      await api.createPost(newPost);
      setNewPost('');
      await fetchPosts();
    } catch (error) {
      console.error('Error posting:', error);
    }
  }, [newPost, fetchPosts]);

  return (
    <CommunityContext.Provider value={{ posts, setPosts, newPost, setNewPost, submitPost, fetchPosts }}>
      {children}
    </CommunityContext.Provider>
  );
}
