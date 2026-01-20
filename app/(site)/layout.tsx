import React from "react";

// TODO: This layout is incomplete - components need to be created
export default async function Layout({ children }: React.PropsWithChildren) {
  return (
    <React.Fragment>
      <main className="pt-20 px-2 pb-16 sm:px-4 sm:pb-20 md:pb-20 lg:pb-16 overflow-y-auto">
        {children}
      </main>
    </React.Fragment>
  );
}