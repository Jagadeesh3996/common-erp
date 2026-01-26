import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { HeaderActions } from "@/components/header-actions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Varamio ERP",
  description: "Varamio ERP",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userData = {
    name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
    email: user?.email || "",
    avatar: user?.user_metadata?.avatar || "",
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar user={userData} />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
                <div className="flex items-center gap-2 px-4 w-full">
                  <SidebarTrigger className="-ml-1 cursor-pointer" />
                  <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                  />
                  <DynamicBreadcrumbs />
                  <div className="ml-auto flex items-center gap-2">
                    <ModeToggle className="cursor-pointer" />
                    <HeaderActions className="cursor-pointer" />
                  </div>
                </div>
              </header>
              {children}
            </SidebarInset>
          </SidebarProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}