import Promise from 'bluebird';

interface FileUploaderOptions {
  partSize?: number;
  concurrency?: number;
}

interface File {
  read(path: string): FilePart;
}

interface FilePart {
  value(path: string): FilePart;
}

class FileUploader {
  file: File;

  parts: [string];

  partSize: number;

  concurrency: number;

  completed: [string];

  constructor(file: File, parts: [string], options?: FileUploaderOptions) {
    this.file = file;
    this.parts = parts;
    this.partSize = (options && options.partSize) ? options.partSize : (5 * 1024 * 1024);
    this.concurrency = (options && options.concurrency) ? options.concurrency : 5;
  }

  // start(): void {
    
  // }

  upload
}

export default FileUploader;
