import React from "react";
import { HomeHeroSection } from "./home/HomeHeroSection";
import { FeatureCards } from "./home/FeatureCards";
import { RecentActivity } from "./home/RecentActivity";

export const Home: React.FC = () => {
  return (
    <div className="space-y-16">
      <HomeHeroSection />
      <FeatureCards />
      <RecentActivity />
    </div>
  );
};
