"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird_1 = __importDefault(require("bluebird"));
var FilePartStatus;
(function (FilePartStatus) {
    FilePartStatus[FilePartStatus["PENDING"] = 0] = "PENDING";
    FilePartStatus[FilePartStatus["COMPLETE"] = 1] = "COMPLETE";
    FilePartStatus[FilePartStatus["FAILED"] = 2] = "FAILED";
})(FilePartStatus || (FilePartStatus = {}));
class FileUploader {
    constructor(file, bucket, key, parts, options) {
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
    async start() {
        const filteredParts = this.parts.filter((x) => x.status !== FilePartStatus.COMPLETE);
        this.partMap = bluebird_1.default.map(filteredParts, async (part, index) => {
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
            }
            else {
                part.status = FilePartStatus.FAILED;
            }
            return {
                PartNumber: part.partNumber,
                ETag: resp.headers.get('ETag'),
            };
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
exports.default = FileUploader;
