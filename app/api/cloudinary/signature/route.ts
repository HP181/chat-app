// app/api/cloudinary/signature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint') || 'general';

    // Set folder based on endpoint
    let folder = 'chat-app';
    if (endpoint === 'profile') {
      folder = 'chat-app/profiles';
    } else if (endpoint === 'group') {
      folder = 'chat-app/groups';
    } else if (endpoint === 'messageImage') {
      folder = 'chat-app/messages/images';
    } else if (endpoint === 'messageVideo') {
      folder = 'chat-app/messages/videos';
    }

    // Generate signature
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET || ''
    );

    return NextResponse.json({
      timestamp,
      signature,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    console.error('Error generating signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    );
  }
}