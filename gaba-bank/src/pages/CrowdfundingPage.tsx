import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { BookOpen, ChevronDown, Users, Vote, DollarSign } from "lucide-react";

export const CrowdfundingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("proposals");
  const [fundingAmount, setFundingAmount] = useState("");
  const [voteChoice, setVoteChoice] = useState<"for" | "against" | null>(null);
  const [isGovernanceOpen, setIsGovernanceOpen] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: "",
    description: "",
    fundingGoal: "",
    category: "",
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="font-display text-4xl font-bold text-foreground">DAO</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Providing accessible microcredit to quilombola entrepreneurs through
          community-driven governance
        </p>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="proposals">Loan Applications</TabsTrigger>
          <TabsTrigger value="voting">Voting</TabsTrigger>
          <TabsTrigger value="governance">How It Works</TabsTrigger>
        </TabsList>

        {/* Loan Applications Tab */}
        <TabsContent value="proposals" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
            {/* Proposal Card 1 */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>Maria Silva - Organic Farm</CardTitle>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Microcredit for expanding organic vegetable production in
                  Quilombo São José, Bahia
                </p>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Funded</span>
                    <span>3,700 / 5,000 USDC</span>
                  </div>
                  <Progress value={74} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Interest Rate</span>
                    <p className="font-medium">2.0% monthly</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Term</span>
                    <p className="font-medium">12 months</p>
                  </div>
                </div>
                <div className="mt-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-auto mb-0">
                        Fund Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          Fund Maria Silva's Organic Farm
                        </DialogTitle>
                        <DialogDescription>
                          Provide microcredit for expanding organic vegetable
                          production
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="funding-amount">
                            Loan Contribution (USDC)
                          </Label>
                          <Input
                            id="funding-amount"
                            placeholder="500"
                            value={fundingAmount}
                            onChange={(e) => setFundingAmount(e.target.value)}
                          />
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-sm">
                          <div className="flex justify-between">
                            <span>Your loan contribution:</span>
                            <span className="font-medium">
                              {fundingAmount || "0"} USDC
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Expected monthly return:</span>
                            <span className="font-medium">
                              {fundingAmount
                                ? (parseFloat(fundingAmount) * 0.02).toFixed(2)
                                : "0"}{" "}
                              USDC
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Loan term:</span>
                            <span className="font-medium">12 months</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-medium">
                            <span>Total expected return:</span>
                            <span>
                              {fundingAmount
                                ? (parseFloat(fundingAmount) * 1.24).toFixed(2)
                                : "0"}{" "}
                              USDC
                            </span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button>Provide Microcredit</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Proposal Card 2 */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>João Santos - Beekeeping</CardTitle>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Microcredit for honey production and bee equipment in Quilombo
                  Terra Prometida, Ceará
                </p>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Requested</span>
                    <span>2,500 USDC</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Voting Ends</span>
                    <p className="font-medium">3 days</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Term</span>
                    <p className="font-medium">18 months</p>
                  </div>
                </div>
                <div className="mt-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full mt-auto mb-0">
                        Vote on Proposal
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          Vote on João Santos' Beekeeping Loan
                        </DialogTitle>
                        <DialogDescription>
                          Cast your vote to approve or reject this microcredit
                          application
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <Label>Your Vote</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant={
                                voteChoice === "for" ? "default" : "outline"
                              }
                              onClick={() => setVoteChoice("for")}
                              className="h-12"
                            >
                              Vote For
                            </Button>
                            <Button
                              variant={
                                voteChoice === "against"
                                  ? "destructive"
                                  : "outline"
                              }
                              onClick={() => setVoteChoice("against")}
                              className="h-12"
                            >
                              Vote Against
                            </Button>
                          </div>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-sm">
                          <div className="flex justify-between">
                            <span>Your voting power:</span>
                            <span className="font-medium">
                              1,250 GABA (Active Member)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Your vote:</span>
                            <span className="font-medium capitalize">
                              {voteChoice || "Not selected"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button disabled={!voteChoice}>Submit Vote</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Voting Tab */}
        <TabsContent value="voting" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Open Voting Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Open Voting
                  <Badge variant="default">Live</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Community-wide votes where all token holders can participate
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Microcredit Interest Rate</h4>
                      <Badge variant="outline">2h left</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Reduce microcredit interest rate from 2.5% to 2.0% monthly
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>For: 67%</span>
                        <span>Against: 33%</span>
                      </div>
                      <Progress value={67} className="h-2" />
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">
                            Vote For
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            Vote Against
                          </Button>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            Vote on Microcredit Interest Rate
                          </DialogTitle>
                          <DialogDescription>
                            Reduce microcredit interest rate from 2.5% to 2.0%
                            monthly
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <Label>Your Vote</Label>
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                variant={
                                  voteChoice === "for" ? "default" : "outline"
                                }
                                onClick={() => setVoteChoice("for")}
                                className="h-12"
                              >
                                Vote For
                              </Button>
                              <Button
                                variant={
                                  voteChoice === "against"
                                    ? "destructive"
                                    : "outline"
                                }
                                onClick={() => setVoteChoice("against")}
                                className="h-12"
                              >
                                Vote Against
                              </Button>
                            </div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg text-sm">
                            <div className="flex justify-between">
                              <span>Current status:</span>
                              <span className="font-medium">
                                For: 67% | Against: 33%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Time remaining:</span>
                              <span className="font-medium">2 hours</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Your voting power:</span>
                              <span className="font-medium">
                                1,250 GABA (Active Member)
                              </span>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                          <Button disabled={!voteChoice}>Submit Vote</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Closed Voting Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Closed Voting
                  <Badge variant="secondary">Council Only</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Strategic decisions made by elected council members
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Emergency Relief Fund</h4>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Allocate 50K USDC for drought relief in Northeast
                      communities
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Council Votes
                        </span>
                        <p className="font-medium">7/12</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Threshold</span>
                        <p className="font-medium">67%</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      Council Members Only
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Voting History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Voting History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">
                      Youth Entrepreneurship Program
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Passed • 92% approval
                    </p>
                  </div>
                  <Badge variant="default">Implemented</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">External Mining Partnership</h4>
                    <p className="text-sm text-muted-foreground">
                      Failed • 18% approval
                    </p>
                  </div>
                  <Badge variant="destructive">Rejected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* How It Works Tab */}
        <TabsContent value="governance" className="space-y-6">
          <Card className="bg-gradient-to-br from-[var(--earth-700)]/80 to-[var(--earth-800)]/80 border border-[rgba(245,242,237,0.15)]">
            <CardContent className="p-6">
              <Collapsible
                open={isGovernanceOpen}
                onOpenChange={setIsGovernanceOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between p-4 hover:bg-[var(--earth-700)]/40 rounded-xl"
                  >
                    <div className="flex items-center space-x-3">
                      <BookOpen className="h-5 w-5 text-[var(--sand-300)]" />
                      <span className="text-lg font-semibold text-[var(--sand-300)]">
                        How Quilombola Microcredit Works
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-[var(--clay-400)] transition-transform ${
                        isGovernanceOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto">
                        <DollarSign className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-bold text-[var(--sand-200)] text-2xl">
                        Loan Application
                      </h3>
                      <p className="text-[var(--clay-400)] text-md leading-relaxed font-medium text-pretty">
                        Quilombola entrepreneurs submit business plans with
                        repayment schedules for community review.
                      </p>
                    </div>
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-bold text-[var(--sand-200)] text-2xl">
                        Community Assessment
                      </h3>
                      <p className="text-[var(--clay-400)] text-md leading-relaxed font-medium text-pretty">
                        7-day period for community members to review business
                        viability and entrepreneur credibility.
                      </p>
                    </div>
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto">
                        <Vote className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-bold text-[var(--sand-200)] text-2xl">
                        Democratic Funding
                      </h3>
                      <p className="text-[var(--clay-400)] text-md leading-relaxed font-medium text-pretty">
                        Community votes to approve loans with 67% consensus,
                        then funds are disbursed with mentorship.
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Additional Info Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Participation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Your GABA Tokens</span>
                    <span className="font-medium">1,250 GABA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Community Status</span>
                    <span className="font-medium">Active Member</span>
                  </div>
                  <Separator />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Vote on loan applications (min. 100 GABA)</p>
                    <p>• Submit loan applications (min. 1,000 GABA)</p>
                    <p>• Participate in community governance</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-3" variant="outline">
                        Apply for Microcredit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Apply for Microcredit</DialogTitle>
                        <DialogDescription>
                          Submit your business loan application for community
                          review
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="proposal-title">Business Name</Label>
                          <Input
                            id="proposal-title"
                            placeholder="Your business or project name"
                            value={newProposal.title}
                            onChange={(e) =>
                              setNewProposal({
                                ...newProposal,
                                title: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proposal-description">
                            Business Plan
                          </Label>
                          <Textarea
                            id="proposal-description"
                            placeholder="Describe your business idea, how you'll use the loan, and your repayment plan"
                            value={newProposal.description}
                            onChange={(e) =>
                              setNewProposal({
                                ...newProposal,
                                description: e.target.value,
                              })
                            }
                            className="min-h-[100px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="funding-goal">
                              Loan Amount (USDC)
                            </Label>
                            <Input
                              id="funding-goal"
                              placeholder="5000"
                              value={newProposal.fundingGoal}
                              onChange={(e) =>
                                setNewProposal({
                                  ...newProposal,
                                  fundingGoal: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category">Business Type</Label>
                            <Input
                              id="category"
                              placeholder="Agriculture, Beekeeping, Crafts, Food Production, Services"
                              value={newProposal.category}
                              onChange={(e) =>
                                setNewProposal({
                                  ...newProposal,
                                  category: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-sm">
                          <p className="font-medium mb-2">
                            Loan Application Guidelines:
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• Must be quilombola community member</li>
                            <li>
                              • Business plan required with repayment schedule
                            </li>
                            <li>• Community endorsement from 3 members</li>
                            <li>• 7-day assessment period</li>
                            <li>• 67% approval vote required</li>
                            <li>• Maximum loan: 10,000 USDC</li>
                          </ul>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button>Submit Loan Application (Cost: 10 GABA)</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Governance Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Open Governance</h4>
                    <p className="text-xs text-muted-foreground mb-1">
                      Community-wide decisions for loan approvals and policies
                    </p>
                    <p className="text-xs">
                      <strong>Threshold:</strong> 67% consensus
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Elder Council</h4>
                    <p className="text-xs text-muted-foreground mb-1">
                      Strategic decisions for large loans and emergency
                      situations
                    </p>
                    <p className="text-xs">
                      <strong>Threshold:</strong> 5/7 majority
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
