import { supabase } from '../../app/lib/supabaseClient'

export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string
) => {
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    read: false,
    created_at: new Date().toISOString(),
  });
};
