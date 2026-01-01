
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, bucketName } from '../utils/s3';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

/**
 * Upload file to Cloudflare R2 with new folder structure
 * New structure: users/{email}_{userId}/verification/ or users/{email}_{userId}/properties/{propertyId}/
 */
export const uploadFile = async (
    file: Express.Multer.File, 
    folder: string = 'misc',
    customFileName?: string
): Promise<string> => {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = customFileName || `${uuidv4()}.${fileExtension}`;
    const key = `${folder}/${fileName}`;

    // Upload to Cloudflare R2
    await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read' // R2 usually manages access via bucket settings or worker
    }));

    // Construct Public URL
    // Ensure config.r2.publicUrl does not end with slash
    const baseUrl = config.r2.publicUrl ? config.r2.publicUrl.replace(/\/$/, '') : '';
    return `${baseUrl}/${key}`;
};

/**
 * Generate user folder path: users/{userName}_{userId}/
 * @param userName - User's full name (sanitized)
 * @param userId - User's unique ID
 */
export const getUserFolderPath = (userName: string, userId: string): string => {
    // Sanitize name for folder (remove special chars, replace spaces with underscore)
    const sanitizedName = userName
        .toLowerCase()
        .replace(/\s+/g, '_')           // Replace spaces with underscore
        .replace(/[^a-z0-9._-]/g, '_'); // Remove special characters
    return `users/${sanitizedName}_${userId}`;
};

/**
 * Generate verification folder path: users/{userName}_{userId}/verification/
 */
export const getVerificationFolderPath = (userName: string, userId: string): string => {
    return `${getUserFolderPath(userName, userId)}/verification`;
};

/**
 * Generate property folder path: users/{userName}_{userId}/properties/{propertyUniqueId}/{docType}/
 */
export const getPropertyFolderPath = (
    userName: string, 
    userId: string, 
    propertyUniqueId: string, 
    docType: string
): string => {
    return `${getUserFolderPath(userName, userId)}/properties/${propertyUniqueId}/${docType}`;
};

export const generatePresignedUrl = async (folder: string, contentType: string) => {
    const extension = contentType.split('/')[1] || 'bin';
    const key = `${folder}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
        // ACL: 'public-read'
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return { url, key };
};

