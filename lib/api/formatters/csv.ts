// /lib/api/formatters/csv.ts

// Función principal que maneja múltiples indicadores
export function convertToCSV(
  data: any,
  view: string,
  indicator: string = "inflation"
): string {
  switch (indicator) {
    case "inflation":
      return convertInflationToCSV(data, view);
    case "emae":
      return convertEmaeToCSV(data, view);
    case "cer":
      return convertCERToCSV(data, view); // ← Agregar esta línea
    // Employment views
    case "employment-current":
      return formatEmploymentCurrentCSV(data);
    case "employment-historical":
      return formatEmploymentHistoricalCSV(data);
    case "employment-by-region":
      return formatEmploymentRegionalCSV(data);
    case "employment-by-demographics":
    case "employment-by-gender":
    case "employment-by-age":
      return formatEmploymentDemographicCSV(data);
    default:
      throw new Error(`Invalid indicator for CSV format: ${indicator}`);
  }
}

// ==================== INFLACIÓN ====================
function convertInflationToCSV(data: any, view: string): string {
  switch (view) {
    case "current":
      return formatCurrentInflationCSV(data);
    case "historical":
      return formatHistoricalInflationCSV(data);
    case "components":
      return formatComponentsCSV(data);
    case "regions":
      return formatRegionsCSV(data);
    case "calculator":
      return formatCalculatorCSV(data);
    default:
      throw new Error("Invalid view for CSV format");
  }
}

function formatCurrentInflationCSV(data: any): string {
  const headers = [
    "Fecha",
    "Componente",
    "Region",
    "Mensual %",
    "Anual %",
    "Acumulada %",
    "Indice",
  ];
  const row = [
    data.date,
    data.component.name,
    data.region,
    data.values.monthly || "N/A",
    data.values.yearly || "N/A",
    data.values.accumulated || "N/A",
    data.index,
  ];

  return [headers.join(","), row.map(escapeCSV).join(",")].join("\n");
}

