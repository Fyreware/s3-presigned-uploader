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
declare enum FilePartStatus {
    PENDING = 0,
    COMPLETE = 1,
    FAILED = 2
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
declare type Bootstraper = (path: string, parts: Array<FilePart>) => Promise<File>;
declare class FileUploader {
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
    constructor(file: File, bucket: string, key: string, parts: Array<FilePart>, options?: FileUploaderOptions);
    start(): Promise<void>;
}
export default FileUploader;
