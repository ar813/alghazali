/**
 * Extracts only the digits from a string and limits to 13 characters
 * @param s - Input string that may contain digits and other characters
 * @returns String containing only digits, limited to 13 characters
 */
export const onlyDigits = (s: string): string => {
  return (s || '').replace(/\D+/g, '').slice(0, 13);
};