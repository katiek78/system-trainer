import dbConnect from '@/lib/dbConnect'
import ImageSet from '@/models/ImageSet'

export default async function handler(req, res) {
    const {
        query: { id },
        method,
      } = req

  await dbConnect()

  switch (method) {
    case 'POST':
        try {
            // Fetch the ImageSet data based on the provided ID
            const imageSetToCopy = await ImageSet.findById(id);
        
            if (!imageSetToCopy) {
              return res.status(404).json({ success: false, error: 'ImageSet not found' });
            }
        
            // Modify the ImageSet data to create a copy (adjust as needed)
            const copiedImageSetData = { ...imageSetToCopy.toObject(), userId: req.body.userId };
            delete copiedImageSetData._id; // Remove the original ID to create a new copy
        
            // Create a copy of the ImageSet
            const copiedImageSet = await ImageSet.create(copiedImageSetData);
       
            res.status(201).json({ success: true, message: 'Image set copied successfully' });
          } catch (error) {
            res.status(500).json({ success: false, error: error.message });
          }
      break
    default:
      res.status(400).json({ success: false })
      break
  }
}
