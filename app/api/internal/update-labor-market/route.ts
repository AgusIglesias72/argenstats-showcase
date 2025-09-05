import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { LaborMarketFetcher } from "@/lib/services/indec/labor-market-fetcher";
import { invalidateCache } from "@/lib/api/cache";

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();
    console.info("🚀 Iniciando actualización del mercado laboral (EPH)");

    const fetcher = new LaborMarketFetcher();
    const laborData = await fetcher.fetchLaborMarketData();

    console.info(
      `📊 Obtenidos ${laborData.length} registros del mercado laboral`
    );

    if (laborData.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No se obtuvieron datos del mercado laboral",
      });
    }

    // Analizar los datos
    const regions = new Set(laborData.map((item) => item.region));
    const periods = new Set(laborData.map((item) => item.period));
    const breakdown = {
      national: laborData.filter((item) => item.dataType === "national").length,
      regional: laborData.filter((item) => item.dataType === "regional").length,
      demographic: laborData.filter((item) => item.dataType === "demographic")
        .length,
    };

    console.info(
      `📈 Datos incluyen ${regions.size} regiones y ${periods.size} períodos`
    );
    console.info(
      `📊 Breakdown: Nacional=${breakdown.national}, Regional=${breakdown.regional}, Demográfico=${breakdown.demographic}`
    );

    // Eliminar registros existentes de los períodos que vamos a actualizar
    const uniqueDates = [...new Set(laborData.map((d) => d.date))];

    console.info(
      `Eliminando registros existentes de ${uniqueDates.length} fechas...`
    );
    await prisma.laborMarket.deleteMany({
      where: {
        date: { in: uniqueDates },
      },
    });

    // Insertar datos en batches
    console.info("💾 Guardando datos en la base de datos...");
    const batchSize = 1000;
    let totalInserted = 0;

    for (let i = 0; i < laborData.length; i += batchSize) {
      const batch = laborData.slice(i, i + batchSize);

      const result = await prisma.laborMarket.createMany({
        data: batch,
        skipDuplicates: true,
      });

      totalInserted += result.count;
      await invalidateCache("employment:");
      console.info("🗑️ Cache de employment invalidado");
      console.info(`Procesados ${totalInserted}/${laborData.length} registros`);
    }

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Registrar ejecución
    await prisma.cronExecution.create({
      data: {
        taskName: "update-labor-market",
        executionTime: new Date(),
        status: "success",
        recordsProcessed: totalInserted,
        results: {
          totalRegistros: totalInserted,
          regiones: regions.size,
          periodos: periods.size,
          breakdown,
          tiempo: `${executionTime}s`,
          fechas: {
            desde: uniqueDates[0],
            hasta: uniqueDates[uniqueDates.length - 1],
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      recordsProcessed: totalInserted,
      regiones: regions.size,
      periodos: periods.size,
      breakdown,
      executionTime: `${executionTime}s`,
      message: `Se actualizaron ${totalInserted} registros del mercado laboral en ${executionTime} segundos`,
    });
  } catch (error) {
    console.error("Error updating labor market:", error);

    await prisma.cronExecution.create({
      data: {
        taskName: "update-labor-market",
        executionTime: new Date(),
        status: "error",
        recordsProcessed: 0,
        errorDetails: (error as Error).message,
        results: {},
      },
    });

    return NextResponse.json(
      {
        error: "Failed to update labor market",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
