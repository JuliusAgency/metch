import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/sonner"
import { UserProvider } from "@/contexts/UserContext"
import AccessibilityButton from "@/components/layout/AccessibilityButton"

function App() {
  return (
    <UserProvider>
      <Pages />
      <Toaster />
      <AccessibilityButton />
    </UserProvider>
  )
}

export default App 