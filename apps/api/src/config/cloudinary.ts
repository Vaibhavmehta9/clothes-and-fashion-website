import { v2 as cloudinary } from 'cloudinary';
import env from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

// Upload helper functions

export const uploadImage = async (
  filePath: string,
  folder: string,
  options: Record<string, unknown> = {}
): Promise<{ url: string; publicId: string }> => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `styleverse/${folder}`,
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    ...options,
  });
  return { url: result.secure_url, publicId: result.public_id };
};

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export const uploadMultipleImages = async (
  filePaths: string[],
  folder: string
): Promise<Array<{ url: string; publicId: string }>> => {
  const uploads = filePaths.map((fp) => uploadImage(fp, folder));
  return Promise.all(uploads);
};
