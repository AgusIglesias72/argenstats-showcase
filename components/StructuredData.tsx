// components/StructuredData.tsx
import type { ScriptProps } from 'next/script';
import dynamic from 'next/dynamic';

// Importación dinámica de Script para evitar problemas de tipos
const Script = dynamic(() => import('next/script'), { ssr: true });

interface StructuredDataProps {
  data: object;
  id?: string;
  strategy?: ScriptProps['strategy'];
}

export default function StructuredData({ 
  data, 
  id = 'structured-data', 
  strategy = 'afterInteractive' 
}: StructuredDataProps) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      strategy={strategy}
      dangerouslySetInnerHTML={{ 
        __html: JSON.stringify(data) 
      }}
    />
  );
}

// Critical structured data component for homepage
interface CriticalStructuredDataProps {
  schemas: object[];
}

export function CriticalStructuredData({ schemas }: CriticalStructuredDataProps) {
  return (
    <>
      {schemas.map((schema, index) => (
        <StructuredData 
          key={index}
          data={schema}
          id={`critical-schema-${index}`}
          strategy="beforeInteractive"
        />
      ))}
    </>
  );
}