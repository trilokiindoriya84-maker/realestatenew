// Validation helper functions

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  // Check if it's exactly 10 digits
  return cleanPhone.length === 10;
};

export const formatPrice = (price: string | number): string => {
  const numPrice = typeof price === 'string' ? parseInt(price) : price;
  if (numPrice >= 10000000) {
    return `₹${(numPrice / 10000000).toFixed(1)} Cr`;
  } else if (numPrice >= 100000) {
    return `₹${(numPrice / 100000).toFixed(1)} L`;
  } else if (numPrice >= 1000) {
    return `₹${(numPrice / 1000).toFixed(1)} K`;
  }
  return `₹${numPrice}`;
};

export const formatArea = (area: string, unit: string): string => {
  return `${area} ${unit}`;
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};