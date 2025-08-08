import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Try to make a simple query
    const { error } = await supabase
      .from('timer_presets')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase test error:', error);
      return NextResponse.json({ error: error });
    }

    return NextResponse.json({ 
      data: { 
        message: 'Supabase connection successful',
        timestamp: new Date().toISOString()
      } 
    });
  } catch (error) {
    console.error('Failed to test Supabase connection:', error);
    return NextResponse.json({ error: error });
  }
}