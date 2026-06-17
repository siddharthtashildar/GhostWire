
import { Button } from "@/components/ui/button";
import { House } from "lucide-react";
import { Noto_Sans_Bassa_Vah } from "next/font/google";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import Dashboard from "./pages/dashboard";

export default function Home() {
  return (
    <div className="">
      <Navbar />
      <main className="">
          <Dashboard />
      </main>
    </div>
  );
}
