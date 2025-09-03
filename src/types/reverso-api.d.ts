declare module 'reverso-api' {
  interface ReversoResponse {
    text: string;
    from: string;
    to: string;
  }

  function reverso(
    text: string,
    from: string,
    to: string
  ): Promise<ReversoResponse>;

  export default reverso;
}
