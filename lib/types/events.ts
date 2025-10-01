// lib/types/events.ts

export type EventStatus = 
  | 'DRAFT'
  | 'ACTIVE'
  | 'SUBMISSION_CLOSED'
  | 'AWAITING_RESULTS'
  | 'COMPLETED'
  | 'CANCELLED';

export type EventType = 'IPC_PREDICTION' | 'DOLLAR_PREDICTION';

// Interfaz base para eventos
export interface BaseEvent {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  eventType: EventType;
  eventDate: Date;
  submissionDeadline: Date;
  prizeAmount: number;
  prizeCurrency: string;
  status: EventStatus;
  
  // Metadatos
  participantsCount: number;
  winnerId?: string | null;
  resultsPublishedAt?: Date | null;
  
  // Configuración
  maxParticipants?: number | null;
  minParticipants?: number | null;
  isHighlighted: boolean;
  allowPredictionEdit: boolean;
  editDeadline?: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}

// Evento de IPC
export interface IPCEvent extends BaseEvent {
  eventType: 'IPC_PREDICTION';
  
  // Valores oficiales IPC
  officialIpcGeneral?: number | null;
  officialIpcBienes?: number | null;
  officialIpcServicios?: number | null;
  officialIpcAlimentos?: number | null;
}

// Evento de Dólar
export interface DollarEvent extends BaseEvent {
  eventType: 'DOLLAR_PREDICTION';
  
  // Valores oficiales Dólar
  officialDollarValue?: number | null;
  dollarSource?: string | null; // "MEP Ualá", etc.
}

export type Event = IPCEvent | DollarEvent;

// Predicción IPC
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
  
  // Control de visibilidad
  isPublic: boolean;
  
  // Para tracking de ediciones
  editCount: number;
  lastEditedAt?: Date | null;
  
  // Resultados (calculados después)
  generalMatch?: boolean | null;
  exactMatchesCount?: number | null;
  totalDeviation?: number | null;
  rank?: number | null;
  isWinner: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// Predicción para Dólar
export interface DollarPrediction {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  
  // Predicción
  dollarValue: number;
  
  // Configuración
  isPublic: boolean;
  editCount: number;
  lastEditedAt?: Date | null;
  
  // Resultados
  deviation?: number | null;
  rank?: number | null;
  isWinner: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// Para el formulario de predicción del dólar
export interface DollarPredictionInput {
  dollarValue: number;
  isPublic?: boolean;
}

// Para el formulario de predicción IPC
export interface PredictionInput {
  ipcGeneral: number;
  ipcBienes: number;
  ipcServicios: number;
  ipcAlimentos: number;
  isPublic?: boolean;
}

// Para mostrar predicciones públicas IPC con info del usuario
export interface PublicIPCPrediction extends EventPrediction {
  user?: {
    userId: string;
    email: string;
    name?: string | null;
    imageUrl?: string | null;
  };
}

// Para mostrar predicciones públicas Dólar con info del usuario
export interface PublicDollarPrediction extends DollarPrediction {
  user?: {
    userId: string;
    email: string;
    name?: string | null;
    imageUrl?: string | null;
  };
}

// Estadísticas para eventos IPC
export interface EventStatistics {
  totalParticipants: number;
  publicPredictions: number;
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

// Estadísticas para eventos del dólar
export interface DollarEventStatistics {
  totalParticipants: number;
  publicPredictions: number;
  averagePrediction: number;
  medianPrediction: number;
  minPrediction: number;
  maxPrediction: number;
  standardDeviation: number;
}

// Para eventos con contador - usando intersección en lugar de extends
export type EventWithCount = Event & {
  _count?: {
    predictions: number;
  };
}

// Resultados del ranking
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