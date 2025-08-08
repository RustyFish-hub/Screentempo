import { supabase } from '@/lib/supabase';

import type { TimerPresetDB, TimerSessionDB } from '@/types/database';

export async function getCustomPresets(userId: string): Promise<TimerPresetDB[]> {
  const { data, error } = await supabase
    .from('timer_presets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching custom presets:', error);
    throw error;
  }

  return data || [];
}

export async function saveCustomPreset(
  userId: string,
  preset: Omit<TimerPresetDB, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<TimerPresetDB> {
  const { data, error } = await supabase
    .from('timer_presets')
    .insert([{ ...preset, user_id: userId }])
    .select()
    .single();

  if (error) {
    console.error('Error saving custom preset:', error);
    throw error;
  }

  return data;
}

export async function updateCustomPreset(
  userId: string,
  presetId: string,
  updates: Partial<Omit<TimerPresetDB, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<TimerPresetDB> {
  const { data, error } = await supabase
    .from('timer_presets')
    .update(updates)
    .eq('id', presetId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating custom preset:', error);
    throw error;
  }

  return data;
}

export async function deleteCustomPreset(userId: string, presetId: string): Promise<void> {
  const { error } = await supabase
    .from('timer_presets')
    .delete()
    .eq('id', presetId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting custom preset:', error);
    throw error;
  }
}

export async function startTimerSession(
  userId: string,
  presetId: string,
  duration: number
): Promise<TimerSessionDB> {
  const { data, error } = await supabase
    .from('timer_sessions')
    .insert([{
      user_id: userId,
      preset_id: presetId,
      start_time: new Date().toISOString(),
      duration,
      completed: false
    }])
    .select()
    .single();

  if (error) {
    console.error('Error starting timer session:', error);
    throw error;
  }

  return data;
}

export async function completeTimerSession(
  userId: string,
  sessionId: string
): Promise<TimerSessionDB> {
  const { data, error } = await supabase
    .from('timer_sessions')
    .update({
      end_time: new Date().toISOString(),
      completed: true
    })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error completing timer session:', error);
    throw error;
  }

  return data;
}

export async function getTimerSessions(
  userId: string,
  limit = 10
): Promise<TimerSessionDB[]> {
  const { data, error } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching timer sessions:', error);
    throw error;
  }

  return data || [];
}