import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as userService from '../services/userService';
import * as propertyService from '../services/propertyService';

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const users = await userService.getAllUsers();
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch users' });
    }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        return res.status(200).json({
            supabaseUser: req.user,
            dbUser: req.user.dbUser
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch current user' });
    }
};

export const blockUser = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { userId } = req.params;

        const updatedUser = await userService.blockUser(userId);

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'User blocked successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Block user error:', error);
        return res.status(500).json({ message: 'Failed to block user' });
    }
};

export const unblockUser = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { userId } = req.params;

        const updatedUser = await userService.unblockUser(userId);

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'User unblocked successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Unblock user error:', error);
        return res.status(500).json({ message: 'Failed to unblock user' });
    }
};

export const verifyUser = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { userId, isVerified } = req.body;

        // This will be implemented when we add user verification functionality
        return res.status(200).json({ message: 'User verification updated' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update verification status' });
    }
};

export const getAllProperties = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { status } = req.query;
        const properties = await propertyService.getAllProperties(status as string | undefined);
        return res.status(200).json(properties);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch properties' });
    }
};

export const getPropertyWithUserDetails = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        const propertyWithDetails = await propertyService.getPropertyWithUserDetails(uniqueId);
        
        if (!propertyWithDetails) {
            return res.status(404).json({ message: 'Property not found' });
        }

        return res.status(200).json(propertyWithDetails);
    } catch (error) {
        console.error('Get property with user details error:', error);
        return res.status(500).json({ message: 'Failed to fetch property details' });
    }
};

export const approveProperty = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        const adminId = req.user.id;

        const property = await propertyService.approvePropertyByUniqueId(uniqueId, adminId);
        
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        return res.status(200).json({ message: 'Property approved', property });
    } catch (error) {
        console.error('Approve property error:', error);
        return res.status(500).json({ message: 'Failed to approve property' });
    }
};

export const rejectProperty = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const property = await propertyService.rejectPropertyByUniqueId(uniqueId, reason);
        
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        return res.status(200).json({ message: 'Property rejected', property });
    } catch (error) {
        console.error('Reject property error:', error);
        return res.status(500).json({ message: 'Failed to reject property' });
    }
};

export const revokePropertyApproval = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'Revocation reason is required' });
        }

        const property = await propertyService.revokePropertyApprovalByUniqueId(uniqueId, reason);
        
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        return res.status(200).json({ message: 'Property approval revoked successfully', property });
    } catch (error) {
        console.error('Revoke property approval error:', error);
        return res.status(500).json({ message: 'Failed to revoke property approval' });
    }
};

// Published Properties Controllers
export const createOrUpdatePublishedProperty = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        const publishedData = req.body;

        console.log('Creating/Updating published property:', {
            uniqueId,
            dataKeys: Object.keys(publishedData),
            userId: req.user.id
        });

        const publishedProperty = await propertyService.createOrUpdatePublishedProperty(uniqueId, publishedData);
        
        console.log('Published property saved successfully:', publishedProperty.uniqueId);
        
        return res.status(200).json({ 
            message: 'Published property saved successfully', 
            property: publishedProperty 
        });
    } catch (error: any) {
        console.error('Create/Update published property error:', {
            error: error.message,
            stack: error.stack,
            uniqueId: req.params.uniqueId,
            userId: req.user?.id
        });
        return res.status(500).json({ 
            message: 'Failed to save published property',
            error: error.message 
        });
    }
};

export const getPublishedProperty = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        
        console.log('Getting published property:', uniqueId);
        
        const publishedProperty = await propertyService.getPublishedPropertyByUniqueId(uniqueId);
        
        if (!publishedProperty) {
            console.log('Published property not found:', uniqueId);
            return res.status(404).json({ message: 'Published property not found' });
        }

        console.log('Published property found:', publishedProperty.uniqueId);
        return res.status(200).json(publishedProperty);
    } catch (error: any) {
        console.error('Get published property error:', {
            error: error.message,
            stack: error.stack,
            uniqueId: req.params.uniqueId
        });
        return res.status(500).json({ 
            message: 'Failed to fetch published property',
            error: error.message 
        });
    }
};

export const publishPropertyLive = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        const adminId = req.user.id;

        console.log('Publishing property live:', {
            uniqueId,
            adminId
        });

        const publishedProperty = await propertyService.publishPropertyLive(uniqueId, adminId);
        
        console.log('Property published live successfully:', publishedProperty.uniqueId);
        
        return res.status(200).json({ 
            message: 'Property published live successfully', 
            property: publishedProperty 
        });
    } catch (error: any) {
        console.error('Publish property live error:', {
            error: error.message,
            stack: error.stack,
            uniqueId: req.params.uniqueId,
            adminId: req.user?.id
        });
        return res.status(500).json({ 
            message: 'Failed to publish property live',
            error: error.message 
        });
    }
};

export const unpublishProperty = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;

        const publishedProperty = await propertyService.unpublishProperty(uniqueId);
        
        return res.status(200).json({ 
            message: 'Property unpublished successfully', 
            property: publishedProperty 
        });
    } catch (error) {
        console.error('Unpublish property error:', error);
        return res.status(500).json({ message: 'Failed to unpublish property' });
    }
};

export const getAllPublishedProperties = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const publishedProperties = await propertyService.getAllPublishedProperties();
        
        console.log('Controller sending response, count:', publishedProperties.length);
        if (publishedProperties.length > 0) {
            console.log('First property being sent:', {
                uniqueId: publishedProperties[0].uniqueId,
                originalPropertyUniqueId: publishedProperties[0].originalPropertyUniqueId
            });
        }
        
        return res.status(200).json(publishedProperties);
    } catch (error) {
        console.error('Get all published properties error:', error);
        return res.status(500).json({ message: 'Failed to fetch published properties' });
    }
};


// Enquiry Management
export const getAllEnquiries = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const enquiries = await propertyService.getAllEnquiries();
        return res.status(200).json(enquiries);
    } catch (error) {
        console.error('Get all enquiries error:', error);
        return res.status(500).json({ message: 'Failed to fetch enquiries' });
    }
};

export const getPendingEnquiries = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const enquiries = await propertyService.getPendingEnquiries();
        return res.status(200).json(enquiries);
    } catch (error) {
        console.error('Get pending enquiries error:', error);
        return res.status(500).json({ message: 'Failed to fetch pending enquiries' });
    }
};

export const getEnquiryDetails = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        const details = await propertyService.getEnquiryDetails(uniqueId);
        
        if (!details) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }

        return res.status(200).json(details);
    } catch (error) {
        console.error('Get enquiry details error:', error);
        return res.status(500).json({ message: 'Failed to fetch enquiry details' });
    }
};

export const updateEnquiryStatus = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        const { status } = req.body;

        const updated = await propertyService.updateEnquiryStatus(uniqueId, status);
        return res.status(200).json({ message: 'Enquiry status updated', enquiry: updated });
    } catch (error) {
        console.error('Update enquiry status error:', error);
        return res.status(500).json({ message: 'Failed to update enquiry status' });
    }
};
