import { createContext } from 'react';

/** Standalone play can return to its selected language; other games keep the normal home. */
export const GameHomeContext = createContext('/library');
