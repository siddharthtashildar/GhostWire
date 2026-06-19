"use client"

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import Dashboard from "./pages/dashboard";
import { LivePacketFeed } from "@/components/livePacketFeed";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "radio" && <LivePacketFeed />}
        {activeTab === "shield" && (
          <div className="p-8 text-center text-muted-foreground">
            Shield view not implemented yet.
          </div>
        )}
        {activeTab === "arrows" && (
          <div className="p-8 text-center text-muted-foreground">
            Traffic analytics coming soon.
          </div>
        )}
        {activeTab === "settings" && (
          <div className="p-8 text-center text-muted-foreground">
            Settings will be available here.
          </div>
        )}
      </main>
    </div>
  );
}
