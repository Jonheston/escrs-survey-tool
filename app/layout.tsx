export const metadata = {
    title: "ESCRS Interactive Data Tool",
    description: "Interactive ESCRS survey explorer",
  };
  
  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en">
        <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" }}>
          {children}
        </body>
      </html>
    );
  }
  