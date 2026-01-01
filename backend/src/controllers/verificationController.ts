
import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { db } from '../db';
import { users, userVerifications } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { uploadFile, getVerificationFolderPath } from '../services/uploadService';

export const submitVerification = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { 
            fullName, fatherName, motherName, dateOfBirth,
            mobile, alternateMobile,
            address, city, state, pincode,
            aadharNumber, panNumber 
        } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } || {};

        // Check if user exists
        const currentUser = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
        if (!currentUser.length) return res.status(404).json({ message: 'User not found' });

        // Get user name for folder structure (use fullName from form or database)
        const userName = fullName || currentUser[0].fullName || 'user';
        const userId = req.user.id;

        // Generate verification folder path: users/{userName}_{userId}/verification/
        const verificationFolder = getVerificationFolderPath(userName, userId);

        // Check for existing verification
        const existingVerification = await db.select()
            .from(userVerifications)
            .where(eq(userVerifications.userId, req.user.id))
            .orderBy(desc(userVerifications.createdAt))
            .limit(1);

        const existingDocs = existingVerification.length ? {
            photo: existingVerification[0].photoUrl,
            aadharFront: existingVerification[0].aadharFrontUrl,
            aadharBack: existingVerification[0].aadharBackUrl,
            panCard: existingVerification[0].panCardUrl
        } : {};

        // Upload ONLY NEW files if provided, otherwise keep existing URLs
        // New structure: users/{userName}_{userId}/verification/{filename}
        const photoUrl = files.photo ? await uploadFile(files.photo[0], verificationFolder, 'photo.jpg') : existingDocs.photo;
        const aadharFrontUrl = files.aadharFront ? await uploadFile(files.aadharFront[0], verificationFolder, 'aadhaar_front.jpg') : existingDocs.aadharFront;
        const aadharBackUrl = files.aadharBack ? await uploadFile(files.aadharBack[0], verificationFolder, 'aadhaar_back.jpg') : existingDocs.aadharBack;
        const panCardUrl = files.panCard ? await uploadFile(files.panCard[0], verificationFolder, 'pan_card.pdf') : existingDocs.panCard;

        // Validation
        if (!photoUrl || !aadharFrontUrl) {
            return res.status(400).json({ message: 'Photo and Aadhar front are required.' });
        }

        const verificationData = {
            userId: req.user.id,
            fullName,
            fatherName,
            motherName,
            dateOfBirth,
            mobile,
            alternateMobile: alternateMobile || null,
            address,
            city,
            state,
            pincode,
            aadharNumber,
            panNumber,
            photoUrl,
            aadharFrontUrl,
            aadharBackUrl: aadharBackUrl || null,
            panCardUrl: panCardUrl || null,
            status: 'pending',
            updatedAt: new Date()
        };

        // UPDATE existing record if found, otherwise INSERT new record
        if (existingVerification.length) {
            // Update existing verification record
            await db.update(userVerifications)
                .set(verificationData)
                .where(eq(userVerifications.uniqueId, existingVerification[0].uniqueId));
        } else {
            // Insert new verification record (first time submission)
            const { generateUniqueId } = await import('../utils/slugGenerator');
            await db.insert(userVerifications).values({
                uniqueId: generateUniqueId(),
                ...verificationData,
                createdAt: new Date()
            });
        }

        // Update user status
        await db.update(users).set({
            verificationStatus: 'pending',
            phoneNumber: mobile,
            fullName: fullName,
            rejectionReason: null,
            updatedAt: new Date()
        }).where(eq(users.id, req.user.id));

        return res.status(200).json({ message: 'Verification submitted successfully' });

    } catch (error) {
        console.error('Verification submission error:', error);
        return res.status(500).json({ message: 'Failed to submit verification' });
    }
};

export const getVerificationStatus = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const user = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
        if (!user.length) return res.status(404).json({ message: 'User not found' });

        // Return minimal verification status only
        return res.status(200).json({
            status: user[0].verificationStatus,
            isVerified: user[0].isVerified
        });
    } catch (error) {
        console.error('Get verification status error:', error);
        return res.status(500).json({ message: 'Internal error' });
    }
};

// Admin: Get all requests
export const getAllVerificationRequests = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        // Get all users with their latest verification
        const allUsers = await db.select().from(users).orderBy(desc(users.updatedAt));
        const usersWithVerification = allUsers.filter(u => u.verificationStatus !== 'unverified');

        // Fetch verification details for each user and return full data for admin review
        const requests = await Promise.all(
            usersWithVerification.map(async (user) => {
                const verification = await db.select()
                    .from(userVerifications)
                    .where(eq(userVerifications.userId, user.id))
                    .orderBy(desc(userVerifications.createdAt))
                    .limit(1);

                // Return full user data for admin verification review
                return {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    verificationStatus: user.verificationStatus,
                    isVerified: user.isVerified,
                    rejectionReason: user.rejectionReason,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    // Full verification details for admin review
                    verificationDetails: verification.length ? {
                        fullName: verification[0].fullName,
                        fatherName: verification[0].fatherName,
                        motherName: verification[0].motherName,
                        dateOfBirth: verification[0].dateOfBirth,
                        mobile: verification[0].mobile,
                        alternateMobile: verification[0].alternateMobile,
                        address: verification[0].address,
                        city: verification[0].city,
                        state: verification[0].state,
                        pincode: verification[0].pincode,
                        aadharNumber: verification[0].aadharNumber,
                        panNumber: verification[0].panNumber,
                        photoUrl: verification[0].photoUrl,
                        aadharFrontUrl: verification[0].aadharFrontUrl,
                        aadharBackUrl: verification[0].aadharBackUrl,
                        panCardUrl: verification[0].panCardUrl,
                        status: verification[0].status,
                        createdAt: verification[0].createdAt,
                        updatedAt: verification[0].updatedAt
                    } : null
                };
            })
        );

        return res.status(200).json(requests);
    } catch (error) {
        console.error('Get all verification requests error:', error);
        return res.status(500).json({ message: 'Failed to fetch requests' });
    }
};

// Admin: Approve/Reject
export const updateVerificationStatus = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { userId, status, rejectionReason } = req.body;

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const isVerified = status === 'verified';

        // Update user status
        await db.update(users).set({
            verificationStatus: status,
            isVerified: isVerified,
            rejectionReason: status === 'rejected' ? rejectionReason : null,
            updatedAt: new Date()
        }).where(eq(users.id, userId));

        // Update latest verification record
        const latestVerification = await db.select()
            .from(userVerifications)
            .where(eq(userVerifications.userId, userId))
            .orderBy(desc(userVerifications.createdAt))
            .limit(1);

        if (latestVerification.length) {
            await db.update(userVerifications).set({
                status: status,
                rejectionReason: status === 'rejected' ? rejectionReason : null,
                verifiedAt: status === 'verified' ? new Date() : null,
                verifiedBy: status === 'verified' ? req.user.id : null,
                updatedAt: new Date()
            }).where(eq(userVerifications.uniqueId, latestVerification[0].uniqueId));
        }

        return res.status(200).json({ message: `User verification ${status}` });

    } catch (error) {
        console.error('Update verification status error:', error);
        return res.status(500).json({ message: 'Failed to update status' });
    }
};
