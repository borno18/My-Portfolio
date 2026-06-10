import Navbar from './components/Navbar'
import Hero from './sections/Hero'
import About from './sections/About'
import Education from './sections/Education'
import Projects from './sections/Projects'
import Photography from './sections/Photography'
import Contact from './sections/Contact'
import './App.css'

function App() {
    return (
        <div className="portfolio-root">
            <Navbar />
            <main>
                <Hero />
                <About />
                <Education />
                <Projects />
                <Photography />
                <Contact />
            </main>
            <footer>
                <p>&copy; {new Date().getFullYear()} All rights reserved. Believe It!</p>
            </footer>
        </div>
    )
}

export default App
