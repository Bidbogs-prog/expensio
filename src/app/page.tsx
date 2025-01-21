import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <div className="w-[100%] flex justify-center gap-5 relative h-screen">
      {" "}
      <div className="Income w-[300px] flex flex-col gap-3 absolute left-1">
        Income
        <Input />
        <Button> Add your Income</Button>
      </div>
      <div className="Expenses w-[300px] flex flex-col gap-3">
        Expense
        <Input />
        <Button> Add your Expenses here</Button>
      </div>
      <div className="absolute bg-black border-black h-[100%] w-[0.1%] left-[750px]"></div>
    </div>
  );
}
