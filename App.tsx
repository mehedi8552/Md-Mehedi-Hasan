import React from 'react';
import ImageGenerator from './components/ImageGenerator';

const App: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
            <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    AI Headshot Generator
                </h1>
                <p className="text-lg md:text-xl text-gray-400 mt-2 max-w-2xl mx-auto">
                    Transform any photo into a stunning, professional headshot. Upload an image and let our AI do the rest.
                </p>
            </header>
            <main className="w-full max-w-4xl">
                <ImageGenerator />
            </main>
            <footer className="text-center mt-12 text-gray-500 text-sm">
                <p>Powered by Gemini. &copy; {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
};

export default App;