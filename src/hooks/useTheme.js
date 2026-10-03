import { createContext, useContext } from 'react';

export const ThemeContext = createContext({ preference: 'system', resolvedTheme: 'light', setPreference: () => {} });
export const useTheme = () => useContext(ThemeContext);
