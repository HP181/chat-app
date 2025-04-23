import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

type UploadOptions = {
  folder?: string;
  overwrite?: boolean;
  resource_type?: "auto" | "image" | "video" | "raw";
};

// Define the CloudinaryUploadResult interface
interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  url: string;
  secure_url: string;
  original_filename: string;
  api_key?: string;
  asset_id?: string;
  // Add other fields that might be in the response
}

// Function to generate an upload signature for client-side uploads
export const generateSignature = (
  folder: string = 'chat-app',
  resourceType: "auto" | "image" | "video" | "raw" = 'auto'
): {
  timestamp: number;
  signature: string;
  folder: string;
  apiKey: string;
  cloudName: string;
  resourceType: string;
} => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = {
    timestamp,
    folder,
    // Add any other Cloudinary parameters you need
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET || ''
  );

  return {
    timestamp,
    signature,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
    resourceType,
  };
};

// Function for server-side uploading
export const uploadToCloudinary = async (
  file: string,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> => {
  const defaultOptions = {
    folder: 'chat-app',
    overwrite: true,
    resource_type: 'auto' as "auto" | "image" | "video" | "raw",
  };

  try {
    const result = await cloudinary.uploader.upload(file, {
      ...defaultOptions,
      ...options,
    });
    return result as CloudinaryUploadResult;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Function to get Cloudinary URL with transformations
export const getCloudinaryUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number;
    format?: string;
  } = {}
): string => {
  const defaultOptions = {
    width: 800,
    crop: 'limit',
    quality: 80,
    format: 'auto',
  };

  const mergedOptions = { ...defaultOptions, ...options };
  
  return cloudinary.url(publicId, mergedOptions);
};