import SystemForm from "@/components/SystemForm"

const NewSystem = () => {
  const systemForm = {
    name: ''
  }

  return (
    <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">New system</h1>
  <SystemForm formId="add-system-form" systemForm={systemForm} />
  </div>
  </>
  )
}

export default NewSystem
