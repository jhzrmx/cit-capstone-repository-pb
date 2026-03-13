import { onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { authService } from '../services/auth.service';

export default function Logout() {
  const navigate = useNavigate();

  onMount(() => {
    authService.logout();
    navigate('/', { replace: true });
  });

  return <p class="text-slate-500">Logging out...</p>;
}
