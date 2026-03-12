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
  toggleLike: (postId: number) => void;
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

  const toggleLike = useCallback((postId: number) => {
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, has_liked: !post.has_liked, likes: post.has_liked ? post.likes - 1 : post.likes + 1 }
        : post
    ));

    api.toggleLike(postId).catch(() => {
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, has_liked: !post.has_liked, likes: post.has_liked ? post.likes - 1 : post.likes + 1 }
          : post
      ));
    });
  }, []);

  return (
    <CommunityContext.Provider value={{ posts, setPosts, newPost, setNewPost, submitPost, fetchPosts, toggleLike }}>
      {children}
    </CommunityContext.Provider>
  );
}
