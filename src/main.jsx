import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Suppress all console output and errors
import '@/utils/consoleSuppression'

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 