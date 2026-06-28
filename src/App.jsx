import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './sections/Hero';
import About from './sections/About';
import Education from './sections/Education';
import Projects from './sections/Projects';
import Photography from './sections/Photography';
import Blog from './sections/Blog';
import Contact from './sections/Contact';

// New Pages
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import PhotosGallery from './pages/PhotosGallery';
import Notes from './pages/Notes';
import Admin from './pages/Admin';

import './App.css';

// Scroll to hash utility component
const ScrollToHash = () => {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        if (hash) {
            const element = document.getElementById(hash.slice(1));
            if (element) {
                const timer = setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
                return () => clearTimeout(timer);
            }
        } else {
            window.scrollTo(0, 0);
        }
    }, [pathname, hash]);

    return null;
};

const Home = () => {
    return (
        <>
            <Hero />
            <About />
            <Education />
            <Projects />
            <Photography />
            <Blog />
            <Contact />
        </>
    );
};

function App() {
    return (
        <div className="portfolio-root">
            <ScrollToHash />
            <Navbar />
            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/blog" element={<BlogList />} />
                    <Route path="/blog/:slug" element={<BlogDetail />} />
                    <Route path="/photos" element={<PhotosGallery />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/admin" element={<Admin />} />
                </Routes>
            </main>
            <footer>
                <p>&copy; {new Date().getFullYear()} All rights reserved. Believe It!</p>
            </footer>
        </div>
    );
}

export default App;
