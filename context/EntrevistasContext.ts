import { createContext } from "react";

export interface Entrevista {
  id: number;
  titulo: { ES: string; EN: string };
  descripcion: { ES: string; EN: string };
  fecha: string;
  fechaISO: string;
  likes: number;
  videoUrl?: string;
}

interface EntrevistasContextType {
  entrevistas: Entrevista[];
}

export const EntrevistasContext = createContext<EntrevistasContextType>({
  entrevistas: [],
});
