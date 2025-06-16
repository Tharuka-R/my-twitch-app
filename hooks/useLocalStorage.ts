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
    // This effect can be used to listen to storage events from other tabs/windows if needed.
    // For now, it's primarily to ensure the initial state from localStorage is correctly set.
    // The logic is already in useState initializer, but this hook pattern is common.
    // Re-fetch from localStorage if key changes, though not typical for this hook.
    try {
        const item = window.localStorage.getItem(key);
        if (item) {
            setStoredValue(JSON.parse(item));
        }
    } catch (error) {
        console.error(`Error re-reading localStorage key "${key}" in useEffect:`, error);
    }
  }, [key]);


  return [storedValue, setValue];
}

export default useLocalStorage;