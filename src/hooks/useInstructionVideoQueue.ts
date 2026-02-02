import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useInstructionVideos, useInstructionVideoSettings, useUpdateInstructionVideoSettings, InstructionVideo } from './useInstructionVideos';

interface InstructionVideoQueueState {
  shouldInsertVideo: boolean;
  currentVideo: InstructionVideo | null;
  performancesSinceLastVideo: number;
}

export function useInstructionVideoQueue(
  instanceId: string | null,
  videoInsertionsEnabled: boolean,
  videoInsertionsMandatory: boolean
) {
  const { data: allVideos } = useInstructionVideos();
  const { data: settings } = useInstructionVideoSettings();
  const updateSettings = useUpdateInstructionVideoSettings();
  
  const [state, setState] = useState<InstructionVideoQueueState>({
    shouldInsertVideo: false,
    currentVideo: null,
    performancesSinceLastVideo: 0,
  });

  // Get only active videos
  const activeVideos = allVideos?.filter(v => v.is_active) || [];
  const insertionFrequency = settings?.insertion_frequency || 3;
  const currentVideoIndex = settings?.current_video_index || 0;

  // Check if we should insert a video after the current performance
  const checkShouldInsertVideo = useCallback((performanceCount: number) => {
    if (!videoInsertionsEnabled || activeVideos.length === 0) {
      setState(prev => ({ ...prev, shouldInsertVideo: false, currentVideo: null }));
      return;
    }

    // Calculate if it's time to insert a video
    const shouldInsert = (performanceCount + 1) % (insertionFrequency + 1) === 0;
    
    if (shouldInsert) {
      const videoIndex = currentVideoIndex % activeVideos.length;
      const video = activeVideos[videoIndex];
      setState({
        shouldInsertVideo: true,
        currentVideo: video,
        performancesSinceLastVideo: 0,
      });
    } else {
      setState(prev => ({
        ...prev,
        shouldInsertVideo: false,
        currentVideo: null,
        performancesSinceLastVideo: prev.performancesSinceLastVideo + 1,
      }));
    }
  }, [videoInsertionsEnabled, activeVideos, insertionFrequency, currentVideoIndex]);

  // Called after an instruction video finishes playing
  const advanceToNextVideo = useCallback(async () => {
    const nextIndex = (currentVideoIndex + 1) % Math.max(activeVideos.length, 1);
    await updateSettings.mutateAsync({ current_video_index: nextIndex });
    setState(prev => ({
      ...prev,
      shouldInsertVideo: false,
      currentVideo: null,
    }));
  }, [currentVideoIndex, activeVideos.length, updateSettings]);

  // Get the next instruction video to be inserted
  const getNextInstructionVideo = useCallback(() => {
    if (!videoInsertionsEnabled || activeVideos.length === 0) return null;
    const videoIndex = currentVideoIndex % activeVideos.length;
    return activeVideos[videoIndex];
  }, [videoInsertionsEnabled, activeVideos, currentVideoIndex]);

  return {
    ...state,
    activeVideos,
    insertionFrequency,
    currentVideoIndex,
    checkShouldInsertVideo,
    advanceToNextVideo,
    getNextInstructionVideo,
    isEnabled: videoInsertionsEnabled,
    isMandatory: videoInsertionsMandatory,
  };
}
