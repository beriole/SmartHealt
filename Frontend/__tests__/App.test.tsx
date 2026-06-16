/**
 * Smoke test d'un composant UI de base (rendu sans modules natifs).
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Button } from '@/components';

test('le composant Button se rend correctement', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Button label="Tester" onPress={() => {}} />);
  });
});
