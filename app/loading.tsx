import { Spinner } from "@/components/ui/spinner"
const Loading = () => {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex gap-2">
                <Spinner className="size-6" />
                <h1>Loading...</h1>
            </div>
        </div>
    );
};

export default Loading;