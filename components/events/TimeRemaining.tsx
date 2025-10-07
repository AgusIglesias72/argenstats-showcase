'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimeRemainingProps {
  deadline: Date;
  className?: string;
}

export default function TimeRemaining({ deadline, className = '' }: TimeRemainingProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const diff = new Date(deadline).getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Finalizado');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    // Actualizar inmediatamente
    updateTimeRemaining();

    // Actualizar cada minuto
    const interval = setInterval(updateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className={`flex items-center gap-2 text-gray-500 dark:text-gray-400 ${className} `}>
      <Clock className="w-4 h-4" />
      <span className="text-xs font-medium">Tiempo</span>
      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
        {timeRemaining}
      </p>
    </div>
  );
}
