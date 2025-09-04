import axios from "axios";
import * as XLSX from "xlsx";

// Tipos de datos
export interface IpcData {
  date: string;
  component: string;
  component_code: string;
  component_type: string;
  index_value: number;
  monthly_pct_change?: number | null;
  yearly_pct_change?: number | null;
  accumulated_pct_change?: number | null;
  region: string;
  created_at: string;
}

export interface EmaeData {
  date: string;
  original_value: number;
  seasonally_adjusted_value: number;
  cycle_trend_value: number;
  activities_data: any;
  created_at: string;
}

export interface EmaeByActivityData {
  date: string;
  economy_sector: string;
  economy_sector_code: string;
  original_value: number;
  created_at: string;
}

export class IndecFetcher {
  private readonly EMAE_URL =
    "https://www.indec.gob.ar/ftp/cuadros/economia/sh_emae_mensual_base2004.xls";
  private readonly EMAE_ACTIVITY_URL =
    "https://www.indec.gob.ar/ftp/cuadros/economia/sh_emae_actividad_base2004.xls";

  /**
   * Genera un código a partir del nombre de un componente
   */
  private generateCodeFromName(name: string): string {
    const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const code = normalized
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/g, "")
      .replace(/_+/g, "_");

    if (code.length > 20) {
      const parts = code.split("_");
      if (parts.length > 1) {
        if (parts[0].length >= 8) {
          return parts[0];
        } else {
          return parts.map((part) => part.substring(0, 3)).join("_");
        }
      }
      return code.substring(0, 20);
    }

