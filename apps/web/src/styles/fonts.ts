import { Noto_Sans_Ethiopic, Source_Sans_3 } from "next/font/google";

export const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const notoEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-noto-ethiopic",
  subsets: ["ethiopic"],
  display: "swap",
});
