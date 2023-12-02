import { useRouter } from "next/router"
import useSWR from 'swr'
import PointForm from "@/components/PointForm"

const fetcher = (url) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => json.data)


const EditPoint = () => {
    const router = useRouter()
    const { id } = router.query
    const {
      data: journey,
      error,
      isLoading,
    } = useSWR(id ? `/api/points/${id}` : null, fetcher)
  
    if (error) return <p>Failed to load</p>
    if (isLoading) return <p>Loading...</p>
    if (!journey) return null  
    const thisJourney = Array.isArray(journey) ? journey[0] : journey;
    const point = thisJourney.points.filter(point => point._id === id)[0];  

    const pointForm = {
        name: point.name,    
        location: point.location,
        heading: point.heading,
        pitch: point.pitch,
        fov: point.fov,
        memoItem: point.memoItem
      }

  return (
    <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">Edit location</h1>
  <PointForm formId="add-point-form" pointForm={pointForm} forNewPoint={false} journeyId={thisJourney._id} />
  </div>
  </>
  )
}

export default EditPoint
