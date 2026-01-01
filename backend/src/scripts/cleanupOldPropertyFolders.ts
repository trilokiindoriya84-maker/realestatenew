import { ListObjectsV2Command, DeleteObjectsCommand, ListObjectsV2CommandOutput, _Object } from '@aws-sdk/client-s3';
import { s3Client, bucketName } from '../utils/s3';

// Old folder structures to delete
const foldersToDelete = [
    // Old property document folders
    'property-documents/',
    'property-approvedMap/',
    'property-encumbrance/',
    'property-identityProof/',
    'property-khasra/',
    'property-ownership/',
    'property-propertyPhotos/',
    'property-saleDeed/',
    // Old verification folders
    'verifications/',
];

async function deleteFolder(prefix: string): Promise<void> {
    try {
        console.log(`\nDeleting folder: ${prefix}`);
        
        let continuationToken: string | undefined = undefined;
        let totalDeleted = 0;

        do {
            // List all objects in the folder (with pagination)
            const listCommand: ListObjectsV2Command = new ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: prefix,
                ContinuationToken: continuationToken,
                MaxKeys: 1000, // Max allowed by AWS S3/R2
            });
            
            const listResponse: ListObjectsV2CommandOutput = await s3Client.send(listCommand);
            
            if (!listResponse.Contents || listResponse.Contents.length === 0) {
                if (totalDeleted === 0) {
                    console.log(`  No objects found in ${prefix}`);
                }
                break;
            }
            
            // Delete all objects in this batch
            const objectsToDelete = listResponse.Contents.map((obj: _Object) => ({ Key: obj.Key! }));
            
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: bucketName,
                Delete: {
                    Objects: objectsToDelete,
                    Quiet: false,
                },
            });
            
            const deleteResponse = await s3Client.send(deleteCommand);
            const deletedCount = deleteResponse.Deleted?.length || 0;
            totalDeleted += deletedCount;
            
            console.log(`  Deleted ${deletedCount} objects (Total: ${totalDeleted})`);
            
            // Check if there are more objects to delete
            continuationToken = listResponse.IsTruncated ? listResponse.NextContinuationToken : undefined;
            
        } while (continuationToken);
        
        if (totalDeleted > 0) {
            console.log(`✓ Successfully deleted ${totalDeleted} objects from ${prefix}`);
        }
    } catch (error) {
        console.error(`✗ Error deleting folder ${prefix}:`, error);
    }
}

async function cleanupOldFolders() {
    console.log('='.repeat(60));
    console.log('CLOUDFLARE R2 CLEANUP SCRIPT');
    console.log('='.repeat(60));
    console.log('\nThis script will delete ALL old folder structures:');
    console.log('  - Old property-documents/ folders');
    console.log('  - Old verifications/ folders');
    console.log('\nNew structure will be:');
    console.log('  users/{email}_{userId}/verification/');
    console.log('  users/{email}_{userId}/properties/{propertyUniqueId}/{docType}/');
    console.log('\n' + '='.repeat(60));
    console.log('Starting cleanup...\n');
    
    for (const folder of foldersToDelete) {
        await deleteFolder(folder);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ CLEANUP COMPLETED!');
    console.log('='.repeat(60));
    console.log('\nOld folders have been deleted.');
    console.log('New uploads will use the new folder structure.');
}

// Run cleanup
cleanupOldFolders().catch(error => {
    console.error('Fatal error during cleanup:', error);
    process.exit(1);
});
