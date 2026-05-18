/**
 * Multipart file from Nest `FileInterceptor` with memory storage.
 * Defined locally so we do not rely on `Express.Multer` global augmentation
 * (conflicts with @types/express v5 in some IDE/tsconfig setups).
 */
export interface UploadedMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
