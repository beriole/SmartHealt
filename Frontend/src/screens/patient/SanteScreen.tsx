import React from 'react';
import { useTranslation } from 'react-i18next';
import { Screen, EmptyState } from '@/components';

export function SanteScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState
        title={t('tabs.sante')}
        description="Triage IA, carnet, ordonnances et rappels — Sprints S4/S5."
      />
    </Screen>
  );
}
