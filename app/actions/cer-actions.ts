'use server';

import { cerService } from '@/lib/services/cerService';

/**
 * Server Action para obtener el CER actual
 */
export async function getCurrentCERAction() {
  try {
    const data = await cerService.getCurrentCER();
    return data;
  } catch (error) {
    console.error('Error en Server Action getCurrentCER:', error);
    return null;
  }
}

/**
 * Server Action para calcular inflación
 */
export async function calculateCERAction(params: {
  amount: number;
  from: string;
  to: string;
}) {
  try {
    const result = await cerService.calculateCER(params);
    return result;
  } catch (error) {
    console.error('Error en Server Action calculateCER:', error);
    return null;
  }
}