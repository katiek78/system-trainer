import PointForm from "@/components/PointForm";
import { useRouter } from "next/router";

const NewPoint = () => {
  const router = useRouter();
  const { insertAt } = router.query;
  const pointForm = {
    name: "",
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
        <h1 className="py-2 font-mono text-4xl">New location</h1>
        <PointForm
          formId="add-point-form"
          pointForm={pointForm}
          insertAt={insertAt}
        />
      </div>
    </>
  );
};

export default NewPoint;
