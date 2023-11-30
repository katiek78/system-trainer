import PointForm from "@/components/PointForm"

const NewPoint = () => {
  const pointForm = {
    name: ''
  }

  return (
    <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">New location</h1>
  <PointForm formId="add-point-form" pointForm={pointForm} />
  </div>
  </>
  )
}

export default NewPoint
