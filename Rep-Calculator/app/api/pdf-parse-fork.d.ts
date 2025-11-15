declare module 'pdf-parse-fork' {
  // eslint-disable-next-line no-unused-vars
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
