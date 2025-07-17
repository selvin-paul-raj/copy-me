import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { HomeIcon } from "lucide-react";

export default function HomeBtn() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push("/")}
      variant="ghost"
      className={cn(
        "group relative inline-flex items-center justify-start gap-2 px-5 py-2.5 mb-2 ",
        "bg-white text-gray-700 border-2 border-gray-200 rounded-md shadow-lg  flex justify-center",
        "transition-all duration-300 ease-in-out",
        "hover:translate-x-1 hover:-translate-y-0.5 hover:shadow-lg hover:bg-blue-50 hover:text-blue-600 focus:outline-none"
      )}
    >
      <HomeIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
      <span className="text-sm font-semibold tracking-wide">Go to Home</span>
    </Button>
  );
}
