import { createContext, useContext } from 'react';

export interface StageApi {
  /**
   * Deja ver el mapa tras elegir algo en el panel: en pantallas estrechas el panel tapa casi todo
   * y se cierra; en las anchas sigue abierto (el mapa sigue a la vista y se puede usar).
   */
  reveal: () => void;
}

export const StageContext = createContext<StageApi>({ reveal: () => undefined });

/** Lo que el contenido del panel puede pedirle al escenario. */
export const useStage = (): StageApi => useContext(StageContext);
