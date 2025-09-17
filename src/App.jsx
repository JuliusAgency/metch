import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/contexts/UserContext"

function App() {
  return (
    <UserProvider>
      <Pages />
      <Toaster />
    </UserProvider>
  )
}

export default App 