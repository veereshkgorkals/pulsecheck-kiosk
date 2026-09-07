const TOKEN_DATE_KEY = 'pulsecheck_token_date';
const TOKEN_NUM_KEY = 'pulsecheck_last_token_num';

export const getNextTokenNumber = (): string => {
  const today = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
  
  const savedDate = localStorage.getItem(TOKEN_DATE_KEY);
  let lastNum = parseInt(localStorage.getItem(TOKEN_NUM_KEY) || '0', 10);
  
  if (savedDate !== today) {
    // New day, reset the token sequence
    lastNum = 1;
    localStorage.setItem(TOKEN_DATE_KEY, today);
  } else {
    // Same day, increment
    lastNum += 1;
  }
  
  localStorage.setItem(TOKEN_NUM_KEY, lastNum.toString());
  
  // Format token like #T-001
  return `#T-${String(lastNum).padStart(3, '0')}`;
};
