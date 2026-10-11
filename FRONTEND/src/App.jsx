import React from 'react'

const App = () => {
  const [darkMode, setDarkMode] = useState(true);

useEffect(() => {
  document.documentElement.classList.toggle("dark", darkMode);
}, [darkMode]);

  return (
    <main>
      
    </main>
  )
}

export default App