import dbConnect from '@/lib/dbConnect'
import Journey from '@/models/Journey'

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req

  await dbConnect()

  switch (method) {
    case 'GET' /* Get a model by a point ID */:
      try {
        const journey = await Journey.find({points: {$elemMatch: {_id: id}}});
        if (!journey) {
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: journey })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break

    case 'PUT' /* Edit a model by a point ID */:
      try {      
        const journey = await Journey.findOneAndUpdate(
          {points: {$elemMatch:{_id: id}}}, 
          { $set: { 'points.$.name': req.body.name, 'points.$.location' : req.body.location, 'points.$.heading' : req.body.heading, 'points.$.pitch' : req.body.pitch, 'points.$.fov' : req.body.fov}
      }, {
          new: true,
          runValidators: true,
        })        
        if (!journey) {
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: journey })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break

    case 'DELETE' /* Delete a point by its ID */:
      try {
        const journey = await Journey.findOneAndUpdate(
          {points: {$elemMatch:{_id: id}}}, 
          // { $set: { 'points.$.name': req.body.name, 'points.$.location' : req.body.location}
          {$pull: {points: {_id: {$eq: id}}}}
      , {
          new: true,
          runValidators: true,
        })
        if (!journey) {
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: {} })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break

    case 'POST' /* Add a point by journey ID */ :
        console.log(id);
        try {                        
          const point = await Journey.findByIdAndUpdate(
                id, 
                { $addToSet: { points: req.body }}
          ) /* create a new point */
          res.status(201).json({ success: true, data: point })
        } catch (error) {
          res.status(400).json({ success: false })
        }
        break

    default:
      res.status(400).json({ success: false })
      break
  }
}
