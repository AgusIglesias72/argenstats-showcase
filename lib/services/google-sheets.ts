// src/services/google-sheets.ts
import { google } from 'googleapis';

const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } = process.env;

if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  throw new Error('Missing Google Sheets credentials in environment variables');
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const googleSheets = google.sheets({
  version: 'v4',
  auth,
});

/**
 * Obtiene filas de una hoja de Google Sheets
 * @param {string} table_name - Nombre de la hoja (ej: 'Hoja1')
 * @param {string} spreadsheet_id - ID de la hoja de cálculo
 * @returns {Promise<Object>} - Respuesta de la API con los datos
 */
export const getRows = async (table_name: string, spreadsheet_id: string) => {
  try {
    const response = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId: spreadsheet_id,
      range: table_name,
    });

    return response;
  } catch (error) {
    console.error('Error al obtener filas de Google Sheets:', error);
    throw error;
  }
};

/**
 * Obtiene filas de una hoja específica con rango personalizado
 * @param {string} spreadsheet_id - ID de la hoja de cálculo
 * @param {string} range - Rango específico (ej: 'Hoja1!A1:C100')
 * @returns {Promise<any[][]>} - Array de arrays con los datos
 */
export const getRowsInRange = async (spreadsheet_id: string, range: string): Promise<any[][]> => {
  try {
    const response = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId: spreadsheet_id,
      range: range,
    });

    return response.data.values || [];
  } catch (error) {
    console.error('Error al obtener rango de Google Sheets:', error);
    throw error;
  }
};

/**
 * Estructura de datos para el riesgo país EMBI
 */
export interface EmbiRow {
  id: string;
  fecha: string;
  indice: number;
}

/**
 * Obtiene datos del riesgo país (EMBI) desde Google Sheets
 * @param {string} spreadsheet_id - ID de la hoja de cálculo
 * @param {string} sheet_name - Nombre de la hoja (por defecto 'EMBI')
 * @returns {Promise<EmbiRow[]>} - Array de datos del riesgo país
 */
export const getEmbiData = async (
  spreadsheet_id: string, 
  sheet_name: string = 'Indice EMBI'
): Promise<EmbiRow[]> => {
  try {
    console.info(`Obteniendo datos EMBI de Google Sheets: ${sheet_name}`);
    
    // Obtener todos los datos de la hoja
    const response = await getRows(sheet_name, spreadsheet_id);
    const rows = response.data.values || [];
    
    if (rows.length <= 1) {
      console.warn('No se encontraron datos en la hoja o solo hay encabezados');
      return [];
    }
    
    // Procesar datos (saltamos la primera fila que son los encabezados)
    const embiData: EmbiRow[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Verificar que la fila tenga al menos 3 columnas (id, fecha, indice)
      if (!row || row.length < 3) {
        console.warn(`Fila ${i + 1} incompleta, saltando...`);
        continue;
      }
      
      const [id, fecha, indice] = row;
      
      // Validar que los datos no estén vacíos
      if (!id || !fecha || !indice) {
        console.warn(`Fila ${i + 1} con datos faltantes, saltando...`);
        continue;
      }
      
      // Validar que el índice sea un número
      const indiceNumber = parseFloat(indice);
      if (isNaN(indiceNumber)) {
        console.warn(`Fila ${i + 1}: índice no es un número válido (${indice}), saltando...`);
        continue;
      }
      
      embiData.push({
        id: String(id),
        fecha: String(fecha),
        indice: indiceNumber
      });
    }
    
    console.info(`Procesados ${embiData.length} registros de EMBI de ${rows.length - 1} filas`);
    return embiData;
    
  } catch (error) {
    console.error('Error al obtener datos EMBI de Google Sheets:', error);
    throw new Error(`Error al obtener datos EMBI: ${(error as Error).message}`);
  }
};