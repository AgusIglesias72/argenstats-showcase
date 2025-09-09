// lib/types/events.ts

export type EventStatus = 
  | 'DRAFT'
  | 'ACTIVE'
  | 'SUBMISSION_CLOSED'
  | 'AWAITING_RESULTS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Event {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  eventDate: Date;
  submissionDeadline: Date;
  prizeAmount: number;
  prizeCurrency: string;
  status: EventStatus;
  
  // Valores oficiales
  officialIpcGeneral?: number | null;
  officialIpcBienes?: number | null;
  officialIpcServicios?: number | null;
  officialIpcAlimentos?: number | null;
  
  // Metadatos
  participantsCount: number;
  winnerId?: string | null;
  resultsPublishedAt?: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface EventWithCount extends Event {
  _count?: {
    predictions: number;
  };
}

export interface EventPrediction {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  
  // Predicciones
  ipcGeneral: number;
  ipcBienes: number;
  ipcServicios: number;
  ipcAlimentos: number;
  
  // Resultados
  generalMatch?: boolean | null;
  exactMatchesCount?: number | null;
  totalDeviation?: number | null;
  rank?: number | null;
  isWinner: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PredictionInput {
  ipcGeneral: number;
  ipcBienes: number;
  ipcServicios: number;
  ipcAlimentos: number;
}

export interface EventStatistics {
  totalParticipants: number;
  medianPredictions: {
    ipcGeneral: number;
    ipcBienes: number;
    ipcServicios: number;
    ipcAlimentos: number;
  };
  averagePredictions: {
    ipcGeneral: number;
    ipcBienes: number;
    ipcServicios: number;
    ipcAlimentos: number;
  };
}

export interface RankingResult {
  userId: string;
  userEmail: string;
  rank: number;
  generalMatch: boolean;
  exactMatchesCount: number;
  totalDeviation: number;
  predictions: PredictionInput;
  createdAt: Date;
}