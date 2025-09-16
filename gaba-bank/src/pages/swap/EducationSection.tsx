import React, { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible";
import { Button } from "../../components/ui/button";
import { BookOpen, ChevronDown, Waves, TrendingUp, Shield } from "lucide-react";

export const EducationSection: React.FC = () => {
  const [isEducationOpen, setIsEducationOpen] = useState(false);

  return (
    <Card className="bg-gradient-to-br from-[var(--earth-700)]/80 to-[var(--earth-800)]/80 border border-[rgba(245,242,237,0.15)]">
      <CardContent className="p-6">
        <Collapsible open={isEducationOpen} onOpenChange={setIsEducationOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-4 hover:bg-[var(--earth-700)]/40 rounded-xl"
            >
              <div className="flex items-center space-x-3 ">
                <BookOpen className="h-5 w-5 text-[var(--sand-300)]" />
                <span className="text-lg font-semibold text-[var(--sand-300)]">
                  How Swaps Work
                </span>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-[var(--clay-400)] transition-transform ${
                  isEducationOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Waves className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-[var(--sand-200)] text-2xl">
                  Liquidity Pools
                </h3>
                <p className="text-[var(--clay-400)] text-md leading-relaxed font-medium text-pretty">
                  Users provide BRLD and USDC tokens to a shared pool, earning
                  fees from trades in return.
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-[var(--sand-200)] text-2xl">
                  Automated Market Making
                </h3>
                <p className="text-[var(--clay-400)] text-md leading-relaxed font-medium text-pretty">
                  Smart contracts automatically set prices based on supply and
                  demand, no order books needed.
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-[var(--sand-200)] text-2xl">
                  Secure & Fast
                </h3>
                <p className="text-[var(--clay-400)] text-md leading-relaxed font-medium text-pretty">
                  Trades execute in 3-5 seconds on Stellar with minimal fees and
                  no intermediaries.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
