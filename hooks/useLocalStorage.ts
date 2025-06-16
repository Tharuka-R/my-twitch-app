import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

function useLocalStorage<T,>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  useEffect(() => {
    try {
        const item = window.localStorage.getItem(key);
        if (item) {
            const parsedItem = JSON.parse(item);
            // Basic check to prevent setting storedValue if it hasn't actually changed
            // This can prevent unnecessary re-renders if the value from localStorage is deep equal
            // For simplicity, a direct set is often fine, but this is a small optimization
            if (JSON.stringify(storedValue) !== JSON.stringify(parsedItem)) {
                 setStoredValue(parsedItem);
            }
        }
    } catch (error) {
        console.error(`Error re-reading localStorage key "${key}" in useEffect:`, error);
    }
  // Only re-run if key changes, or if you want to sync with external changes (more complex)
  // Adding storedValue here would create a loop if not careful.
  }, [key]);


  return [storedValue, setValue];
}

export default useLocalStorage;