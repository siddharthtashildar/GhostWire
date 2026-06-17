import { Holtwood_One_SC } from "next/font/google";
import { Button } from "./ui/button";
import { ArrowUpDown, Earth, House, LayoutDashboard, Radio, Settings, Shield } from "lucide-react";
import {
    Avatar,
    AvatarBadge,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"


function Navbar() {
    return (
        <nav className="flex items-center justify-between p-4 w-full mt-3 ">
            <div className="text-lg font-bold flex items-left gap-4 ml-0">
                <h1>GhostWire</h1>

            </div>
            <div className="text-lg font-bold flex items-center gap-4">
                <Button variant="outline" className="h-12 w-12" >
                    <LayoutDashboard className=" h-full w-full" />
                </Button>
                <Button variant="outline" className="h-12 w-12" >
                    <Radio className=" h-full w-full" />
                </Button>
                <Button variant="outline" className="h-12 w-12" >
                    <Shield className=" h-full w-full" />
                </Button>
                <Button variant="outline" className="h-12 w-12" >
                    <ArrowUpDown className=" h-full w-full" />
                </Button>
                <Button variant="outline" className="h-12 w-12" >
                    <Earth className=" h-full w-full" />
                </Button>

            </div>
            <div className="text-lg font-bold flex items-center gap-4 align-center v" >
                <Button variant="outline" className="h-10 w-10 rounded-full" >
                    <Settings className=" h-full w-full" />
                </Button>
                <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                    <AvatarBadge className="bg-green-600 dark:bg-green-800" />
                </Avatar>
            </div>

        </nav>
    );
}

export { Navbar };