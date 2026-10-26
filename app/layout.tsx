import { AccountProvider } from "@/components/AccountProvider";
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Access NUST — Disability & mobility access",
  description:
    "Wheelchair and mobility access at NUST H-12: entrances, ramps, washrooms, and your access needs.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AccountProvider>{children}</AccountProvider>
      </body>
    </html>
  );
}