function formatHistoricalInflationCSV(data: any[]): string {
  const headers = ["Fecha", "Mensual %", "Anual %", "Acumulada %", "Indice"];
  const rows = data.map((item) => [
    item.date,
    item.values.monthly || "N/A",
    item.values.yearly || "N/A",
    item.values.accumulated || "N/A",
    item.index,
  ]);

  return [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");
}

function formatComponentsCSV(data: any): string {
  const headers = ["Componente", "Tipo", "Mensual %", "Anual %"];
  const rows: any[] = [];

  Object.entries(data.components).forEach(
    ([type, components]: [string, any]) => {
      components.forEach((comp: any) => {
        rows.push([
          comp.name,
          type,
          comp.monthly || "N/A",
          comp.yearly || "N/A",
        ]);
      });
    }
  );

  return [
    `Fecha: ${data.date}`,
    `Region: ${data.region}`,
    "",
    headers.join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");
}

function formatRegionsCSV(data: any): string {
  const headers = ["Region", "Mensual %", "Anual %", "Acumulada %"];
  const rows = data.regions.map((region: any) => [
    region.name,
    region.monthly || "N/A",
    region.yearly || "N/A",
    region.accumulated || "N/A",
  ]);

  return [
    `Fecha: ${data.date}`,
    `Componente: ${data.component.name}`,
    "",
    headers.join(","),
    ...rows.map((row: any[]) => row.map(escapeCSV).join(",")),
  ].join("\n");
}

function formatCalculatorCSV(data: any): string {
  return [
    "Calculadora de Inflacion",
    `Monto Original,${data.calculation.originalAmount}`,
    `Monto Ajustado,${data.calculation.adjustedAmount}`,
    `Diferencia,${data.calculation.difference}`,
    `Tasa de Inflacion,${data.calculation.inflationRate}%`,
    `Perdida Poder Adquisitivo,${data.calculation.purchasingPowerLoss}%`,
    "",
    "Periodo",
    `Desde,${data.period.from.date}`,
    `Hasta,${data.period.to.date}`,
    `Meses,${data.period.months}`,
    `Tasa Anualizada,${data.annualizedRate}%`,
    `Interpretacion,${data.interpretation}`,
  ].join("\n");
}

// ==================== EMAE ====================
function convertEmaeToCSV(data: any, view: string): string {
  switch (view) {
    case "current":
      return formatCurrentEmaeCSV(data);
    case "historical":
      return formatHistoricalEmaeCSV(data);
    case "sectors":
      return formatSectorsEmaeCSV(data);
    case "comparison":
      return formatComparisonEmaeCSV(data);
    default:
      throw new Error("Invalid view for EMAE CSV format");
  }
}

function formatCurrentEmaeCSV(data: any): string {
  const headers = [
    "Fecha",
    "Sector",
    "Nombre",
    "Valor",
    "Valor Original",
    "Var. Mensual %",
    "Var. Anual %",
  ];
  const row = [
    data.date,
    data.sector.code,
    data.sector.name,
    data.value,
    data.originalValue,
    data.variations.monthly?.toFixed(2) || "N/A",
    data.variations.yearly?.toFixed(2) || "N/A",
  ];

  return [headers.join(","), row.map(escapeCSV).join(",")].join("\n");
}

function formatHistoricalEmaeCSV(data: any[]): string {
  const headers = [
    "Fecha",
    "Valor",
    "Valor Original",
    "Var. Mensual %",
    "Var. Anual %",
  ];

  const rows = data.map((item) => [
    item.date || item.period,
    item.value,
    item.originalValue,
    item.variations?.monthly?.toFixed(2) || "N/A",
    item.variations?.yearly?.toFixed(2) || "N/A",
  ]);

  return [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");
}

function formatSectorsEmaeCSV(data: any): string {
  const headers = [
    "Código",
    "Sector",
    "Valor",
    "Índice",
    "Var. Mensual %",
    "Var. Anual %",
  ];
  const rows: any[] = [];

  // Sector general
  if (data.general) {
    rows.push([
      data.general.code,
      data.general.name,
      data.general.value,
      data.general.index,
      data.general.variations?.monthly?.toFixed(2) || "N/A",
      data.general.variations?.yearly?.toFixed(2) || "N/A",
    ]);
  }

  // Sectores productivos
  data.sectors.productive.forEach((sector: any) => {
    rows.push([
      sector.code,
      sector.name,
      sector.value,
      sector.index,
      sector.variations?.monthly?.toFixed(2) || "N/A",
      sector.variations?.yearly?.toFixed(2) || "N/A",
    ]);
  });

  // Impuestos
  if (data.sectors.taxes) {
    rows.push([
      data.sectors.taxes.code,
      data.sectors.taxes.name,
      data.sectors.taxes.value,
      data.sectors.taxes.index,
      data.sectors.taxes.variations?.monthly?.toFixed(2) || "N/A",
      data.sectors.taxes.variations?.yearly?.toFixed(2) || "N/A",
    ]);
  }

  return [
    `Fecha: ${data.date}`,
    `Total Sectores: ${data.summary.totalSectors}`,
    `Sectores Positivos: ${data.summary.positiveSectors}`,
    `Sectores Negativos: ${data.summary.negativeSectors}`,
    "",
    headers.join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");
}

function formatComparisonEmaeCSV(data: any): string {
  // Crear headers dinámicos basados en los sectores
  const headers = ["Fecha"];
  const sectorCodes = data.series.map((s: any) => s.sector.code);

  if (data.metric === "variations") {
    sectorCodes.forEach((code: string) => {
      headers.push(`${code} - Var. Mensual %`, `${code} - Var. Anual %`);
    });
  } else {
    headers.push(...sectorCodes);
  }

  // Obtener todas las fechas únicas
  const allDates = new Set<string>();
  data.series.forEach((s: any) => {
    s.data.forEach((d: any) => {
      allDates.add(d.date);
    });
  });

  // Crear filas
  const rows: any[] = [];
  const sortedDates = Array.from(allDates).sort();

  sortedDates.forEach((date) => {
    const row = [date];

    data.series.forEach((series: any) => {
      const dataPoint = series.data.find((d: any) => d.date === date);

      if (data.metric === "variations") {
        row.push(
          dataPoint?.monthly?.toFixed(2) || "N/A",
          dataPoint?.yearly?.toFixed(2) || "N/A"
        );
      } else {
        row.push(dataPoint?.value || "N/A");
      }
    });

    rows.push(row);
  });

  // Agregar estadísticas al final
  const statsSection = [
    "",
    "Estadísticas",
    "Sector,Mínimo,Máximo,Promedio,Último Valor",
  ];

  data.statistics.forEach((stat: any) => {
    statsSection.push(
      [
        stat.sector.name,
        stat.min.toFixed(2),
        stat.max.toFixed(2),
        stat.average.toFixed(2),
        stat.lastValue.toFixed(2),
      ]
        .map(escapeCSV)
        .join(",")
    );
  });

  return [
    `Período: ${data.period.from} a ${data.period.to}`,
    `Métrica: ${data.metric}`,
    "",
    headers.join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
    ...statsSection,
  ].join("\n");
}

// ==================== CER ====================
function convertCERToCSV(data: any, view: string): string {
  switch (view) {
    case "current":
      return formatCurrentCERCSV(data);
    case "historical":
      return formatHistoricalCERCSV(data);
    case "calculator":
      return formatCalculatorCERCSV(data);
    case "comparison":
      return formatComparisonCERCSV(data);
    default:
      throw new Error("Invalid view for CER CSV format");
  }
}

function formatCurrentCERCSV(data: any): string {
  const headers = [
    "Fecha",
    "Valor CER",
    "Var. Diaria %",
    "Var. Mensual %",
    "Var. Anual %",
    "Var. Acumulada %",
  ];
  const row = [
    data.date,
    data.value,
    data.variations.daily?.toFixed(4) || "N/A",
    data.variations.monthly?.toFixed(2) || "N/A",
    data.variations.yearly?.toFixed(2) || "N/A",
    data.variations.accumulated?.toFixed(2) || "N/A",
  ];

  return [
    "Coeficiente de Estabilización de Referencia (CER)",
    "Fuente: Banco Central de la República Argentina",
    "",
    headers.join(","),
    row.map(escapeCSV).join(","),
  ].join("\n");
}

function formatHistoricalCERCSV(data: any): string {
  const headers = ["Fecha", "Valor CER", "Var. Diaria %"];

  const rows = data.series.map((item: any) => [
    item.date,
    item.value,
    item.dailyVariation?.toFixed(4) || "N/A",
  ]);

  return [
    "Serie Histórica CER",
    `Período: ${data.summary.startDate} a ${data.summary.endDate}`,
    `Variación Total: ${data.summary.totalVariation.toFixed(2)}%`,
    `Promedio Diario: ${data.summary.averageDailyVariation.toFixed(4)}%`,
    `Puntos de Datos: ${data.summary.dataPoints}`,
    "",
    headers.join(","),
    ...rows.map((row: any[]) => row.map(escapeCSV).join(",")),
  ].join("\n");
}

function formatCalculatorCERCSV(data: any): string {
  const calc = data.calculation;
  const analysis = data.analysis;

  return [
    "Calculadora de Ajuste por CER",
    "",
    "CÁLCULO",
    `Monto Original,${calc.amount}`,
    `Fecha Inicial,${calc.fromDate}`,
    `Fecha Final,${calc.toDate}`,
    `CER Inicial,${calc.fromCER}`,
    `CER Final,${calc.toCER}`,
    `Monto Ajustado,${calc.adjustedAmount.toFixed(2)}`,
    `Inflación del Período,${calc.inflationRate.toFixed(2)}%`,
    `Días del Período,${calc.periodInDays}`,
    calc.annualizedRate
      ? `Tasa Anualizada,${calc.annualizedRate.toFixed(2)}%`
      : "",
    "",
    "ANÁLISIS",
    `Ganancia/Pérdida Real,${analysis.realReturn.toFixed(2)}`,
    `Pérdida de Poder Adquisitivo,${analysis.purchasingPowerLoss.toFixed(2)}%`,
    `Valor Equivalente Hoy,${analysis.equivalentTodayValue.toFixed(2)}`,
    "",
    "INTERPRETACIÓN",
    `Para mantener el poder adquisitivo, $${calc.amount} del ${
      calc.fromDate
    } deberían ser $${calc.adjustedAmount.toFixed(2)} el ${calc.toDate}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function formatComparisonCERCSV(data: any): string {
  return [
    "Comparación CER con Otros Indicadores",
    `Período: ${data.period.from} a ${data.period.to} (${data.period.days} días)`,
    "",
    "Indicador,Valor Inicial,Valor Final,Variación %",
    `CER,${data.cer.fromValue},${data.cer.toValue},${data.cer.variation.toFixed(
      2
    )}%`,
    // Agregar otros indicadores cuando estén disponibles
    "",
    data.comparison.message,
  ].join("\n");
}

// Employment CSV formatters
function formatEmploymentCurrentCSV(data: any): string {
  const headers = [
    "Periodo",
    "Fecha",
    "Tasa Actividad",
    "Tasa Empleo",
    "Tasa Desocupacion",
    "Poblacion Total",
    "PEA",
    "Poblacion Ocupada",
    "Poblacion Desocupada",
    "Poblacion Inactiva",
  ];

  const rows = [
    [
      data.period,
      data.date,
      data.national.activityRate,
      data.national.employmentRate,
      data.national.unemploymentRate,
      data.national.totalPopulation,
      data.national.economicallyActivePopulation,
      data.national.employedPopulation,
      data.national.unemployedPopulation,
      data.national.inactivePopulation,
    ],
  ];

  // Agregar datos regionales si existen
  if (data.regions && data.regions.length > 0) {
    const regionalHeaders = [
      "",
      "",
      "Region",
      "Tasa Actividad",
      "Tasa Empleo",
      "Tasa Desocupacion",
    ];
    rows.push([]);
    rows.push(regionalHeaders);

    data.regions.forEach((region: any) => {
      rows.push([
        "",
        "",
        region.region,
        region.activityRate,
        region.employmentRate,
        region.unemploymentRate,
      ]);
    });
  }

  return [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\n");
}

function formatEmploymentHistoricalCSV(data: any[]): string {
  if (!data || data.length === 0) return "";

  // Determinar headers dinámicamente basados en los campos presentes
  const headers = [
    "Periodo",
    "Fecha",
    "Tasa Actividad",
    "Tasa Empleo",
    "Tasa Desocupacion",
  ];
  const firstRow = data[0];

  if (firstRow.region) headers.push("Region");
  if (firstRow.gender) headers.push("Genero");
  if (firstRow.ageGroup) headers.push("Grupo Etario");

  const rows = data.map((item) => {
    const row = [
      item.period,
      item.date,
      item.activityRate,
      item.employmentRate,
      item.unemploymentRate,
    ];

    if (item.region) row.push(item.region);
    if (item.gender) row.push(item.gender);
    if (item.ageGroup) row.push(item.ageGroup);

    return row;
  });

  return [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\n");
}

function formatEmploymentRegionalCSV(data: any[]): string {
  const headers = [
    "Region",
    "Tasa Actividad",
    "Tasa Empleo",
    "Tasa Desocupacion",
    "Poblacion Total",
    "Poblacion Ocupada",
    "Poblacion Desocupada",
  ];

  const rows = data.map((item) => [
    item.region,
    item.activityRate,
    item.employmentRate,
    item.unemploymentRate,
    item.totalPopulation,
    item.employedPopulation,
    item.unemployedPopulation,
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\n");
}

function formatEmploymentDemographicCSV(data: any): string {
  const rows: any[][] = [];

  // Por género
  if (data.gender && data.gender.length > 0) {
    rows.push(["Por Genero"]);
    rows.push([
      "Genero",
      "Tasa Actividad",
      "Tasa Empleo",
      "Tasa Desocupacion",
      "Poblacion",
    ]);

    data.gender.forEach((item: any) => {
      rows.push([
        item.gender || item.segment,
        item.activityRate,
        item.employmentRate,
        item.unemploymentRate,
        item.population,
      ]);
    });
    rows.push([]);
  }

  // Por edad
  if (data.age && data.age.length > 0) {
    rows.push(["Por Grupo Etario"]);
    rows.push([
      "Grupo Etario",
      "Tasa Actividad",
      "Tasa Empleo",
      "Tasa Desocupacion",
      "Poblacion",
    ]);

    data.age.forEach((item: any) => {
      rows.push([
        item.ageGroup || item.segment,
        item.activityRate,
        item.employmentRate,
        item.unemploymentRate,
        item.population,
      ]);
    });
    rows.push([]);
  }

  // Combinado
  if (data.combined && data.combined.length > 0) {
    rows.push(["Por Genero y Edad"]);
    rows.push([
      "Segmento",
      "Tasa Actividad",
      "Tasa Empleo",
      "Tasa Desocupacion",
      "Poblacion",
    ]);

    data.combined.forEach((item: any) => {
      rows.push([
        item.segment,
        item.activityRate,
        item.employmentRate,
        item.unemploymentRate,
        item.population,
      ]);
    });
  }

  return rows.map((row) => row.map(escapeCSV).join(",")).join("\n");
}

// ==================== HELPERS ====================
// Helper para escapar valores CSV
export function escapeCSV(value: any): string {
  if (value === null || value === undefined) return "";

  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

