declare module 'reverso-api' {
  interface ReversoTranslationResponse {
    text: string;
    source: string;
    target: string;
    translations: string[];
    context?: any;
    detected_language?: string;
    voice?: string;
  }

  interface ReversoError {
    ok: boolean;
    message: string;
  }

  class Reverso {
    constructor();
    
    getTranslation(
      text: string,
      from: string,
      to: string,
      callback: (err: ReversoError | null, response?: ReversoTranslationResponse) => void
    ): void;

    getContext(
      text: string,
      from: string,
      to: string,
      callback: (err: ReversoError | null, response?: any) => void
    ): void;

    getSynonyms(
      text: string,
      language: string,
      callback: (err: ReversoError | null, response?: any) => void
    ): void;

    getSpellCheck(
      text: string,
      language: string,
      callback: (err: ReversoError | null, response?: any) => void
    ): void;

    getConjugation(
      text: string,
      language: string,
      callback: (err: ReversoError | null, response?: any) => void
    ): void;
  }

  export default Reverso;
}
