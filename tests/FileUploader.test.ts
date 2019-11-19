import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import FileUploader, {FilePart} from '../src/FileUploader';
import fetch from 'node-fetch';

const credentials = new AWS.SharedIniFileCredentials({ profile: 'iskua' });
AWS.config.update({ region: 'us-east-1' });
AWS.config.credentials = credentials;

const s3 = new AWS.S3()

test('basic', async () => {
  const f = path.join(__dirname,'files','test.pdf')
  const fStats = fs.statSync(f)
  const fd = fs.openSync(f, 'r')
  const file = {
    stats: (async () => fStats),
    read: async (length: number, position: number) => {
      const buff = Buffer.alloc(length);
      fs.readSync(fd, buff, 0, length, position)
      return {
        value: () => buff
      }
    }
  }

  const x = await multiPartPreSigned('iskua-test', 'pie2.pdf', fStats.size)

  const fileUploader = new FileUploader(file, 'iskua-test', 'pie2.pdf', x, {
    s3Client: s3,
    fetch,
  })
  return fileUploader.start()
})

async function multiPartPreSigned(bucket:any, key:any, size:any, partSize = 5 * 1024 * 1024): Promise<Array<FilePart>> {
  const numParts = Math.ceil(size/partSize);
  const multipart = await s3.createMultipartUpload({
    Bucket: bucket, 
    Key: key
  }).promise()

  const urls: Array<FilePart> = [];
  for (let i = 0; i < numParts; i ++) {
    urls.push(
      {
        partNumber: i + 1,
        url: s3.getSignedUrl('uploadPart', {
          Bucket: bucket,
          Key: key,
          Body:'',
          UploadId: multipart.UploadId,
          PartNumber: i + 1
        }) as string,
        status: 0,
        failedCount: 0,
        uploadId: multipart.UploadId as string
      }
    );
  }
  return urls
}