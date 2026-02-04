import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/sonner"
import { UserProvider } from "@/contexts/UserContext"
import AccessibilityButton from "@/components/layout/AccessibilityButton"

import { TooltipProvider } from "@/components/ui/tooltip"

function App() {
  return (
    <UserProvider>
      <TooltipProvider delayDuration={300}>
        <Pages />
        <Toaster />
        <AccessibilityButton />
      </TooltipProvider>
    </UserProvider>
  )
}

export default App 