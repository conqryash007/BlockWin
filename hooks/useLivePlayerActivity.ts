"use client";

import { useState, useEffect, useCallback } from 'react';
import { LivePlayerActivity, LiveActivityFilter } from '@/types/liveActivity';
import { generateRandomActivity, generateInitialActivities, getRandomDelay } from '@/lib/liveActivityData';

const MAX_ACTIVITIES = 10;

export function useLivePlayerActivity(filter: LiveActivityFilter = 'all') {
  const [activities, setActivities] = useState<LivePlayerActivity[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Add a new activity
  const addActivity = useCallback(() => {
    const newActivity = generateRandomActivity(filter);
    setActivities(prev => {
      const updated = [newActivity, ...prev];
      // Keep only the most recent MAX_ACTIVITIES
      return updated.slice(0, MAX_ACTIVITIES);
    });
  }, [filter]);

  // Initialize with a batch of activities
  useEffect(() => {
    const initial = generateInitialActivities(8, filter);
    setActivities(initial);
    setIsInitialized(true);
  }, [filter]);

  // Set up irregular interval updates
  useEffect(() => {
    if (!isInitialized) return;

    let timeoutId: NodeJS.Timeout;

    const scheduleNext = () => {
      const delay = getRandomDelay();
      timeoutId = setTimeout(() => {
        addActivity();
        scheduleNext(); // Schedule the next update with a new random delay
      }, delay);
    };

    // Start the irregular updates
    scheduleNext();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isInitialized, addActivity]);

  return { activities, addActivity };
}
