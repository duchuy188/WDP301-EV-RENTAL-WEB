/**
 * Utility functions for vehicle-related operations
 */

/**
 * Convert vehicle type to Vietnamese
 * @param type - Vehicle type in English (e.g., 'motorcycle', 'scooter')
 * @returns Vehicle type in Vietnamese
 */
export const getVehicleTypeInVietnamese = (type: string): string => {
  const typeMap: Record<string, string> = {
    'motorcycle': 'Xe mô tô',
    'scooter': 'Xe tay ga',
    'electric': 'Xe điện',
    'bike': 'Xe đạp điện',
    'car': 'Ô tô'
  };
  return typeMap[type.toLowerCase()] || type;
};

