import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NormalizedError, Utilisateur } from '@/types';
import { useAuthStore } from '@/store/authStore';
import * as api from './profil.api';
import { UpdateProfilPayload } from './profil.api';

export function useUpdateProfil() {
  const qc = useQueryClient();
  const setUser = useAuthStore(s => s.setUser);
  return useMutation<
    Utilisateur,
    NormalizedError,
    { id: string; data: UpdateProfilPayload }
  >({
    mutationFn: ({ id, data }) => api.updateProfil(id, data),
    onSuccess: updated => {
      setUser(updated);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