    return code;
  }

  /**
   * Extrae una fecha en formato ISO de diferentes formatos
   */
  private extractDateFromValue(value: any): string | null {
    function getLastDayOfMonth(year: number, month: number): string {
      const lastDay = new Date(year, month, 0);
      return `${year}-${String(month).padStart(2, "0")}-${String(
        lastDay.getDate()
      ).padStart(2, "0")}`;
    }

    // Caso 1: Es un objeto Date
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = value.getMonth() + 1;
      return getLastDayOfMonth(year, month);
    }

    // Caso 2: Es un número (posiblemente número de serie de Excel)
    if (typeof value === "number") {
      try {
        const dateObj = XLSX.SSF.parse_date_code(value);
        if (dateObj && dateObj.y && dateObj.m) {
          return getLastDayOfMonth(dateObj.y, dateObj.m);
        }

        if (value > 10000) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            return getLastDayOfMonth(year, month);
          }
        }
      } catch (e) {
        console.warn(
          `No se pudo convertir el valor numérico ${value} a fecha:`,
          e
        );
      }
      return null;
    }

    // Caso 3: Es una cadena de texto
    if (typeof value === "string") {
      const dateStr = value.trim();

      // Formato YYYY-MM o YYYY-MM-DD
      if (dateStr.match(/^\d{4}-\d{2}(?:-\d{2})?$/)) {
        if (dateStr.length === 7) {
          const year = parseInt(dateStr.substring(0, 4));
          const month = parseInt(dateStr.substring(5, 7));
          return getLastDayOfMonth(year, month);
        }
        return dateStr;
      }

      // Formato MM/YYYY o MM/YY
      if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts.length === 2) {
          const month = parseInt(parts[0]);
          let year = parseInt(parts[1]);
          if (parts[1].length === 2) {
            year = 2000 + year;
          }
          return getLastDayOfMonth(year, month);
        }
      }

      // Formato DD/MM/YYYY o DD-MM-YYYY
      const ddmmyyyyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
      const ddmmyyyyMatch = dateStr.match(ddmmyyyyRegex);
      if (ddmmyyyyMatch) {
        const month = parseInt(ddmmyyyyMatch[2]);
        const year = parseInt(ddmmyyyyMatch[3]);
        return getLastDayOfMonth(year, month);
      }

      // Formato MM.YYYY o MM.YY
      if (dateStr.includes(".")) {
        const parts = dateStr.split(".");
        if (parts.length === 2) {
          const month = parseInt(parts[0]);
          let year = parseInt(parts[1]);
          if (parts[1].length === 2) {
            year = 2000 + year;
          }
          return getLastDayOfMonth(year, month);
        }
      }

      // Si tiene nombre del mes, intentar parsearlo
      const monthNames = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
        "ene",
        "feb",
        "mar",
        "abr",
        "may",
        "jun",
        "jul",
        "ago",
        "sep",
        "oct",
        "nov",
        "dic",
      ];

      const lowerDateStr = dateStr.toLowerCase();
      let foundMonth = -1;
      let foundYear = null;

      for (let i = 0; i < monthNames.length; i++) {
        if (lowerDateStr.includes(monthNames[i])) {
          foundMonth = i % 12;
          break;
        }
      }

      const yearMatch = lowerDateStr.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        foundYear = yearMatch[1];
      }

      if (foundMonth !== -1 && foundYear) {
        return getLastDayOfMonth(parseInt(foundYear), foundMonth + 1);
      }

      // Último intento: usar Date.parse
      try {
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          const month = parsedDate.getMonth() + 1;
          return getLastDayOfMonth(year, month);
        }
      } catch (e) {
        console.warn(`Error al parsear la fecha ${dateStr}:`, e);
      }
    }

    return null;
  }

  /**
   * Descarga con reintentos
   */
  private async downloadWithRetry(
    url: string,
    retries = 3,
    delay = 10000
  ): Promise<any> {
    const axiosConfig = {
      responseType: "arraybuffer" as const,
      timeout: 0,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    };

    for (let i = 0; i < retries; i++) {
      try {
        console.info(
          `Intento ${i + 1} de ${retries} para descargar desde: ${url}`
        );
        console.info(
          `Sin timeout configurado - esperando hasta que se complete la descarga...`
        );

        const startTime = Date.now();
        const result = await axios.get(url, axiosConfig);
        const elapsedTime = (Date.now() - startTime) / 1000;

        console.info(
          `Descarga completada en ${elapsedTime.toFixed(1)} segundos`
        );
        return result;
      } catch (err: any) {
        const isLastAttempt = i === retries - 1;

        if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
          console.warn(`Timeout en intento ${i + 1}: ${err.message}`);
        } else if (err.code === "ECONNRESET") {
          console.warn(
            `Conexión reiniciada en intento ${i + 1}: ${err.message}`
          );
        } else {
          console.warn(`Error en intento ${i + 1}: ${err.message}`);
        }

        if (!isLastAttempt) {
          const waitTime = delay * (i + 1);
          console.info(
            `Esperando ${
              waitTime / 1000
            } segundos antes del siguiente intento...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          throw err;
        }
      }
    }
    throw new Error(
      "No se pudo descargar el archivo después de todos los intentos"
    );
  }

  /**
   * Obtiene los datos del IPC desde el archivo Excel del INDEC
   */
  async fetchIpcData(): Promise<IpcData[]> {
    try {
      const now = new Date();
      let response = null;
      let successfulMonth = null;

      // Intentar con el mes actual y los 2 anteriores
      for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
        const targetDate = new Date(
          now.getFullYear(),
          now.getMonth() - monthOffset,
          1
        );
        const month = String(targetDate.getMonth() + 1).padStart(2, "0");
        const year = String(targetDate.getFullYear()).slice(-2); // Últimos 2 dígitos del año
        const url = `https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_${month}_${year}.xls`;

        console.info(
          `Intentando descargar IPC del mes ${month}/${year} desde: ${url}`
        );

        try {
          const tempResponse = await this.downloadWithRetry(url, 2, 5000);

          // Verificar que es realmente un archivo Excel y no HTML
          const buffer = Buffer.from(tempResponse.data);
          const firstBytes = buffer.slice(0, 8).toString("hex");

          // Los archivos XLS comienzan con D0CF11E0A1B11AE1 (formato OLE2)
          // o con 504B0304 (formato OOXML/XLSX)
          if (
            firstBytes.startsWith("d0cf11e0") ||
            firstBytes.startsWith("504b0304")
          ) {
            console.info(
              `✓ Archivo Excel válido descargado para el mes ${month}/${year}`
            );
            response = tempResponse;
            successfulMonth = `${month}/${year}`;
            break;
          } else {
            // Verificar si es HTML
            const content = buffer.toString("utf8", 0, 200);
            if (content.includes("<html") || content.includes("<!DOCTYPE")) {
              console.warn(
                `El archivo descargado para ${month}/${year} es HTML, no Excel. Probablemente no existe.`
              );
            } else {
              console.warn(
                `El archivo descargado para ${month}/${year} tiene un formato desconocido.`
              );
            }
          }
        } catch (error) {
          console.warn(
            `Error al descargar IPC del mes ${month}/${year}: ${
              (error as Error).message
            }`
          );
        }
      }

      if (!response) {
        throw new Error(
          "No se pudo descargar el archivo del IPC de ningún mes (se intentaron los últimos 3 meses)"
        );
      }

      console.info(
        `Procesando archivo Excel del IPC del mes ${successfulMonth}...`
      );

      const workbook = XLSX.read(response.data, {
        type: "buffer",
        cellDates: true,
      });

      console.info("Hojas disponibles en el Excel:", workbook.SheetNames);

      // Buscar específicamente la hoja de índices, no de variaciones
      let targetSheetName = workbook.SheetNames.find(
        (name) =>
          name === "Índices IPC Cobertura Nacional" ||
          name === "Indices IPC Cobertura Nacional" ||
          (name.includes("ndices") &&
            name.includes("IPC") &&
            name.includes("Cobertura"))
      );

      if (!targetSheetName) {
        // Si no encontramos la hoja de índices, buscar alternativas
        console.warn(
          "No se encontró la hoja de índices. Hojas disponibles:",
          workbook.SheetNames
        );

        // Como fallback, buscar cualquier hoja que tenga "IPC" pero NO "Variación"
        const alternativeSheet = workbook.SheetNames.find(
          (name) =>
            name.includes("IPC") &&
            !name.includes("Variación") &&
            !name.includes("Var.")
        );

        if (alternativeSheet) {
          console.info(`Usando hoja alternativa: ${alternativeSheet}`);
          targetSheetName = alternativeSheet;
        } else {
          throw new Error("No se encontró la hoja de índices IPC en el Excel");
        }
      }

      console.info(`Usando hoja: ${targetSheetName}`);

      const worksheet = workbook.Sheets[targetSheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        blankrows: false,
      }) as any[][];

      console.info(`Filas totales en el Excel del IPC: ${data.length}`);

      // Si hay muy pocas filas, algo está mal
      if (data.length < 10) {
        console.error("El archivo tiene muy pocas filas, mostrando contenido:");
        data.forEach((row, index) => {
          console.log(`Fila ${index}:`, row?.slice(0, 5));
        });
        throw new Error("El archivo Excel parece estar vacío o mal formado");
      }

      // Resto del código de procesamiento...
      const processedData: IpcData[] = [];

      // Definir los nombres de las regiones que buscamos
      const regionNames = [
        "Total nacional",
        "Región GBA",
        "Región Pampeana",
        "Región Noroeste",
        "Región Noreste",
        "Región Cuyo",
        "Región Patagonia",
      ];

      const regionNameMapping: Record<string, string> = {
        "Total nacional": "Nacional",
        "Región GBA": "GBA",
        "Región Pampeana": "Pampeana",
        "Región Noroeste": "Noroeste",
        "Región Noreste": "Noreste",
        "Región Cuyo": "Cuyo",
        "Región Patagonia": "Patagonia",
      };

      const expectedRubros = [
        "Alimentos y bebidas no alcohólicas",
        "Bebidas alcohólicas y tabaco",
        "Prendas de vestir y calzado",
        "Vivienda, agua, electricidad, gas y otros combustibles",
        "Equipamiento y mantenimiento del hogar",
        "Salud",
        "Transporte",
        "Comunicación",
        "Recreación y cultura",
        "Educación",
        "Restaurantes y hoteles",
        "Bienes y servicios varios",
      ];

      const expectedCategorias = ["Estacional", "Núcleo", "Regulados"];
      const expectedBienesPlusServicios = ["Bienes", "Servicios"];

      // Identificar las regiones
      const regions: Array<{
        name: string;
        shortName: string;
        startRow: number;
      }> = [];

      for (let i = 0; i < data.length; i++) {
        if (data[i] && data[i][0]) {
          const cellValue = String(data[i][0]).trim();

          const regionIdx = regionNames.findIndex(
            (name) =>
              cellValue === name ||
              cellValue.includes(name) ||
              name.includes(cellValue)
          );

          if (regionIdx !== -1) {
            if (data[i][1] !== null && data[i][1] !== undefined) {
              const regionName = regionNames[regionIdx];
              const shortName = regionNameMapping[regionName] || regionName;

              regions.push({
                name: regionName,
                shortName: shortName,
                startRow: i,
              });

              console.info(`Región encontrada: ${regionName} (fila ${i + 1})`);
            }
          }
        }
      }

      console.info("Regiones identificadas:", regions.length);

      if (regions.length === 0) {
        console.info(
          "No se encontraron regiones. Mostrando primeras filas para depuración:"
        );
        for (let i = 0; i < Math.min(20, data.length); i++) {
          console.info(`Fila ${i + 1}:`, data[i] ? data[i].slice(0, 3) : null);
        }
        throw new Error(
          "No se pudieron identificar regiones en el Excel del IPC"
        );
      }

      // Procesar las fechas del encabezado
      const headerRow = data[regions[0].startRow];
      const dates: string[] = [];

      console.info(
        "Intentando extraer fechas de la fila:",
        regions[0].startRow + 1
      );

      // Procesar directamente de la fila de encabezado
      for (let i = 1; i < headerRow.length; i++) {
        if (headerRow[i] !== null && headerRow[i] !== undefined) {
          const date = this.extractDateFromValue(headerRow[i]);
          if (date) {
            dates.push(date);
          }
        }
      }

      // Si no encontramos fechas, intentar buscar en la siguiente fila
      if (dates.length === 0 && regions[0].startRow + 1 < data.length) {
        console.info(
          "No se encontraron fechas en la fila de encabezado. Intentando con la siguiente fila."
        );
        const nextRow = data[regions[0].startRow + 1];

        if (nextRow) {
          for (let i = 1; i < nextRow.length; i++) {
            if (nextRow[i] !== null && nextRow[i] !== undefined) {
              const date = this.extractDateFromValue(nextRow[i]);
              if (date) {
                dates.push(date);
              }
            }
          }
        }
      }

      // Última alternativa: generar fechas manualmente
      if (dates.length === 0) {
        console.info(
          "No se encontraron fechas. Intentando generar fechas automáticamente."
        );

        const columnCount =
          headerRow.filter((x) => x !== null && x !== undefined).length - 1;

        if (columnCount > 0) {
          const today = new Date();
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth();

          for (let i = 0; i < columnCount; i++) {
            let targetMonth = currentMonth - i;
            let targetYear = currentYear;

            while (targetMonth < 0) {
              targetMonth += 12;
              targetYear -= 1;
            }

            const lastDayOfMonth = new Date(targetYear, targetMonth, 0);
            const date = lastDayOfMonth.toISOString().split("T")[0];
            dates.unshift(date);
          }
        }
      }

      console.info(`Fechas encontradas: ${dates.length}`);
      if (dates.length > 0) {
        console.info("Primera fecha:", dates[0]);
        console.info("Última fecha:", dates[dates.length - 1]);
      } else {
        throw new Error("No se pudieron identificar fechas en el encabezado");
      }

      // Procesar cada región
      for (const region of regions) {
        console.info(`Procesando región: ${region.name}`);

        // Buscar "Nivel general"
        let foundNivelGeneral = false;
        let nivelGeneralRow = -1;

        for (
          let i = region.startRow + 1;
          i < region.startRow + 10 && i < data.length;
          i++
        ) {
          if (data[i] && data[i][0] === "Nivel general") {
            nivelGeneralRow = i;
            foundNivelGeneral = true;
            break;
          }
        }

        if (!foundNivelGeneral) {
          console.warn(
            `No se encontró "Nivel general" para la región ${region.name}`
          );
          continue;
        }

        // Procesar Nivel general
        for (let j = 0; j < dates.length; j++) {
          const colIndex = j + 1;

          if (
            colIndex < data[nivelGeneralRow].length &&
            data[nivelGeneralRow][colIndex] !== null
          ) {
            const value =
              typeof data[nivelGeneralRow][colIndex] === "number"
                ? data[nivelGeneralRow][colIndex]
                : typeof data[nivelGeneralRow][colIndex] === "string" &&
                  !isNaN(parseFloat(data[nivelGeneralRow][colIndex]))
                ? parseFloat(data[nivelGeneralRow][colIndex])
                : null;

            if (value !== null) {
              processedData.push({
                date: dates[j],
                component: "Nivel general",
                component_code: "GENERAL",
                component_type: "GENERAL",
                index_value: value,
                created_at: new Date().toISOString(),
                region: region.shortName,
              });
            }
          }
        }

        // Procesar Rubros
        const currentRow = nivelGeneralRow + 1;
        let rubroCount = 0;

        for (let i = 0; i < 15 && currentRow + i < data.length; i++) {
          const rubroRow = currentRow + i;

          if (!data[rubroRow] || !data[rubroRow][0]) continue;

          const cellValue = String(data[rubroRow][0]).trim();

          const matchedRubroIndex = expectedRubros.findIndex(
            (rubro) =>
              cellValue === rubro ||
              cellValue.includes(rubro) ||
              rubro.includes(cellValue)
          );

          if (matchedRubroIndex !== -1) {
            const rubro = expectedRubros[matchedRubroIndex];
            rubroCount++;

            const componentCode = `RUBRO_${this.generateCodeFromName(rubro)}`;

            for (let j = 0; j < dates.length; j++) {
              const colIndex = j + 1;

              if (
                colIndex < data[rubroRow].length &&
                data[rubroRow][colIndex] !== null
              ) {
                const value =
                  typeof data[rubroRow][colIndex] === "number"
                    ? data[rubroRow][colIndex]
                    : typeof data[rubroRow][colIndex] === "string" &&
                      !isNaN(parseFloat(data[rubroRow][colIndex]))
                    ? parseFloat(data[rubroRow][colIndex])
                    : null;

                if (value !== null) {
                  processedData.push({
                    date: dates[j],
                    component: rubro,
                    component_code: componentCode,
                    component_type: "RUBRO",
                    index_value: value,
                    created_at: new Date().toISOString(),
                    region: region.shortName,
                  });
                }
              }
            }
          } else if (cellValue === "Categorías") {
            break;
          }
        }

        console.info(
          `Procesados ${rubroCount} rubros para la región ${region.name}`
        );

        // Buscar y procesar Categorías
        let categoriasHeaderRow = -1;

        for (
          let i = nivelGeneralRow + rubroCount + 1;
          i < nivelGeneralRow + rubroCount + 15 && i < data.length;
          i++
        ) {
          if (data[i] && data[i][0]) {
            const cellValue = String(data[i][0]).trim().toLowerCase();
            if (
              cellValue === "categorías" ||
              cellValue.includes("categorias")
            ) {
              categoriasHeaderRow = i;
              console.info(`Fila de categorías encontrada en índice ${i}`);
              break;
            }
          }
        }

        if (categoriasHeaderRow !== -1) {
          let categoriaCount = 0;

          for (
            let i = 0;
            i < 7 && categoriasHeaderRow + 1 + i < data.length;
            i++
          ) {
            const categoriaRow = categoriasHeaderRow + 1 + i;

            if (!data[categoriaRow] || !data[categoriaRow][0]) continue;

            const cellValue = String(data[categoriaRow][0]).trim();

            const matchedCategoriaIndex = expectedCategorias.findIndex(
              (cat) => {
                return (
                  cellValue.toLowerCase() === cat.toLowerCase() ||
                  cellValue.toLowerCase().includes(cat.toLowerCase()) ||
                  cat.toLowerCase().includes(cellValue.toLowerCase())
                );
              }
            );

            if (matchedCategoriaIndex !== -1) {
              const categoria = expectedCategorias[matchedCategoriaIndex];
              categoriaCount++;

              for (let j = 0; j < dates.length; j++) {
                const colIndex = j + 1;

                if (
                  colIndex < data[categoriaRow].length &&
                  data[categoriaRow][colIndex] !== null
                ) {
                  const value =
                    typeof data[categoriaRow][colIndex] === "number"
                      ? data[categoriaRow][colIndex]
                      : typeof data[categoriaRow][colIndex] === "string" &&
                        !isNaN(parseFloat(data[categoriaRow][colIndex]))
                      ? parseFloat(data[categoriaRow][colIndex])
                      : null;

                  if (value !== null) {
                    processedData.push({
                      date: dates[j],
                      component: categoria,
                      component_code: `CAT_${this.generateCodeFromName(
                        categoria
                      )}`,
                      component_type: "CATEGORIA",
                      index_value: value,
                      created_at: new Date().toISOString(),
                      region: region.shortName,
                    });
                  }
                }
              }
            } else if (cellValue === "Bienes y servicios") {
              break;
            }
          }

          console.info(
            `Procesadas ${categoriaCount} categorías para la región ${region.name}`
          );
        }

        // Buscar y procesar Bienes y servicios
        let bienesYServiciosHeaderRow = -1;

        const startSearchRow =
          categoriasHeaderRow !== -1
            ? categoriasHeaderRow + 5
            : nivelGeneralRow + rubroCount + 5;

        for (
          let i = startSearchRow;
          i < startSearchRow + 10 && i < data.length;
          i++
        ) {
          if (
            data[i] &&
            (data[i][0] === "Bienes y servicios" ||
              (typeof data[i][0] === "string" &&
                data[i][0].includes("Bienes y servicios")))
          ) {
            bienesYServiciosHeaderRow = i;
            break;
          }
        }

        if (bienesYServiciosHeaderRow !== -1) {
          let bysCount = 0;

          for (
            let i = 0;
            i < 3 && bienesYServiciosHeaderRow + 1 + i < data.length;
            i++
          ) {
            const bysRow = bienesYServiciosHeaderRow + 1 + i;

            if (!data[bysRow] || !data[bysRow][0]) continue;

            const cellValue = String(data[bysRow][0]).trim();

            const matchedBYSIndex = expectedBienesPlusServicios.findIndex(
              (item) =>
                cellValue === item ||
                cellValue.includes(item) ||
                item.includes(cellValue)
            );

            if (matchedBYSIndex !== -1) {
              const bysComponent = expectedBienesPlusServicios[matchedBYSIndex];
              bysCount++;

              for (let j = 0; j < dates.length; j++) {
                const colIndex = j + 1;

                if (
                  colIndex < data[bysRow].length &&
                  data[bysRow][colIndex] !== null
                ) {
                  const value =
                    typeof data[bysRow][colIndex] === "number"
                      ? data[bysRow][colIndex]
                      : typeof data[bysRow][colIndex] === "string" &&
                        !isNaN(parseFloat(data[bysRow][colIndex]))
                      ? parseFloat(data[bysRow][colIndex])
                      : null;

                  if (value !== null) {
                    processedData.push({
                      date: dates[j],
                      component: bysComponent,
                      component_code: `BYS_${bysComponent.toUpperCase()}`,
                      component_type: "BYS",
                      index_value: value,
                      created_at: new Date().toISOString(),
                      region: region.shortName,
                    });
                  }
                }
              }
            }
          }

          console.info(
            `Procesados ${bysCount} componentes de bienes y servicios para la región ${region.name}`
          );
        }
      }

      console.info(
        `Datos IPC procesados: ${processedData.length} registros totales`
      );
      console.info(
        `Regiones procesadas: ${[
          ...new Set(processedData.map((item) => item.region)),
        ].join(", ")}`
      );

      if (processedData.length === 0) {
        throw new Error("No se pudieron obtener datos del IPC");
      }

      return processedData;
    } catch (error) {
      console.error("Error al obtener datos del IPC:", error);
      throw new Error(
        `Error al obtener datos del IPC: ${(error as Error).message}`
      );
    }
  }

  /**
   * Obtiene los datos del EMAE general desde el archivo Excel del INDEC
   */
  async fetchEmaeData(): Promise<EmaeData[]> {
    try {
      const url = this.EMAE_URL;

      console.info(`Descargando Excel del INDEC desde: ${url}`);

      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 0,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      console.info("Archivo descargado, procesando Excel...");
      const workbook = XLSX.read(response.data, {
        type: "buffer",
        cellDates: true,
      });

      console.info("Hojas disponibles en el Excel:", workbook.SheetNames);

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        blankrows: false,
      }) as any[][];

      console.info(`Filas totales en el Excel: ${data.length}`);

      const processedData: EmaeData[] = [];
      let currentYear: number | null = null;

      const monthMap: Record<string, string> = {
        enero: "01",
        febrero: "02",
        marzo: "03",
        abril: "04",
        mayo: "05",
        junio: "06",
        julio: "07",
        agosto: "08",
        septiembre: "09",
        octubre: "10",
        noviembre: "11",
        diciembre: "12",
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 7) continue;

        if (
          row[0] !== null &&
          row[0] !== undefined &&
          typeof row[0] === "number"
        ) {
          if (row[0] >= 1990 && row[0] <= 2030) {
            currentYear = row[0];
          }
        }

        if (!row[1] || typeof row[1] !== "string") continue;

        const monthStr = row[1].toLowerCase().trim();
        if (!monthMap[monthStr]) continue;

        if (currentYear === null) continue;

        let originalValue = 0;
        let seasonallyAdjustedValue = 0;
        let cycleTrendValue = 0;

        // Serie original (Columna C - índice 2)
        if (row[2] !== null && row[2] !== undefined) {
          if (typeof row[2] === "number") {
            originalValue = row[2];
          } else if (typeof row[2] === "string" && !isNaN(parseFloat(row[2]))) {
            originalValue = parseFloat(row[2]);
          }
        }

        // Serie desestacionalizada (Columna E - índice 4)
        if (row[4] !== null && row[4] !== undefined) {
          if (typeof row[4] === "number") {
            seasonallyAdjustedValue = row[4];
          } else if (typeof row[4] === "string" && !isNaN(parseFloat(row[4]))) {
            seasonallyAdjustedValue = parseFloat(row[4]);
          }
        }

        // Tendencia-ciclo (Columna G - índice 6)
        if (row[6] !== null && row[6] !== undefined) {
          if (typeof row[6] === "number") {
            cycleTrendValue = row[6];
          } else if (typeof row[6] === "string" && !isNaN(parseFloat(row[6]))) {
            cycleTrendValue = parseFloat(row[6]);
          }
        }

        const lastDayOfMonth = new Date(
          currentYear,
          parseInt(monthMap[monthStr]),
          0
        );
        const date = lastDayOfMonth.toISOString().split("T")[0];

        processedData.push({
          date,
          original_value: originalValue,
          seasonally_adjusted_value: seasonallyAdjustedValue,
          cycle_trend_value: cycleTrendValue,
          activities_data: null,
          created_at: new Date().toISOString(),
        });

        if (processedData.length <= 3 || processedData.length % 20 === 0) {
          console.info(
            `Registro ${processedData.length}: ${date}, Original=${originalValue}, Desest=${seasonallyAdjustedValue}, Tendencia=${cycleTrendValue}`
          );
        }
      }

      processedData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const uniqueData: Record<string, EmaeData> = {};
      processedData.forEach((item) => {
        uniqueData[item.date] = item;
      });

      const finalData = Object.values(uniqueData);

      console.info(
        `Datos procesados: ${processedData.length} registros iniciales, ${finalData.length} registros únicos`
      );

      if (finalData.length > 0) {
        console.info("Primer registro:", finalData[0]);
        console.info("Último registro:", finalData[finalData.length - 1]);
      } else {
        console.warn("No se encontraron datos válidos");
      }

      return finalData;
    } catch (error) {
      console.error("Error al obtener datos del EMAE:", error);
      throw new Error(
        `Error al obtener datos del EMAE: ${(error as Error).message}`
      );
    }
  }

  /**
   * Obtiene los datos del EMAE por actividad económica
   */
  async fetchEmaeByActivityData(): Promise<EmaeByActivityData[]> {
    try {
      const url = this.EMAE_ACTIVITY_URL;

      console.info(`Descargando Excel de EMAE por actividad desde: ${url}`);

      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 0,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      console.info("Archivo de actividades descargado, procesando Excel...");
      const workbook = XLSX.read(response.data, {
        type: "buffer",
        cellDates: true,
      });

      console.info(
        "Hojas disponibles en el Excel de actividades:",
        workbook.SheetNames
      );

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        blankrows: false,
      }) as any[][];

      console.info(`Filas totales en el Excel de actividades: ${data.length}`);

      let headerRow: any[] = [];
      let headerRowIndex = -1;

      for (let i = 0; i < Math.min(20, data.length); i++) {
        const row = data[i];
        if (
          row &&
          row.length > 5 &&
          row.slice(2).some((cell) => cell !== null)
        ) {
          headerRow = row;
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error(
          "No se pudo encontrar la fila de encabezado con los nombres de las actividades"
        );
      }

      console.info(
        `Fila de encabezado encontrada en el índice ${headerRowIndex}`
      );

      const sectors: Array<{ index: number; code: string; name: string }> = [];

      const sectorCodes = [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
      ];

      for (let i = 2; i < headerRow.length; i++) {
        if (headerRow[i] !== null && headerRow[i] !== undefined) {
          const sectorName = String(headerRow[i]).trim();

          const sectorCodeIndex = i - 2;
          const sectorCode =
            sectorCodeIndex < sectorCodes.length
              ? sectorCodes[sectorCodeIndex]
              : `S${sectorCodeIndex + 1}`;

          sectors.push({
            index: i,
            code: sectorCode,
            name: sectorName,
          });

          console.info(
            `Sector encontrado: ${sectorCode} - ${sectorName} (columna ${i})`
          );
        }
      }

      if (sectors.length === 0) {
        throw new Error(
          "No se pudieron identificar sectores económicos en el Excel"
        );
      }

      const processedData: EmaeByActivityData[] = [];
      let currentYear: number | null = null;

      const monthMap: Record<string, string> = {
        enero: "01",
        febrero: "02",
        marzo: "03",
        abril: "04",
        mayo: "05",
        junio: "06",
        julio: "07",
        agosto: "08",
        septiembre: "09",
        octubre: "10",
        noviembre: "11",
        diciembre: "12",
      };

      for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 3) continue;

        if (
          row[0] !== null &&
          row[0] !== undefined &&
          typeof row[0] === "number"
        ) {
          if (row[0] >= 1990 && row[0] <= 2030) {
            currentYear = row[0];
            console.info(`Año encontrado: ${currentYear}`);
          }
        }

        if (!row[1] || typeof row[1] !== "string") continue;

        const monthStr = row[1].toLowerCase().trim();
        if (!monthMap[monthStr]) continue;

        if (currentYear === null) continue;

        const lastDayOfMonth = new Date(
          currentYear,
          parseInt(monthMap[monthStr]),
          0
        );
        const date = lastDayOfMonth.toISOString().split("T")[0];

        for (const sector of sectors) {
          let value = null;

          if (row[sector.index] !== null && row[sector.index] !== undefined) {
            if (typeof row[sector.index] === "number") {
              value = row[sector.index];
            } else if (
              typeof row[sector.index] === "string" &&
              !isNaN(parseFloat(row[sector.index]))
            ) {
              value = parseFloat(row[sector.index]);
            }
          }

          if (value !== null) {
            const economySectorParts = sector.name.includes("-")
              ? String(sector.name.split("-")[1].trim())
              : sector.name;
            processedData.push({
              date,
              economy_sector: economySectorParts,
              economy_sector_code: sector.code,
              original_value: value,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      console.info(
        `Datos procesados: ${processedData.length} registros para ${sectors.length} sectores`
      );

      if (processedData.length === 0) {
        console.warn("No se encontraron datos válidos");
      } else {
        const groupedByDate: Record<string, EmaeByActivityData[]> = {};
        processedData.forEach((item) => {
          if (!groupedByDate[item.date]) {
            groupedByDate[item.date] = [];
          }
          groupedByDate[item.date].push(item);
        });

        console.info(
          `Total de fechas encontradas: ${Object.keys(groupedByDate).length}`
        );

        const firstDate = Object.keys(groupedByDate).sort()[0];
        console.info(`Ejemplo para la fecha ${firstDate}:`);
        groupedByDate[firstDate].slice(0, 3).forEach((item) => {
          console.info(
            `  Sector ${item.economy_sector_code} (${item.economy_sector}): ${item.original_value}`
          );
        });
      }

      return processedData;
    } catch (error) {
      console.error("Error al obtener datos de EMAE por actividad:", error);
      throw new Error(
        `Error al obtener datos de EMAE por actividad: ${
          (error as Error).message
        }`
      );
    }
  }
}
