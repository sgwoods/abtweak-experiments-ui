export const metadata = {
  title: "AbTweak Remote Experiments",
  description:
    "Curated remote runner for the Masters of Mathematics AbTweak restoration project.",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
