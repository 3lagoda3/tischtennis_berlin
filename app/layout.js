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
  // Set the theme class before paint to avoid a light/dark flash.
  const noFlash = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
