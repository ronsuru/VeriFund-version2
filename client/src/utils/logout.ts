// Development logout utility
export const performLogout = async () => {
  try {
    const { supabase } = await import('@/supabaseClient');
    await supabase.auth.signOut();
  } catch {}

  try {
    const { apiRequest, queryClient } = await import('@/lib/queryClient');
    await apiRequest('POST', '/api/auth/signout', {});
    queryClient.clear();
  } catch {}

  window.location.href = '/';};