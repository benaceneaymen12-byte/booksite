export interface BiocareMediaReference {
  designation: string;
  codePrefix: string;
  validityDays: number;
  category: 'Gelose' | 'Bouillon' | 'Solution';
}

export const BIOCARE_MEDIA_CATALOGUE: BiocareMediaReference[] = [
  { designation: 'GELOSE TSA / TRYPTICASE SOJA', codePrefix: 'LRESOTRY', validityDays: 30, category: 'Gelose' },
  { designation: 'GELOSE SABOURAUD DEXTROSE', codePrefix: 'LRESOSAB', validityDays: 30, category: 'Gelose' },
  { designation: 'GELOSE CHAPMAN / MANNITOL', codePrefix: 'LRESOMAN', validityDays: 30, category: 'Gelose' },
  { designation: 'GELOSE MACCONKEY', codePrefix: 'LRESOMAC', validityDays: 30, category: 'Gelose' },
  { designation: 'BOUILLON MACCONKEY', codePrefix: 'LRELIMAC', validityDays: 15, category: 'Bouillon' },
  { designation: 'GELOSE CETRIMIDE', codePrefix: 'LRESOGEC', validityDays: 30, category: 'Gelose' },
  { designation: 'EAU PHYSIOLOGIQUE', codePrefix: 'LRELIPHY', validityDays: 15, category: 'Solution' },
  { designation: 'SOLUTION TAMPON', codePrefix: 'LRELITAM', validityDays: 15, category: 'Solution' },
  { designation: 'SOLUTION DE RINCAGE', codePrefix: 'LRELIRIN', validityDays: 15, category: 'Solution' },
  { designation: 'BOUILLON TSB', codePrefix: 'LRELIBTS', validityDays: 15, category: 'Bouillon' },
  { designation: 'BOUILLON BTH', codePrefix: 'LRELIBTH', validityDays: 15, category: 'Bouillon' },
  { designation: 'BOUILLON RVS', codePrefix: 'LRELIRVS', validityDays: 15, category: 'Bouillon' },
  { designation: 'BOUILLON EE / ENTERO', codePrefix: 'LRELIEEE', validityDays: 15, category: 'Bouillon' },
  { designation: 'GELOSE R2A', codePrefix: 'LRESOREA', validityDays: 30, category: 'Gelose' },
  { designation: 'GELOSE VIANDE FOIE', codePrefix: 'LRESOVIA', validityDays: 30, category: 'Gelose' },
  { designation: 'GELOSE XLD', codePrefix: 'LRESOXLD', validityDays: 30, category: 'Gelose' },
];

export function getBiocareMediaReference(designation: string) {
  return BIOCARE_MEDIA_CATALOGUE.find((reference) => reference.designation === designation);
}

export function calculateBiocareExpiryDate(designation: string, preparationDate: string) {
  const reference = getBiocareMediaReference(designation);
  if (!reference || !/^\d{4}-\d{2}-\d{2}$/.test(preparationDate)) return '';

  const expiry = new Date(`${preparationDate}T00:00:00Z`);
  expiry.setUTCDate(expiry.getUTCDate() + reference.validityDays);
  return expiry.toISOString().slice(0, 10);
}

export function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateBiocareLotNumber(designation: string, preparationDate: string) {
  const reference = getBiocareMediaReference(designation);
  if (!reference || !/^\d{4}-\d{2}-\d{2}$/.test(preparationDate)) return '';
  return reference.codePrefix;
}
