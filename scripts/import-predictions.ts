// scripts/import-predictions.ts
// Ejecutar con: npx tsx scripts/import-predictions.ts

import { parse } from 'csv-parse';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// Usar credenciales de producción si es necesario
const DATABASE_URL_PROD = process.env.DATABASE_URL; // Tu URL de producción si la necesitas

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL_PROD || process.env.DATABASE_URL,
    },
  },
});

async function importPredictions() {
  const csvFilePath = './event_predictions.csv';
  
  try {
    // Verificar que el archivo existe
    if (!fs.existsSync(csvFilePath)) {
      console.error('❌ No se encontró el archivo CSV en:', csvFilePath);
      return;
    }

    // Primero, asegúrate de que el evento existe
    const eventSlug = 'ipc-agosto-2025'; // CAMBIAR: Verifica que este slug sea el correcto
    const event = await prisma.event.findUnique({
      where: { slug: eventSlug }
    });

    if (!event) {
      console.error('❌ No se encontró el evento con slug:', eventSlug);
      console.log('Eventos disponibles:');
      const allEvents = await prisma.event.findMany();
      allEvents.forEach(e => console.log(`  - ${e.slug}: ${e.name}`));
      return;
    }

    console.log('✅ Evento encontrado:', event.name);
    console.log('📂 Leyendo archivo CSV...');

    // Leer y parsear el CSV
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // Primero parseamos todo el CSV para procesarlo de forma síncrona
    const records = await new Promise<any[]>((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      }, (err: any, data: any) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    console.log(`📊 Se encontraron ${records.length} predicciones para importar`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    let usersCreated = 0;

    // Procesar cada registro
    for (const record of records) {
      try {
        // Verificar si el usuario existe en la base de datos
        let userProfile = await prisma.userProfile.findUnique({
          where: { userId: record.user_id }
        });

        // Si no existe, buscar por email primero para evitar duplicados
        if (!userProfile) {
          userProfile = await prisma.userProfile.findFirst({
            where: { email: record.user_email }
          });
          
          if (userProfile) {
            console.log(`⚠️  Usuario encontrado por email pero con diferente ID: ${record.user_email}`);
            // Actualizar el userId si es necesario
            if (userProfile.userId !== record.user_id) {
              console.log(`   Actualizando userId de ${userProfile.userId} a ${record.user_id}`);
              userProfile = await prisma.userProfile.update({
                where: { id: userProfile.id },
                data: { userId: record.user_id }
              });
            }
          } else {
            // Crear perfil básico
            console.log(`👤 Creando perfil para usuario ${record.user_email}`);
            userProfile = await prisma.userProfile.create({
              data: {
                userId: record.user_id,
                email: record.user_email,
                role: 'user',
                name: null, // Se actualizará cuando sincronices con Clerk
              }
            });
            usersCreated++;
          }
        }

        // Verificar si ya existe una predicción para este usuario y evento
        const existingPrediction = await prisma.eventPrediction.findUnique({
          where: {
            eventId_userId: {
              eventId: event.id,
              userId: userProfile.userId
            }
          }
        });

        if (existingPrediction) {
          console.log(`⏭️  Saltando predicción existente para ${record.user_email}`);
          skipped++;
          continue;
        }

        // Crear la predicción
        await prisma.eventPrediction.create({
          data: {
            eventId: event.id,
            userId: userProfile.userId,
            userEmail: record.user_email,
            ipcGeneral: parseFloat(record.ipc_general),
            ipcBienes: parseFloat(record.ipc_bienes),
            ipcServicios: parseFloat(record.ipc_servicios),
            ipcAlimentos: parseFloat(record.ipc_alimentos_bebidas || record.ipc_alimentos || '0'),
            createdAt: new Date(record.created_at),
          }
        });

        imported++;
        
        if (imported % 10 === 0) {
          console.log(`✅ ${imported} predicciones importadas...`);
        }
      } catch (error: any) {
        console.error(`❌ Error importando predicción para ${record.user_email}:`, error.message);
        errors++;
      }
    }

    // Actualizar el contador de participantes del evento
    await prisma.event.update({
      where: { id: event.id },
      data: {
        participantsCount: imported + skipped
      }
    });

    console.log('\n📈 Resumen de importación:');
    console.log(`✅ Predicciones importadas: ${imported}`);
    console.log(`⏭️ Predicciones saltadas (ya existían): ${skipped}`);
    console.log(`👤 Usuarios creados: ${usersCreated}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📊 Total de participantes en el evento: ${imported + skipped}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la importación
console.log('🚀 Iniciando importación de predicciones...');
importPredictions();