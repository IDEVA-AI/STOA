import { useContext } from 'react';
import { CommunityContext } from '../stores/CommunityContext';

export function useCommunity() {
  return useContext(CommunityContext);
}
