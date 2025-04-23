"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { X, Upload, FileImage, FileVideo } from "lucide-react";
import axios from "axios";

type FileUploadProps = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  endpoint: "messageImage" | "messageVideo" | "profile" | "group";
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const FileUpload = ({ value, onChange, disabled, endpoint }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [fileType, setFileType] = useState<"image" | "video" | null>(
    value ? (value.includes("image") ? "image" : "video") : null
  );

  const getSignature = useCallback(async () => {
    try {
      const response = await axios.get("/api/cloudinary/signature", {
        params: { endpoint },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to get upload signature:", error);
      throw error;
    }
  }, [endpoint]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const isImage = file.type.includes("image");
      const isVideo = file.type.includes("video");

      if (!isImage && !isVideo) {
        alert("Please upload an image or video file");
        return;
      }

      const maxAllowedSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

      if (file.size > maxAllowedSize) {
        alert(`File too large. Max allowed: ${isImage ? "10MB for images" : "100MB for videos"}`);
        return;
      }

      setFileType(isImage ? "image" : "video");

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      try {
        setIsUploading(true);

        const { timestamp, signature, folder, apiKey, cloudName } = await getSignature();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder);

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          formData
        );

        onChange(response.data.secure_url);
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Error uploading file. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, endpoint, getSignature]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || isUploading,
    accept: {
      'image/*': [],
      'video/*': []
    },
    maxFiles: 1,
  });

  const onClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setPreviewUrl(null);
    setFileType(null);
  }, [onChange]);

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition ${
        disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""
      } ${isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""}`}
    >
      <input {...getInputProps()} />

      {previewUrl ? (
        <div className="w-full relative">
          {fileType === "image" && (
            <Image
              src={previewUrl}
              alt="Uploaded"
              width={200}
              height={200}
              className="w-full h-auto max-h-64 object-contain rounded-md mx-auto"
            />
          )}
          {fileType === "video" && (
            <video 
              src={previewUrl} 
              controls 
              className="w-full h-auto max-h-64 object-contain rounded-md mx-auto"
            />
          )}
          <button
            onClick={onClear}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex flex-col items-center justify-center">
            {isUploading ? (
              <div className="animate-spin">
                <Upload className="h-10 w-10 text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-row space-x-2">
                <FileImage className="h-10 w-10 text-muted-foreground" />
                <FileVideo className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="text-center">
            {isUploading ? (
              <p className="text-sm text-muted-foreground">Uploading...</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  Drag & drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 10MB for images, 100MB for videos
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
