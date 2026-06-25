import "./globals.css";
import { Inter } from "next/font/google";
import { AppProvider } from "../components/AppProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "Berlin Pong — Summer Championship",
  description: "Table tennis leaderboard for the crew. Add players, log games, climb the table.",
};

export const viewport = {
  themeColor: "#0c0c0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
