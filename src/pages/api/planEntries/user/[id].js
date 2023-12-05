import dbConnect from '@/lib/dbConnect'
import PlanEntry from '@/models/PlanEntry'

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req

  await dbConnect()

  switch (method) {  
    case 'POST':      
        try {
            const plan = req.body;
            console.log("in api")
            console.log(plan);
            const insertedEntries = await PlanEntry.insertMany(plan);
        
            res.status(201).json({ success: true, data: insertedEntries });
            console.log(insertedEntries)
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });            
        }
        break  
    case 'DELETE':       
        try {          
          const deletedEntries = await PlanEntry.deleteMany({ userId: id }); // Delete all records with the specified userId
          res.status(200).json({ success: true, data: deletedEntries });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
        break

    default:
      res.status(400).json({ success: false })
      break
  }
}
