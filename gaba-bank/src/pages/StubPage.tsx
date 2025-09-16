import React from "react";

interface StubPageProps {
  title: string;
}

export const StubPage: React.FC<StubPageProps> = ({ title }) => {
  return (
    <div className="text-center py-20">
      <h1 className="font-display text-4xl font-bold text-foreground">
        {title}
      </h1>
      <p className="mt-4 text-lg text-secondary">
        This feature is under development. Check back soon!
      </p>
    </div>
  );
};
