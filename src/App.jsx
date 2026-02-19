import { useEffect } from "react"
import Pages from "@/pages/index.jsx"
import { UserProvider } from "@/contexts/UserContext"
import { TooltipProvider } from "@/components/ui/tooltip"

import { initFacebookPixel } from "@/services/fbPixelService"

function App() {
  useEffect(() => {
    // Initialize Facebook Pixel
    initFacebookPixel();

    const hostname = window.location.hostname;
    const desiredDomain = 'app.metch.co.il';

    // Check if we are not on localhost and not on the desired domain
    // Also ensuring we are not in a preview deployment if that's desired (optional, but requested to enforce app.metch.co.il)
    // If you want to allow vercel preview URLs, you might need a more complex check, but the user asked to move to the valid subdomain.
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== desiredDomain) {
      // Correct protocol to https always for production
      const newUrl = `https://${desiredDomain}${window.location.pathname}${window.location.search}`;
      window.location.replace(newUrl);
    }
  }, []);

  return (
    <UserProvider>
      <TooltipProvider delayDuration={300}>
        <Pages />
      </TooltipProvider>
    </UserProvider>
  )
}

export default App 