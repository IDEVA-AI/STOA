import { useContext } from 'react';
import { MessagesContext } from '../stores/MessagesContext';

export function useMessages() {
  return useContext(MessagesContext);
}
