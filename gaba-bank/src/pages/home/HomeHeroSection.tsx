import React from "react";

export const HomeHeroSection: React.FC = () => {
  return (
    <div className="text-center relative">
      <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-full max-w-3xl h-72 bg-[var(--sun-500)]/20 rounded-full blur-3xl -z-10 opacity-40" />

      <h1
        className="font-display text-[50px] md:text-8xl font-bold tracking-tight !leading-tight animate-slide-in-bottom text-nowrap"
        style={{ animationDelay: "0.3s" }}
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-[var(--sand-200)] to-[var(--clay-400)]">
          Invest <span className="text-[var(--sun-400)] underline">simply</span>
          .
        </span>
      </h1>

      <p
        className=" max-w-xl mx-auto text-sm md:text-lg text-[var(--clay-400)] animate-slide-in-bottom tracking-normal"
        style={{ animationDelay: "0.5s" }}
      >
        <span className="text-[var(--sand-300)] text-pretty">
          Decentralized community banking
        </span>{" "}
        fostering entrepreneurship in communities excluded from traditional
        finance.
      </p>
    </div>
  );
};
