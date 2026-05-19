/**
 * Formats a 24-hour time string (e.g., "14:30") to a 12-hour format with AM/PM (e.g., "02:30 PM").
 * @param {string} time24 - The time string in 24-hour format.
 * @returns {string} The formatted 12-hour time string.
 */
export const formatTime12h = (time24) => {
  if (!time24) return '';
  
  const lowerTime = time24.toLowerCase();
  if (lowerTime.includes('am') || lowerTime.includes('pm')) {
    return time24;
  }
  
  try {
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours);
    const m = minutes;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    return `${h}:${m} ${ampm}`;
  } catch (err) {
    console.error("Error formatting time:", err);
    return time24;
  }
};
