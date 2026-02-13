import Pages from "@/pages/index.jsx"
import { UserProvider } from "@/contexts/UserContext"
import { TooltipProvider } from "@/components/ui/tooltip"

function App() {
  return (
    <UserProvider>
      <TooltipProvider delayDuration={300}>
        <Pages />
      </TooltipProvider>
    </UserProvider>
  )
}

export default App 