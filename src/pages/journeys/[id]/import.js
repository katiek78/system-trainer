import ImportLocationsForm from "@/components/ImportLocationsForm"

const ImportLocations = () => {
  const importLocationsForm = {
    locationsList: ''
  }

  return (
    <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">Import locations</h1>
    <h2>Paste a list of your locations into the box below and click 'Import'</h2>
  <ImportLocationsForm formId="import-locations-form" importLocationsForm={importLocationsForm} />
  </div>
  </>
  )
}

export default ImportLocations
