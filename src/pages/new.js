import SystemForm from "@/components/SystemForm"

const NewSystem = () => {
  const systemForm = {
    name: ''
  }

  return (
    <>
  <h1>New system</h1>
  <SystemForm formId="add-system-form" systemForm={systemForm} />
  </>
  )
}

export default NewSystem
