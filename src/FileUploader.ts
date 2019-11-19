import BlueBird from 'bluebird';

interface FileUploaderOptions {
  partSize?: number;
  concurrency?: number;
  fetch?: any;
  s3Client: any;
}

interface File {
  read(length: number, position: number): Promise<FileChunk>;
  stats(): Promise<FileStats>;
}
interface FileStats {
  size: number;
}
interface FileChunk {
  value(): any;
}

enum FilePartStatus {
  PENDING,
  COMPLETE,
  FAILED
}

export interface FilePart {
  status: FilePartStatus;
  url: string;
  uploadId: string;
  partNumber: number;
  failedCount: number;
}
interface FileMapItem {
  PartNumber: number;
  ETag: string;
}

type Bootstraper = (path: string, parts: Array<FilePart>) => Promise<File>;

class FileUploader {
  static bootstrap: Bootstraper;

  file: File;

  bucket: string;

  key: string;

  uploadId: string;

  parts: Array<FilePart>;

  partSize: number;

  partMap?: BlueBird<Array<FileMapItem>>;

  concurrency: number;

  s3Client: any;

  fetch: any;

  constructor(file: File, bucket: string, key: string, parts: Array<FilePart>,
    options?: FileUploaderOptions) {
    this.file = file;
    this.bucket = bucket;
    this.key = key;
    this.s3Client = (options && options.s3Client) ? options.s3Client : null;
    this.fetch = (options && options.fetch) ? options.fetch : fetch;
    this.uploadId = parts[0].uploadId;
    this.parts = parts;
    this.partSize = (options && options.partSize) ? options.partSize : (5 * 1024 * 1024);
    this.concurrency = (options && options.concurrency) ? options.concurrency : 5;
  }

  async start(): Promise<void> {
    const filteredParts = this.parts.filter((x) => x.status !== FilePartStatus.COMPLETE);
    this.partMap = BlueBird.map(filteredParts, async (part, index) => {
      const fStats = await this.file.stats();
      let alloc = this.partSize;
      const pos = alloc * (part.partNumber - 1);
      if (index === filteredParts.length - 1 && fStats.size % this.partSize !== 0) {
        alloc = fStats.size % this.partSize;
      }

      const chunk = await this.file.read(alloc, pos);
      const resp = await this.fetch(part.url, {
        method: 'PUT',
        body: chunk.value(),
      });
      if (resp.status === 200) {
        part.status = FilePartStatus.COMPLETE;
      } else {
        part.status = FilePartStatus.FAILED;
      }
      return {
        PartNumber: part.partNumber,
        ETag: resp.headers.get('ETag'),
      } as FileMapItem;
    }, { concurrency: this.concurrency });

    await this.s3Client.completeMultipartUpload({
      Bucket: this.bucket,
      Key: this.key,
      UploadId: this.uploadId,
      MultipartUpload: {
        Parts: await this.partMap,
      },
    }).promise();
  }
}

export default FileUploader;
