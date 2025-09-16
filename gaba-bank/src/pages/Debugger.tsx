import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Copy, Play, RotateCcw, Settings, Terminal } from "lucide-react";

interface DebugLog {
  id: string;
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: unknown;
}

const Debugger: React.FC = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [consoleInput, setConsoleInput] = useState("");
  const [networkStatus, setNetworkStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("connected");
  const [contractAddress, setContractAddress] = useState("");
  const [selectedTab, setSelectedTab] = useState("console");

  const addLog = (
    level: DebugLog["level"],
    message: string,
    data?: unknown,
  ) => {
    const newLog: DebugLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level,
      message,
      data,
    };
    setLogs((prev) => [...prev, newLog].slice(-100));
  };

  const executeConsoleCommand = () => {
    if (!consoleInput.trim()) return;

    addLog("info", `> ${consoleInput}`);

    try {
      const result = eval(consoleInput);
      addLog("info", String(result));
    } catch (error) {
      addLog(
        "error",
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    setConsoleInput("");
  };

  const clearLogs = () => {
    setLogs([]);
    addLog("info", "Console cleared");
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    addLog("info", "Copied to clipboard");
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString();
  };

  const getLevelColor = (level: DebugLog["level"]) => {
    switch (level) {
      case "error":
        return "destructive";
      case "warn":
        return "secondary";
      case "info":
        return "default";
      case "debug":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Contract Debugger</h1>
          <p className="text-muted-foreground">
            Debug and interact with your deployed contracts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={networkStatus === "connected" ? "default" : "destructive"}
          >
            {networkStatus}
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="console">Console</TabsTrigger>
              <TabsTrigger value="contract">Contract</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
            </TabsList>

            <TabsContent value="console" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">Debug Console</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={clearLogs}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-md h-80 overflow-y-auto">
                      {logs.length === 0 ? (
                        <div className="text-gray-500">Console ready...</div>
                      ) : (
                        logs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-start space-x-2 mb-1"
                          >
                            <span className="text-gray-500 text-xs">
                              {formatTimestamp(log.timestamp)}
                            </span>
                            <Badge
                              variant={getLevelColor(log.level)}
                              className="text-xs px-1 py-0"
                            >
                              {log.level}
                            </Badge>
                            <span className="flex-1">{log.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter command..."
                        value={consoleInput}
                        onChange={(e) => setConsoleInput(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && executeConsoleCommand()
                        }
                        className="font-mono"
                      />
                      <Button onClick={executeConsoleCommand}>
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contract" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contract Interaction</CardTitle>
                  <CardDescription>
                    Connect to and interact with deployed smart contracts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contract-address">Contract Address</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="contract-address"
                        placeholder="Enter contract address..."
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(contractAddress)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="method-call">Method Call</Label>
                    <Textarea
                      id="method-call"
                      placeholder="Enter method call..."
                      rows={4}
                    />
                  </div>

                  <Button className="w-full">
                    <Terminal className="h-4 w-4 mr-2" />
                    Execute Contract Call
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="network" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Network Information</CardTitle>
                  <CardDescription>
                    Monitor network status and blockchain data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Connected to Stellar Testnet
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Latest Block</Label>
                      <div className="font-mono text-sm">12,345,678</div>
                    </div>
                    <div>
                      <Label>Gas Price</Label>
                      <div className="font-mono text-sm">0.0001 XLM</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Network</span>
                <Badge
                  variant={
                    networkStatus === "connected" ? "default" : "destructive"
                  }
                >
                  {networkStatus}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Wallet</span>
                <Badge variant="default">Connected</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Contracts</span>
                <Badge variant="secondary">3 Loaded</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addLog("info", "Refreshing contracts...")}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh Contracts
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addLog("info", "Clearing cache...")}
              >
                <Terminal className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addLog("info", "Exporting logs...")}
              >
                <Copy className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Contract deployed</span>
                  <span className="text-muted-foreground">2m ago</span>
                </div>
                <div className="flex justify-between">
                  <span>Transaction confirmed</span>
                  <span className="text-muted-foreground">5m ago</span>
                </div>
                <div className="flex justify-between">
                  <span>Method invoked</span>
                  <span className="text-muted-foreground">8m ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Debugger;
