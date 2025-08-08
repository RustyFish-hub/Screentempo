export interface TimerPresetDB {
  id: string;
  user_id: string;
  name: string;
  duration: number;
  color: string;
  is_achievement: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimerSessionDB {
  id: string;
  user_id: string;
  preset_id: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  completed: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      timer_presets: {
        Row: TimerPresetDB;
        Insert: Omit<TimerPresetDB, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TimerPresetDB, 'id' | 'created_at' | 'updated_at'>>;
      };
      timer_sessions: {
        Row: TimerSessionDB;
        Insert: Omit<TimerSessionDB, 'created_at'>;
        Update: Partial<Omit<TimerSessionDB, 'id' | 'created_at'>>;
      };
    };
  };
}