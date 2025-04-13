import PasteImagesForm from "@/components/PasteImagesForm";

const PasteImages = () => {
  const pasteImagesForm = {
    imagesList: "",
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
        <h1 className="py-2 font-mono text-4xl">Import images</h1>
        <h2>
          Paste a list of your images into the box below and click 'Import'
        </h2>
        <PasteImagesForm
          formId="paste-images-form"
          pasteImagesForm={pasteImagesForm}
        />
      </div>
    </>
  );
};

export default PasteImages;
