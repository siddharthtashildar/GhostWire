
import { ProtocolDistribution } from "@/components/pieChartDonut";
import { ThreatScoreCard } from "@/components/threatScore";
import { TrafficTimeline } from "@/components/traffic-Timeline";


function Dashboard() {
    return (
        <div className="">
            <div className="flex  items-top justify-between h-3/4 px-12 py-4 w-full gap-4">
                <div className=" border-2 border-border rounded-lg w-3/4 h-3/4">
                    <div className="flex items-center justify-between">
                        <div className="border-r-2 border-border px-4 py-2 w-1/3 h-30">
                            <h1 className="text-lg font-semibold text-muted-foreground">Total Packets</h1>
                            <div className="flex items-bottom justify-between mt-4 ">
                                <h1 className="text-3xl font-bold ml-2">1,234</h1>
                            </div>
                        </div>
                        <div className="px-4 w-1/3 py-2 h-30">
                            <h1 className="text-lg font-semibold text-muted-foreground">Packets Per Second</h1>
                            <div className="flex items-bottom justify-between mt-4 ">
                                <h1 className="text-3xl font-bold ml-2">567</h1>
                            </div>
                        </div>
                        <div className="border-l-2 border-border px-4 py-2 w-1/3 h-30">
                            <h1 className="text-lg font-semibold text-muted-foreground">Active Connections</h1>
                            <div className="flex items-bottom justify-between mt-4 ">
                                <h1 className="text-3xl font-bold ml-2">89</h1>
                            </div>
                        </div>
                    </div>
                    <div className="">
                        <div className="flex items-center justify-between border-t-2 border-border">
                            <div className="w-1/4 h-full background-card">
                                <ProtocolDistribution  />
                            </div>
                            <div className="w-3/4 ">
                                <TrafficTimeline />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="justify-top border-2 border-border rounded-lg  w-1/4 ">
                   
                        <ThreatScoreCard />
                    
                </div>
            </div>
            <div className=""></div>
        </div>
    );
}

export default Dashboard;