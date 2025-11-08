declare module 'pdf-parse-fork' {
  function parse(_dataBuffer: Buffer): Promise<{
    numpages: number;
    numrender: number;
    info: object;
    metadata: object;
    version: string;
    text: string;
  }>;
  export default parse;
}
