import React from "react";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/site-header/navbar";
import { getUser } from "@/auth";
import { SecondaryNavbar } from "@/components/site-header/secondary-navbar";
import { SiteFooter } from "@/components/site-footer/footer";

export default async function Layout({ children }: React.PropsWithChildren) {
  const user = await getUser();

  return (
    <React.Fragment>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      <Sidebar user={user} />
      <main className="pt-20 px-2 pb-16 sm:px-4 sm:pb-20 md:pb-20 lg:ml-[20%] lg:pb-16 xl:ml-[15%] overflow-y-auto">
        <SecondaryNavbar />
        {children}
        <SiteFooter />
      </main>
    </React.Fragment>
  );
}