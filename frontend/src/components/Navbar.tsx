"use client";

import { useEffect, useState } from "react";
import { Holtwood_One_SC } from "next/font/google";
import { Button } from "./ui/button";
import { ArrowUpDown, Earth, House, LayoutDashboard, Radio, Settings, Shield } from "lucide-react";
import {
    Avatar,
    AvatarBadge,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { ModeToggle } from "./toggleTheme";
import { getCaptureStatus, startCapture, stopCapture } from "@/lib/api";

function Navbar() {
    const [isCaptureRunning, setIsCaptureRunning] = useState(false);
    const [isToggleLoading, setIsToggleLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        const fetchStatus = async () => {
            try {
                const status = await getCaptureStatus();
                if (mounted) {
                    setIsCaptureRunning(status.running ?? false);
                }
            } catch (error) {
                console.error("Failed to load capture status:", error);
            }
        };

        fetchStatus();

        return () => {
            mounted = false;
        };
    }, []);

    const handleToggleCapture = async () => {
        setIsToggleLoading(true);

        try {
            if (isCaptureRunning) {
                await stopCapture();
                setIsCaptureRunning(false);
            } else {
                await startCapture({});
                setIsCaptureRunning(true);
            }
        } catch (error) {
            console.error("Failed to toggle capture:", error);
        } finally {
            setIsToggleLoading(false);
        }
    };

    return (
        <nav className=" sticky top-0 z-50 flex items-center justify-between border-b border-white/20 bg-white/30 backdrop-blur-md dark:border-neutral-800/30 dark:bg-neutral-900/30 p-4 w-full ">
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
                <Button
                    variant={isCaptureRunning ? "destructive" : "secondary"}
                    size="sm"
                    className="h-10"
                    onClick={handleToggleCapture}
                    disabled={isToggleLoading}
                >
                    {isCaptureRunning ? "Stop Capture" : "Start Capture"}
                </Button>
                <ModeToggle />
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