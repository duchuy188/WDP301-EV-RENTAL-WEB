import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to Vietnamese format (DD/MM/YYYY)
 * @param dateInput - Date string, Date object, or timestamp
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatDateVN(dateInput: string | Date | number): string {
  try {
    // Handle null, undefined, empty string
    if (!dateInput || (typeof dateInput === 'string' && dateInput.trim() === '')) {
      return 'Invalid Date';
    }
    
    // Handle special cases for string inputs
    if (typeof dateInput === 'string') {
      const lowerCase = dateInput.toLowerCase().trim();
      
      // Check for non-expiry strings
      if (lowerCase.includes('không thời hạn') || 
          lowerCase.includes('vô thời hạn') || 
          lowerCase.includes('permanent') || 
          lowerCase.includes('no expiry') ||
          lowerCase.includes('không hạn') ||
          lowerCase === 'không có' ||
          lowerCase === 'n/a') {
        return 'Không thời hạn';
      }
      
      // If string doesn't contain any digits, it's probably not a date
      if (!dateInput.match(/\d/)) {
        return 'Invalid Date';
      }
    }
    
    let date: Date;
    
    if (typeof dateInput === 'string') {
      const trimmedInput = dateInput.trim();
      
      // Handle different string formats
      if (trimmedInput.includes('/')) {
        const parts = trimmedInput.split('/');
        if (parts.length === 3) {
          // Check if it might be MM/DD/YYYY (US format) vs DD/MM/YYYY (VN format)
          const [first, second, third] = parts.map(p => parseInt(p.trim()));
          
          // Validate numbers
          if (isNaN(first) || isNaN(second) || isNaN(third)) {
            return 'Invalid Date';
          }
          
          // If first part > 12, it's likely DD/MM/YYYY
          // If second part > 12, it's likely MM/DD/YYYY  
          if (first > 12) {
            // DD/MM/YYYY format
            date = new Date(third, second - 1, first);
          } else if (second > 12) {
            // MM/DD/YYYY format, convert to DD/MM/YYYY
            date = new Date(third, first - 1, second);
          } else {
            // Ambiguous case, assume DD/MM/YYYY (Vietnamese standard)
            date = new Date(third, second - 1, first);
          }
        } else {
          date = new Date(trimmedInput);
        }
      } else {
        date = new Date(trimmedInput);
      }
    } else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error in formatDateVN:', error, 'for input:', dateInput);
    return 'Invalid Date';
  }
}

/**
 * Format date and time to Vietnamese format (DD/MM/YYYY HH:mm)
 * @param dateInput - Date string, Date object, or timestamp
 * @returns Formatted date time string in DD/MM/YYYY HH:mm format
 */
export function formatDateTimeVN(dateInput: string | Date | number): string {
  try {
    if (!dateInput) {
      return 'Invalid Date';
    }

    let date: Date;
    
    if (typeof dateInput === 'string') {
      // Handle DD/MM/YYYY format
      if (dateInput.includes('/')) {
        const parts = dateInput.split(' ')[0].split('/');
        if (parts.length === 3) {
          const [first, second, third] = parts.map(p => parseInt(p));
          
          if (first > 12) {
            date = new Date(third, second - 1, first);
          } else if (second > 12) {
            date = new Date(third, first - 1, second);
          } else {
            date = new Date(third, second - 1, first);
          }
        } else {
          date = new Date(dateInput);
        }
      } else {
        // Handle ISO format (e.g., "2025-11-18T08:01:31.687Z")
        date = new Date(dateInput);
      }
    } else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error in formatDateTimeVN:', error, 'for input:', dateInput);
    return 'Invalid Date';
  }
}
